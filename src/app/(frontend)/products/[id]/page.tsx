'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { StoreFooter } from '../../components/StoreFooter'
import { UserThumbnail } from '../../components/UserThumbnail'

type Category = {
  id?: string
  name?: string
}

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
  category?: Category | string
  image?: Media | string
}

type CartItem = {
  id: string
  quantity: number
}

type User = {
  avatar?: Media | string | null
  avatarDataUrl?: string | null
  email: string
  name?: string | null
}

const CART_KEY = 'shopsphere-cart'

const formatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
})

const categoryName = (product: Product) =>
  typeof product.category === 'object' && product.category?.name
    ? product.category.name
    : 'New Arrival'

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

const cartCountFromStorage = () => {
  if (typeof window === 'undefined') {
    return 0
  }

  return readCart().reduce((sum, item) => sum + item.quantity, 0)
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const [user, setUser] = useState<User | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [error, setError] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [cartCount, setCartCount] = useState(cartCountFromStorage)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const userRes = await fetch('/api/users/me', {
          credentials: 'include',
        })
        const userData = await userRes.json()

        if (!userData.user) {
          setProduct(null)
          return
        }

        setUser(userData.user)

        const res = await fetch(`/api/products/${params.id}?depth=1`)

        if (!res.ok) {
          throw new Error('Product not found')
        }

        const data = await res.json()
        setProduct(data)
      } catch {
        setError('We could not find that product.')
      } finally {
        setAuthChecked(true)
        setLoading(false)
      }
    }

    if (params.id) {
      loadProduct()
    }
  }, [params.id])

  const stock = product?.stock ?? 0
  const isUnavailable = stock <= 0
  const image = product ? productImage(product) : undefined

  const addToCart = () => {
    if (!product || isUnavailable) {
      return
    }

    const cart = readCart()
    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      existingItem.quantity = Math.min(existingItem.quantity + quantity, stock)
    } else {
      cart.push({ id: product.id, quantity })
    }

    writeCart(cart)
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0))
    setCartMessage(`${product.name} added to cart.`)
  }

  if (loading) {
    return (
      <main className="store-shell">
        <div className="loading-screen">
          <div className="loader" />
          <p>Loading product...</p>
        </div>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="store-shell">
        <nav className="site-nav">
          <Link className="brand" href="/">
            <span className="brand-mark">S</span>
            <span>ShopSphere</span>
          </Link>
          <div className="nav-actions">
            <Link className="link-button ghost" href={`/login?next=${encodeURIComponent(`/products/${params.id}`)}`}>
              Login
            </Link>
            <Link className="link-button dark" href={`/signup?next=${encodeURIComponent(`/products/${params.id}`)}`}>
              Signup
            </Link>
          </div>
        </nav>
        {!authChecked || error ? (
          <p className="alert">{error}</p>
        ) : (
          <section className="guest-hero product-gate">
            <div className="hero-copy">
              <p className="eyebrow">Private product page</p>
              <h1>Login or signup to view this product.</h1>
              <p className="hero-text">
                Product images, prices, stock, and add-to-cart controls are only available for
                ShopSphere members.
              </p>
              <div className="hero-actions">
                <Link className="link-button dark large" href={`/login?next=${encodeURIComponent(`/products/${params.id}`)}`}>
                  Login
                </Link>
                <Link className="link-button outline large" href={`/signup?next=${encodeURIComponent(`/products/${params.id}`)}`}>
                  Signup
                </Link>
              </div>
            </div>
            <div className="guest-lockup compact" aria-label="Locked product preview">
              <div className="lockup-panel primary">
                <span className="lock-icon" aria-hidden="true">
                  S
                </span>
                <strong>Protected catalog</strong>
                <p>Create an account to continue into the product detail page.</p>
              </div>
            </div>
          </section>
        )}
        <StoreFooter />
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
        <div className="nav-actions">
          <Link className="cart-link" href="/cart" aria-label={`Cart with ${cartCount} items`}>
            Cart <span>{cartCount}</span>
          </Link>
          <Link className="link-button outline" href="/shop">
            Products
          </Link>
          <UserThumbnail user={user} />
        </div>
      </nav>

      <section className="product-detail product-detail-shop">
        <div className="product-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/shop">{categoryName(product)}</Link>
          <span>/</span>
          <strong>{product.name}</strong>
        </div>
        <div className="product-step-links">
          <Link href="/shop">Previous</Link>
          <span>|</span>
          <Link href="/shop">Next</Link>
        </div>

        <aside className="detail-thumbs" aria-label="Product thumbnails">
          {[0, 1, 2].map((thumb) => (
            <button className={thumb === 0 ? 'active' : ''} type="button" key={thumb}>
              {image ? <img src={image} alt="" /> : <span />}
            </button>
          ))}
        </aside>

        <div className="detail-media">
          {image ? <img src={image} alt={product.name} /> : <span>No image available</span>}
        </div>

        <div className="detail-copy">
          <h1>{product.name}</h1>
          <p className="detail-price">{formatter.format(product.price)}</p>
          <p className="detail-description">
            {product.description || 'A clean everyday piece from the current ShopSphere catalog.'}
          </p>

          <div className="detail-purchase-row">
            <div className="cart-controls" aria-label="Choose quantity">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                -
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(stock || 1, value + 1))}
              >
                +
              </button>
            </div>

            <button
              className="submit-button detail-add"
              type="button"
              onClick={addToCart}
              disabled={isUnavailable}
            >
              {isUnavailable ? 'Out of stock' : 'Add to cart'}
            </button>
          </div>

          <Link className="detail-wishlist" href="/shop">
            Add to Wishlist
          </Link>

          <div className="detail-meta">
            <p>
              Categories: <strong>{categoryName(product)}</strong>
            </p>
            <p>
              Tags: <strong>fashion, daily, summer</strong>
            </p>
            <p>
              Availability: <strong>{isUnavailable ? 'Out of stock' : `${stock} in stock`}</strong>
            </p>
          </div>

          {cartMessage && (
            <div className="cart-confirmation">
              <p className="success-message">{cartMessage}</p>
              <Link className="link-button ghost" href="/cart">
                View cart
              </Link>
            </div>
          )}

          <div className="safe-checkout">
            <span>Guaranteed safe checkout</span>
            <div>
              <strong>VISA</strong>
              <strong>MasterCard</strong>
              <strong>AMEX</strong>
              <strong>Discover</strong>
              <strong>PayPal</strong>
            </div>
          </div>
        </div>
      </section>
      <StoreFooter />
    </main>
  )
}


