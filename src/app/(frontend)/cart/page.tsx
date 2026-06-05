'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { StoreFooter } from '../components/StoreFooter'
import { UserThumbnail } from '../components/UserThumbnail'

type Media = {
  url?: string
  alt?: string
}

type Product = {
  id: string
  name: string
  price: number
  description?: string
  stock?: number
  image?: Media | string
}

type CartItem = {
  id: string
  quantity: number
}

type CartLine = CartItem & {
  product: Product
}

type User = {
  avatar?: Media | string | null
  avatarDataUrl?: string | null
  email?: string
  name?: string | null
}

type RazorpayCheckoutResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayOptions = {
  amount: number
  currency: string
  description: string
  handler: (response: RazorpayCheckoutResponse) => void
  key: string
  name: string
  order_id: string
  prefill?: {
    email?: string
  }
  theme?: {
    color?: string
  }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void
    }
  }
}

const CART_KEY = 'shopsphere-cart'

const formatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
})

const productImage = (product: Product) =>
  typeof product.image === 'object' && product.image?.url ? product.image.url : undefined

const readCart = (): CartItem[] => {
  try {
    const rawCart = window.localStorage.getItem(CART_KEY)
    const cart = rawCart ? JSON.parse(rawCart) : []

    return Array.isArray(cart) ? cart : []
  } catch {
    return []
  }
}

const writeCart = (cart: CartItem[]) => {
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart))
}

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

export default function CartPage() {
  const [lines, setLines] = useState<CartLine[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkoutStatus, setCheckoutStatus] = useState('')
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadCart = async () => {
      try {
        const cart = readCart()
        const userRes = await fetch('/api/users/me', {
          credentials: 'include',
        })
        const userData = await userRes.json().catch(() => null)

        if (!isMounted) {
          return
        }

        setUser(userData?.user ?? null)

        if (cart.length === 0) {
          setLines([])
          return
        }

        const res = await fetch('/api/products?depth=1&limit=100')

        if (!res.ok) {
          throw new Error('Unable to load cart products')
        }

        const data = await res.json()
        const products: Product[] = data.docs ?? []
        const nextLines = cart
          .map((item) => {
            const product = products.find((candidate) => candidate.id === item.id)

            return product ? { ...item, product } : null
          })
          .filter((line): line is CartLine => Boolean(line))

        if (isMounted) {
          setLines(nextLines)
        }
      } catch {
        if (isMounted) {
          setError('Something went wrong while loading your cart.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadCart()

    return () => {
      isMounted = false
    }
  }, [])

  const updateQuantity = (id: string, quantity: number) => {
    const nextLines = lines
      .map((line) => {
        if (line.id !== id) {
          return line
        }

        const stock = line.product.stock ?? 1
        return { ...line, quantity: Math.max(1, Math.min(stock, quantity)) }
      })
      .filter((line) => line.quantity > 0)

    setLines(nextLines)
    writeCart(
      nextLines.map(({ id: lineId, quantity: lineQuantity }) => ({
        id: lineId,
        quantity: lineQuantity,
      })),
    )
  }

  const removeItem = (id: string) => {
    const nextLines = lines.filter((line) => line.id !== id)
    setLines(nextLines)
    writeCart(nextLines.map(({ id: lineId, quantity }) => ({ id: lineId, quantity })))
  }

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
    [lines],
  )

  const cartItems = () => lines.map(({ id, quantity }) => ({ id, quantity }))

  const checkout = async () => {
    setError('')
    setCheckoutStatus('')
    setCheckingOut(true)

    try {
      const scriptLoaded = await loadRazorpayScript()

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Unable to load Razorpay checkout.')
      }

      const orderRes = await fetch('/api/razorpay/create-order', {
        body: JSON.stringify({
          items: cartItems(),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const orderData = await orderRes.json()

      if (!orderRes.ok) {
        throw new Error(orderData?.message ?? 'Unable to start checkout.')
      }

      const razorpay = new window.Razorpay({
        amount: orderData.amount,
        currency: orderData.currency,
        description: 'ShopSphere order',
        handler: async (response) => {
          const verifyRes = await fetch('/api/razorpay/verify-payment', {
            body: JSON.stringify({
              ...response,
              customerEmail: user?.email,
              items: cartItems(),
            }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          })
          const verifyData = await verifyRes.json().catch(() => null)

          if (!verifyRes.ok) {
            setError(verifyData?.message ?? 'Payment verification failed.')
            setCheckingOut(false)
            return
          }

          writeCart([])
          setLines([])
          setCheckoutStatus('Payment successful. Your order is confirmed.')
          setCheckingOut(false)
        },
        key: orderData.keyId,
        name: 'ShopSphere',
        order_id: orderData.orderId,
        prefill: {
          email: user?.email,
        },
        theme: {
          color: '#16686b',
        },
      })

      razorpay.open()
      setCheckingOut(false)
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : 'Unable to start Razorpay checkout.',
      )
      setCheckingOut(false)
    }
  }

  if (loading) {
    return (
      <main className="store-shell">
        <div className="loading-screen">
          <div className="loader" />
          <p>Loading cart...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="store-shell">
      <nav className="site-nav">
        <Link className="brand" href="/">
          <span className="brand-mark">S</span>
          <span>ShopSphere</span>
        </Link>
        <Link className="link-button ghost" href="/">
          Continue shopping
        </Link>
        <UserThumbnail user={user} />
      </nav>

      <section className="cart-header">
        <div>
          <p className="eyebrow">Shopping cart</p>
          <h1>Your selected products</h1>
        </div>
        <div className="cart-total">
          <span>Total</span>
          <strong>{formatter.format(total)}</strong>
        </div>
      </section>

      {error && <p className="alert">{error}</p>}
      {checkoutStatus && <p className="success-message">{checkoutStatus}</p>}

      {lines.length === 0 ? (
        <section className="empty-cart">
          <h2>Your cart is empty.</h2>
          <p>
            Add products from the catalog and they will appear here with quantities and total price.
          </p>
          <Link className="link-button dark" href="/">
            Browse products
          </Link>
        </section>
      ) : (
        <section className="cart-layout">
          <div className="cart-lines">
            {lines.map((line) => {
              const image = productImage(line.product)

              return (
                <article className="cart-line" key={line.id}>
                  <Link className="cart-line-media" href={`/products/${line.id}`}>
                    {image ? <img src={image} alt={line.product.name} /> : <span>No image</span>}
                  </Link>

                  <div className="cart-line-copy">
                    <Link href={`/products/${line.id}`}>
                      <h2>{line.product.name}</h2>
                    </Link>
                    <p>{line.product.description}</p>
                    <strong>{formatter.format(line.product.price)}</strong>
                  </div>

                  <div className="cart-line-actions">
                    <div className="cart-controls" aria-label={`Quantity for ${line.product.name}`}>
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.id, line.quantity - 1)}
                      >
                        -
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(line.id, line.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <span>{formatter.format(line.product.price * line.quantity)}</span>
                    <button
                      className="remove-button"
                      type="button"
                      onClick={() => removeItem(line.id)}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          <aside className="cart-summary">
            <h2>Order total</h2>
            <div>
              <span>Items</span>
              <strong>{lines.reduce((sum, line) => sum + line.quantity, 0)}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{formatter.format(total)}</strong>
            </div>
            <p className="payment-note">Secure test payment powered by Razorpay.</p>
            <button
              className="submit-button"
              type="button"
              onClick={checkout}
              disabled={checkingOut}
            >
              {checkingOut ? 'Starting checkout...' : 'Pay with Razorpay'}
            </button>
          </aside>
        </section>
      )}
      <StoreFooter />
    </main>
  )
}
