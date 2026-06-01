'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [cartCount, setCartCount] = useState(cartCountFromStorage)
  const [imageZoomed, setImageZoomed] = useState(false)

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}?depth=1`)

        if (!res.ok) {
          throw new Error('Product not found')
        }

        const data = await res.json()
        setProduct(data)
      } catch {
        setError('We could not find that product.')
      } finally {
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

  const totalPreview = useMemo(() => {
    if (!product) {
      return formatter.format(0)
    }

    return formatter.format(product.price * quantity)
  }, [product, quantity])

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
          <Link className="link-button ghost" href="/">
            Back to products
          </Link>
        </nav>
        <p className="alert">{error}</p>
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
          <Link className="link-button outline" href="/">
            Products
          </Link>
          <UserThumbnail />
        </div>
      </nav>

      <section className="product-detail">
        <button
          className={imageZoomed ? 'detail-media zoomed' : 'detail-media'}
          type="button"
          onClick={() => setImageZoomed((value) => !value)}
          aria-label={imageZoomed ? 'Show full product image' : 'Zoom product image'}
        >
          {image ? <img src={image} alt={product.name} /> : <span>No image available</span>}
          <span className="media-hint">{imageZoomed ? 'Fit' : 'Zoom'}</span>
        </button>

        <div className="detail-copy">
          <p className="eyebrow">{categoryName(product)}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatter.format(product.price)}</p>
          <p className="detail-description">
            {product.description || 'This product does not have a description yet.'}
          </p>

          <dl className="detail-facts">
            <div>
              <dt>Availability</dt>
              <dd>{isUnavailable ? 'Out of stock' : `${stock} in stock`}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{categoryName(product)}</dd>
            </div>
            <div>
              <dt>Cart total</dt>
              <dd>{totalPreview}</dd>
            </div>
          </dl>

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

          {cartMessage && (
            <div className="cart-confirmation">
              <p className="success-message">{cartMessage}</p>
              <Link className="link-button ghost" href="/cart">
                View cart
              </Link>
            </div>
          )}

          <div className="checkout-note">
            <strong>Test checkout ready</strong>
            <span>Cart payments open securely through Razorpay test mode.</span>
          </div>
        </div>
      </section>
    </main>
  )
}
