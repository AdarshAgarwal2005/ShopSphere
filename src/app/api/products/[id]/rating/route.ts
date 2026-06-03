import configPromise from '@payload-config'
import { getPayload } from 'payload'

type StoredProductRating = {
  rating?: number | null
  user?: unknown
}

const userIdFromRating = (rating: StoredProductRating) => {
  if (typeof rating.user === 'string') {
    return rating.user
  }

  if (typeof rating.user === 'object' && rating.user && 'id' in rating.user) {
    return String(rating.user.id)
  }

  return ''
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const [{ id }, payload] = await Promise.all([params, getPayload({ config: configPromise })])

  const authRes = await fetch(new URL('/api/users/me', req.url), {
    cache: 'no-store',
    headers: {
      cookie: req.headers.get('cookie') ?? '',
    },
  })
  const authData = await authRes.json().catch(() => null)
  const user = authData?.user

  if (!user?.id) {
    return Response.json({ message: 'Login required' }, { status: 401 })
  }

  let ratingValue = 0

  try {
    const data = (await req.json()) as { rating?: unknown }
    ratingValue = Number(data.rating)
  } catch {
    return Response.json({ message: 'Unable to read rating.' }, { status: 400 })
  }

  if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    return Response.json({ message: 'Rating must be between 1 and 5 stars.' }, { status: 400 })
  }

  const product = await payload.findByID({
    collection: 'products',
    depth: 0,
    id,
  })
  const productWithRatings = product as typeof product & { ratings?: StoredProductRating[] }
  const existingRatings = Array.isArray(productWithRatings.ratings)
    ? productWithRatings.ratings
    : []
  const nextRatings = existingRatings.filter((rating) => userIdFromRating(rating) !== user.id)

  nextRatings.push({
    rating: ratingValue,
    user: user.id,
  })

  const ratingTotal = nextRatings.reduce((sum, rating) => sum + Number(rating.rating ?? 0), 0)
  const ratingCount = nextRatings.length
  const averageRating = Number((ratingTotal / ratingCount).toFixed(1))

  const updatedProduct = await payload.update({
    collection: 'products',
    data: {
      averageRating,
      ratingCount,
      ratingTotal,
      ratings: nextRatings,
    } as Record<string, unknown>,
    depth: 1,
    id,
  })

  return Response.json({ product: updatedProduct })
}
