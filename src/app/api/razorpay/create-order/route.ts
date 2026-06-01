import configPromise from '@payload-config'
import { getPayload } from 'payload'

type CartItem = {
  id?: string
  quantity?: number
}

type CheckoutLine = {
  id: string
  name: string
  price: number
  quantity: number
}

const currency = 'INR'

const getRazorpayAuthHeader = () => {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured')
  }

  return {
    keyId,
    authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
  }
}

const normalizeCart = (items: CartItem[]) =>
  items
    .filter(
      (item): item is Required<CartItem> => Boolean(item.id) && typeof item.quantity === 'number',
    )
    .map((item) => ({
      id: item.id,
      quantity: Math.max(1, Math.floor(item.quantity)),
    }))

export async function POST(request: Request) {
  try {
    const { items } = await request.json()
    const cart = normalizeCart(Array.isArray(items) ? items : [])

    if (cart.length === 0) {
      return Response.json({ message: 'Cart is empty' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const lines: CheckoutLine[] = []

    for (const item of cart) {
      const product = await payload.findByID({
        collection: 'products',
        id: item.id,
        depth: 0,
      })

      if (!product || typeof product.price !== 'number') {
        continue
      }

      const stock = typeof product.stock === 'number' ? product.stock : 0
      const quantity = Math.min(item.quantity, Math.max(stock, 0))

      if (quantity > 0) {
        lines.push({
          id: String(product.id),
          name: product.name,
          price: product.price,
          quantity,
        })
      }
    }

    if (lines.length === 0) {
      return Response.json({ message: 'No available products in cart' }, { status: 400 })
    }

    const amount = Math.round(
      lines.reduce((sum, line) => sum + line.price * line.quantity, 0) * 100,
    )
    const { authorization, keyId } = getRazorpayAuthHeader()

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      body: JSON.stringify({
        amount,
        currency,
        notes: {
          source: 'ShopSphere',
          itemCount: String(lines.reduce((sum, line) => sum + line.quantity, 0)),
        },
        receipt: `shopsphere_${Date.now()}`,
      }),
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const razorpayOrder = await razorpayRes.json()

    if (!razorpayRes.ok) {
      return Response.json(
        { message: razorpayOrder?.error?.description ?? 'Unable to create payment order' },
        { status: 502 },
      )
    }

    return Response.json({
      amount,
      currency,
      keyId,
      lines,
      orderId: razorpayOrder.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start checkout'

    return Response.json({ message }, { status: 500 })
  }
}
