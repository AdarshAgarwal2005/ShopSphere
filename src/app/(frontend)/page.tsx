'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

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

type User = {
  email: string
}

const formatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  maximumFractionDigits: 0,
  style: 'currency',
})

const categoryName = (product: Product) =>
  typeof product.category === 'object' && product.category?.name ? product.category.name : 'New Arrival'

const productImage = (product: Product) =>
  typeof product.image === 'object' && product.image?.url ? product.image.url : undefined

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStorefront = async () => {
      try {
        const userRes = await fetch('/api/users/me', {
          credentials: 'include',
        })

        const userData = await userRes.json()

        if (userData.user) {
          setUser(userData.user)

          const productRes = await fetch('/api/products?depth=1&limit=24', {
            credentials: 'include',
          })

          if (!productRes.ok) {
            throw new Error('Unable to load products')
          }

          const productData = await productRes.json()
          setProducts(productData.docs ?? [])
        }
      } catch {
        setError('Something went wrong while loading the storefront.')
      } finally {
        setLoading(false)
      }
    }

    loadStorefront()
  }, [])

  const categories = useMemo(
    () => Array.from(new Set(products.map(categoryName))).filter(Boolean),
    [products],
  )

  const featuredProducts = products.slice(0, 4)

  const logout = async () => {
    await fetch('/api/users/logout', {
      credentials: 'include',
      method: 'POST',
    })

    setUser(null)
    setProducts([])
  }

  if (loading) {
    return (
      <main className="store-shell">
        <div className="loading-screen">
          <div className="loader" />
          <p>Preparing the collection...</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="store-shell">
        <nav className="site-nav">
          <Link className="brand" href="/">
            <span className="brand-mark">S</span>
            <span>ShopSphere</span>
          </Link>
          <div className="nav-actions">
            <Link className="link-button ghost" href="/login">
              Login
            </Link>
            <Link className="link-button dark" href="/signup">
              Signup
            </Link>
          </div>
        </nav>

        <section className="guest-hero">
          <div className="hero-copy">
            <p className="eyebrow">Curated menswear store</p>
            <h1>Modern everyday style, ready for your next drop.</h1>
            <p className="hero-text">
              ShopSphere brings your Payload-powered catalog into a clean, premium storefront
              built for product discovery, fast browsing, and confident buying.
            </p>
            <div className="hero-actions">
              <Link className="link-button dark large" href="/signup">
                Create account
              </Link>
              <Link className="link-button outline large" href="/login">
                Login
              </Link>
            </div>
          </div>

          <div className="hero-showcase" aria-label="Featured clothing preview">
            <div className="showcase-card tall">
              <span>Premium denim</span>
            </div>
            <div className="showcase-card warm">
              <span>Sharp shirts</span>
            </div>
            <div className="showcase-card cool">
              <span>Daily tees</span>
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Store benefits">
          <div>
            <strong>16+</strong>
            <span>sample products seeded</span>
          </div>
          <div>
            <strong>4</strong>
            <span>organized categories</span>
          </div>
          <div>
            <strong>CMS</strong>
            <span>managed from Payload</span>
          </div>
        </section>
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
          <span className="user-pill">{user.email}</span>
          <button className="icon-button" type="button" onClick={logout} aria-label="Logout">
            Logout
          </button>
        </div>
      </nav>

      <section className="catalog-hero">
        <div>
          <p className="eyebrow">Live Payload catalog</p>
          <h1>Products your client can actually picture selling.</h1>
          <p className="hero-text">
            Browse the seeded collection with real-looking product photography, category labels,
            inventory status, and polished responsive cards.
          </p>
        </div>
        <div className="catalog-summary">
          <strong>{products.length}</strong>
          <span>products available</span>
        </div>
      </section>

      {error && <p className="alert">{error}</p>}

      <section className="category-row" aria-label="Product categories">
        {categories.map((category) => (
          <span key={category}>{category}</span>
        ))}
      </section>

      {featuredProducts.length > 0 && (
        <section className="featured-grid" aria-label="Featured products">
          {featuredProducts.map((product) => (
            <article className="feature-card" key={product.id}>
              {productImage(product) && (
                <img src={productImage(product)} alt={product.name} className="feature-image" />
              )}
              <div>
                <span>{categoryName(product)}</span>
                <h2>{product.name}</h2>
                <p>{formatter.format(product.price)}</p>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="product-grid" aria-label="All products">
        {products.map((product) => {
          const image = productImage(product)
          const isLowStock = typeof product.stock === 'number' && product.stock <= 10

          return (
            <article className="product-card" key={product.id}>
              <div className="product-media">
                {image ? <img src={image} alt={product.name} /> : <span>No image</span>}
              </div>
              <div className="product-info">
                <div className="product-meta">
                  <span>{categoryName(product)}</span>
                  <span className={isLowStock ? 'stock low' : 'stock'}>
                    {isLowStock ? 'Low stock' : 'In stock'}
                  </span>
                </div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="product-footer">
                  <strong>{formatter.format(product.price)}</strong>
                  <button type="button">View</button>
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
