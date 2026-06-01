import crypto from 'crypto'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

type CartItem = {
  id?: string
  quantity?: number
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

const calculateTotal = async (items: CartItem[]) => {
  const payload = await getPayload({ config: configPromise })
  const cart = normalizeCart(items)
  let totalAmount = 0
  const productIds: string[] = []

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
      totalAmount += product.price * quantity
      productIds.push(String(product.id))
    }
  }

  return { payload, productIds, totalAmount }
}

export async function POST(request: Request) {
  try {
    const {
      customerEmail,
      items,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = await request.json()

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return Response.json({ message: 'Payment response is incomplete' }, { status: 400 })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keySecret) {
      return Response.json({ message: 'Razorpay secret is not configured' }, { status: 500 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expectedSignature !== razorpaySignature) {
      return Response.json({ message: 'Payment verification failed' }, { status: 400 })
    }

    const { payload, productIds, totalAmount } = await calculateTotal(
      Array.isArray(items) ? items : [],
    )

    if (productIds.length === 0 || totalAmount <= 0) {
      return Response.json({ message: 'Cart is empty' }, { status: 400 })
    }

    const order = await payload.create({
      collection: 'orders',
      data: {
        customerEmail:
          typeof customerEmail === 'string' && customerEmail.includes('@')
            ? customerEmail
            : 'guest@shopsphere.local',
        products: productIds,
        status: 'confirmed',
        totalAmount,
      },
    })

    return Response.json({
      orderId: order.id,
      paymentId: razorpayPaymentId,
      success: true,
    })
  } catch {
    return Response.json({ message: 'Unable to verify payment' }, { status: 500 })
  }
}
