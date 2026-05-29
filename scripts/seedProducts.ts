import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'

type SeedProduct = {
  name: string
  price: number
  description: string
  category: string
  stock: number
}

const products: SeedProduct[] = [
  {
    name: 'Indigo Straight Fit Jeans',
    price: 2499,
    description:
      'Mid-rise straight fit jeans in deep indigo denim with mild whiskering, five-pocket styling, and a comfortable all-day stretch.',
    category: 'Jeans',
    stock: 42,
  },
  {
    name: 'Black Slim Stretch Jeans',
    price: 2799,
    description:
      'Clean black slim jeans made from stretch cotton denim with a tapered leg, tonal stitching, and a polished everyday finish.',
    category: 'Jeans',
    stock: 36,
  },
  {
    name: 'Light Wash Relaxed Jeans',
    price: 2299,
    description:
      'Relaxed light wash jeans with a soft worn-in feel, roomy thigh, classic button closure, and casual weekend styling.',
    category: 'Jeans',
    stock: 28,
  },
  {
    name: 'Grey Tapered Denim Jeans',
    price: 2599,
    description:
      'Grey tapered denim jeans with subtle fading, reinforced seams, and a modern fit that works with sneakers or boots.',
    category: 'Jeans',
    stock: 31,
  },
  {
    name: 'Navy Formal Trousers',
    price: 2199,
    description:
      'Navy flat-front trousers cut from a wrinkle-resistant fabric with a neat waistband, slim profile, and office-ready drape.',
    category: 'Trouser',
    stock: 45,
  },
  {
    name: 'Charcoal Pleated Trousers',
    price: 2399,
    description:
      'Charcoal trousers with front pleats, a tailored fall, belt loops, and a soft blended fabric for workdays and dinners.',
    category: 'Trouser',
    stock: 27,
  },
  {
    name: 'Khaki Chino Trousers',
    price: 1999,
    description:
      'Versatile khaki chinos with a clean tapered leg, side pockets, back welt pockets, and comfortable cotton twill construction.',
    category: 'Trouser',
    stock: 52,
  },
  {
    name: 'Olive Utility Trousers',
    price: 2299,
    description:
      'Olive utility trousers with reinforced pocketing, adjustable drawcord detail, and a relaxed fit for travel or daily wear.',
    category: 'Trouser',
    stock: 34,
  },
  {
    name: 'White Oxford Shirt',
    price: 1699,
    description:
      'Crisp white Oxford shirt with a button-down collar, breathable cotton weave, curved hem, and a smart regular fit.',
    category: 'Shirt',
    stock: 60,
  },
  {
    name: 'Sky Blue Linen Blend Shirt',
    price: 1899,
    description:
      'Sky blue linen blend shirt with a relaxed texture, roll-up sleeve tabs, and airy comfort for warm-weather dressing.',
    category: 'Shirt',
    stock: 38,
  },
  {
    name: 'Black Printed Casual Shirt',
    price: 1799,
    description:
      'Black casual shirt with a subtle all-over print, spread collar, lightweight fabric, and an easy untucked length.',
    category: 'Shirt',
    stock: 41,
  },
  {
    name: 'Olive Checked Flannel Shirt',
    price: 2099,
    description:
      'Soft olive checked flannel shirt with brushed cotton feel, chest pocket, and a warm layer-friendly regular fit.',
    category: 'Shirt',
    stock: 24,
  },
  {
    name: 'Classic White Crew Neck T-shirt',
    price: 799,
    description:
      'Essential white crew neck T-shirt made from soft cotton jersey with a clean neckline and reliable everyday fit.',
    category: 'T-shirt',
    stock: 75,
  },
  {
    name: 'Navy Pocket T-shirt',
    price: 899,
    description:
      'Navy cotton T-shirt with a single chest pocket, smooth jersey handfeel, and a relaxed shape for daily rotation.',
    category: 'T-shirt',
    stock: 58,
  },
  {
    name: 'Maroon Graphic T-shirt',
    price: 999,
    description:
      'Maroon graphic T-shirt with a soft screen print, ribbed crew neck, and breathable cotton fabric for casual styling.',
    category: 'T-shirt',
    stock: 47,
  },
  {
    name: 'Heather Grey Oversized T-shirt',
    price: 1099,
    description:
      'Heather grey oversized T-shirt with dropped shoulders, heavyweight jersey, and a streetwear-inspired boxy silhouette.',
    category: 'T-shirt',
    stock: 33,
  },
]

const payload = await getPayload({ config })

const categoryNames = Array.from(new Set(products.map((product) => product.category)))

for (const name of categoryNames) {
  const existing = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 1,
    where: {
      name: {
        equals: name,
      },
    },
  })

  if (!existing.docs[0]) {
    await payload.create({
      collection: 'categories',
      data: {
        name,
      },
    })
  }
}

const categories = await payload.find({
  collection: 'categories',
  depth: 0,
  limit: 100,
})

const categoryIdsByName = new Map(categories.docs.map((category) => [category.name, category.id]))

for (const product of products) {
  const categoryId = categoryIdsByName.get(product.category)

  if (!categoryId) {
    throw new Error(`Missing category "${product.category}". Create it before seeding products.`)
  }

  const existing = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 1,
    where: {
      name: {
        equals: product.name,
      },
    },
  })

  const data = {
    name: product.name,
    price: product.price,
    description: product.description,
    category: categoryId,
    stock: product.stock,
  }

  if (existing.docs[0]) {
    await payload.update({
      collection: 'products',
      id: existing.docs[0].id,
      data,
    })
  } else {
    await payload.create({
      collection: 'products',
      data,
    })
  }
}

console.log(`Seeded ${products.length} products across ${categoryIdsByName.size} categories.`)
process.exit(0)
