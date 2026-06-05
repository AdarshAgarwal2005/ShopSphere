import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { Category, Product } from '@/payload-types'

type ChatRequest = {
  question?: unknown
}

type CatalogProduct = {
  category: string
  description: string
  id: string
  name: string
  price: number
  rating: number
  stock: number
}

type GeminiResponse = {
  candidates?: {
    content?: {
      parts?: {
        text?: string
      }[]
    }
  }[]
  error?: {
    message?: string
  }
}

const formatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
})

const tokenPattern = /[a-z0-9]+/gi

const getCategoryName = (product: Product) => {
  const category = product.category

  if (typeof category === 'object' && category) {
    return (category as Category).name || 'Uncategorized'
  }

  return 'Uncategorized'
}

const normalizeProduct = (product: Product): CatalogProduct => ({
  category: getCategoryName(product),
  description: product.description || '',
  id: String(product.id),
  name: product.name,
  price: product.price,
  rating: typeof product.averageRating === 'number' ? product.averageRating : 0,
  stock: typeof product.stock === 'number' ? product.stock : 0,
})

const tokensFromQuestion = (question: string) =>
  Array.from(new Set(question.toLowerCase().match(tokenPattern) ?? [])).filter(
    (token) => token.length > 2,
  )

const scoreProduct = (product: CatalogProduct, tokens: string[]) => {
  const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase()

  return tokens.reduce((score, token) => {
    if (product.name.toLowerCase().includes(token)) {
      return score + 4
    }

    if (product.category.toLowerCase().includes(token)) {
      return score + 3
    }

    if (haystack.includes(token)) {
      return score + 1
    }

    return score
  }, 0)
}

const catalogForPrompt = (products: CatalogProduct[]) =>
  products
    .map((product, index) => {
      const stockStatus = product.stock > 0 ? `${product.stock} in stock` : 'out of stock'
      const rating = product.rating > 0 ? `${product.rating.toFixed(1)}/5` : 'not rated yet'

      return `${index + 1}. ${product.name} | ${formatter.format(product.price)} | ${
        product.category
      } | ${stockStatus} | rating ${rating} | ${product.description || 'No description'}`
    })
    .join('\n')

const extractGeminiText = (data: GeminiResponse) =>
  data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim()

const fallbackReply = (question: string, products: CatalogProduct[]) => {
  const productList = products
    .slice(0, 4)
    .map((product) => `${product.name} (${formatter.format(product.price)})`)
    .join(', ')

  if (!productList) {
    return 'SphereAI could not find any in-stock products to recommend right now.'
  }

  return `Based on "${question}", I would start with ${productList}. These are real in-stock ShopSphere products, so you can open the catalog and compare them before checkout.`
}

const productLinks = (products: CatalogProduct[]) =>
  products.slice(0, 4).map((product) => ({
    category: product.category,
    href: `/products/${product.id}`,
    id: product.id,
    name: product.name,
    price: product.price,
    rating: product.rating,
    stock: product.stock,
  }))

export async function POST(req: Request) {
  const authRes = await fetch(new URL('/api/users/me', req.url), {
    cache: 'no-store',
    headers: {
      cookie: req.headers.get('cookie') ?? '',
    },
  })
  const authData = await authRes.json().catch(() => null)
  const user = authData?.user

  if (!user?.id) {
    return Response.json({ message: 'Login required to use SphereAI.' }, { status: 401 })
  }

  let question = ''

  try {
    const body = (await req.json()) as ChatRequest
    question = typeof body.question === 'string' ? body.question.trim() : ''
  } catch {
    return Response.json({ message: 'Ask SphereAI a product question.' }, { status: 400 })
  }

  if (question.length < 2) {
    return Response.json({ message: 'Ask SphereAI a product question.' }, { status: 400 })
  }

  if (question.length > 600) {
    return Response.json({ message: 'Please keep your question under 600 characters.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const productData = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 60,
    sort: '-averageRating',
  })

  const catalog = productData.docs.map(normalizeProduct)
  const tokens = tokensFromQuestion(question)
  const scoredProducts = catalog
    .map((product) => ({ product, score: scoreProduct(product, tokens) }))
    .sort((a, b) => b.score - a.score || b.product.rating - a.product.rating)

  const matchingProducts = scoredProducts.filter(({ score }) => score > 0).map(({ product }) => product)
  const promptProducts = (matchingProducts.length > 0 ? matchingProducts : catalog)
    .filter((product) => product.stock > 0)
    .slice(0, 12)

  if (promptProducts.length === 0) {
    return Response.json({
      reply: 'SphereAI could not find any in-stock products to recommend right now.',
    })
  }

  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return Response.json({
      products: productLinks(promptProducts),
      reply: fallbackReply(question, promptProducts),
    })
  }

  const prompt = `You are SphereAI, the shopping assistant for ShopSphere.
Answer the shopper using only the real products in the catalog below.
Do not invent products, prices, colors, stock, ratings, links, discounts, or policies.
If the catalog does not contain an exact match, say that and suggest the closest real options.
Keep the answer friendly, practical, and under 130 words. Mention product names and prices.

Shopper question:
${question}

Available catalog:
${catalogForPrompt(promptProducts)}`

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 220,
          temperature: 0.45,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  )

  const geminiData = (await geminiRes.json().catch(() => ({}))) as GeminiResponse

  if (!geminiRes.ok) {
    return Response.json({
      products: productLinks(promptProducts),
      reply: fallbackReply(question, promptProducts),
      source: geminiData.error?.message ? 'catalog-fallback' : 'catalog',
    })
  }

  const reply = extractGeminiText(geminiData)

  return Response.json({
    products: productLinks(promptProducts),
    reply: reply || 'SphereAI could not answer right now.',
  })
}
