'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { UserThumbnail } from './components/UserThumbnail'

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
  age?: number | null
  avatar?: Media | string | null
  avatarDataUrl?: string | null
  email: string
  name?: string | null
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

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortMode, setSortMode] = useState('featured')
  const [cartCount, setCartCount] = useState(cartCountFromStorage)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const loadStorefront = async () => {
      try {
        const [userRes, productRes] = await Promise.all([
          fetch('/api/users/me', {
            credentials: 'include',
          }),
          fetch('/api/products?depth=1&limit=24'),
        ])

        const userData = await userRes.json()

        if (userData.user) {
          setUser(userData.user)
        }

        if (!productRes.ok) {
          throw new Error('Unable to load products')
        }

        const productData = await productRes.json()
        setProducts(productData.docs ?? [])
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

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const visibleProducts = products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || categoryName(product) === selectedCategory
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description?.toLowerCase().includes(normalizedSearch) ||
        categoryName(product).toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })

    return [...visibleProducts].sort((a, b) => {
      if (sortMode === 'price-low') {
        return a.price - b.price
      }

      if (sortMode === 'price-high') {
        return b.price - a.price
      }

      if (sortMode === 'stock') {
        return (b.stock ?? 0) - (a.stock ?? 0)
      }

      return 0
    })
  }, [products, searchTerm, selectedCategory, sortMode])

  const featuredProducts = products.slice(0, 4)

  const addToCart = (product: Product) => {
    const stock = product.stock ?? 0

    if (stock <= 0) {
      setToast(`${product.name} is out of stock.`)
      return
    }

    const cart = readCart()
    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      existingItem.quantity = Math.min(existingItem.quantity + 1, stock)
    } else {
      cart.push({ id: product.id, quantity: 1 })
    }

    writeCart(cart)
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0))
    setToast(`${product.name} added to cart.`)
  }

  const logout = async () => {
    await fetch('/api/users/logout', {
      credentials: 'include',
      method: 'POST',
    })

    setUser(null)
    setProducts([])
  }

  const catalogContent = (
    <>
      <section className="catalog-toolbar" aria-label="Catalog controls">
        <label className="search-field">
          <span>Search</span>
          <input
            type="search"
            placeholder="Search shirts, denim, trousers..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <div className="filter-pills" aria-label="Filter by category">
          {['All', ...categories].map((category) => (
            <button
              className={selectedCategory === category ? 'active' : ''}
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <label className="sort-field">
          <span>Sort</span>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            <option value="featured">Featured</option>
            <option value="price-low">Price low to high</option>
            <option value="price-high">Price high to low</option>
            <option value="stock">Most stock</option>
          </select>
        </label>
      </section>

      <div className="catalog-status">
        <span>
          Showing {filteredProducts.length} of {products.length} products
        </span>
        {toast && <strong>{toast}</strong>}
      </div>

      {filteredProducts.length === 0 ? (
        <section className="empty-cart catalog-empty">
          <h2>No products found.</h2>
          <p>Try another search or switch category to see more of the collection.</p>
          <button
            className="link-button dark"
            type="button"
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('All')
            }}
          >
            Reset filters
          </button>
        </section>
      ) : (
        <section className="product-grid" aria-label="All products">
          {filteredProducts.map((product) => {
            const image = productImage(product)
            const stock = product.stock ?? 0
            const isLowStock = stock > 0 && stock <= 10
            const isUnavailable = stock <= 0

            return (
              <article className="product-card" key={product.id}>
                <Link className="product-media" href={`/products/${product.id}`}>
                  {image ? <img src={image} alt={product.name} /> : <span>No image</span>}
                  <span className={isUnavailable ? 'media-badge sold' : 'media-badge'}>
                    {isUnavailable ? 'Sold out' : isLowStock ? 'Few left' : 'Ready'}
                  </span>
                </Link>
                <div className="product-info">
                  <div className="product-meta">
                    <span>{categoryName(product)}</span>
                    <span className={isLowStock || isUnavailable ? 'stock low' : 'stock'}>
                      {isUnavailable ? 'Out of stock' : isLowStock ? 'Low stock' : 'In stock'}
                    </span>
                  </div>
                  <h3>
                    <Link href={`/products/${product.id}`}>{product.name}</Link>
                  </h3>
                  <p>{product.description}</p>
                  <div className="product-footer">
                    <strong>{formatter.format(product.price)}</strong>
                    <div className="product-actions">
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={isUnavailable}
                      >
                        Add
                      </button>
                      <Link href={`/products/${product.id}`}>View</Link>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </>
  )

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
              ShopSphere brings your Payload-powered catalog into a clean, premium storefront built
              for product discovery, fast browsing, and confident buying.
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

        {catalogContent}
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
          <UserThumbnail user={user} showLabel />
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
          <Link href="/cart">Cart total items: {cartCount}</Link>
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

      {catalogContent}
    </main>
  )
}
