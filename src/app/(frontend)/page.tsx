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
  const [priceCap, setPriceCap] = useState(0)
  const [activeSpotlight, setActiveSpotlight] = useState(0)
  const [cartCount, setCartCount] = useState(cartCountFromStorage)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    const loadStorefront = async () => {
      try {
        const userRes = await fetch('/api/users/me', {
          credentials: 'include',
        })
        const userData = await userRes.json()

        const productRes = await fetch('/api/products?depth=1&limit=24')

        if (!productRes.ok) {
          throw new Error('Unable to load products')
        }

        const productData = await productRes.json()
        const docs = productData.docs ?? []

        if (userData.user) {
          setUser(userData.user)
        }

        setProducts(docs)
        setPriceCap(Math.max(...docs.map((product: Product) => product.price), 0))
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

  const maxPrice = useMemo(
    () => Math.max(...products.map((product) => product.price), 0),
    [products],
  )

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const visibleProducts = products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || categoryName(product) === selectedCategory
      const matchesPrice = !priceCap || product.price <= priceCap
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description?.toLowerCase().includes(normalizedSearch) ||
        categoryName(product).toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesPrice && matchesSearch
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
  }, [priceCap, products, searchTerm, selectedCategory, sortMode])

  const featuredProducts = products.slice(0, 4)
  const previewProducts = products.slice(0, 3)
  const spotlightProduct = featuredProducts[activeSpotlight % Math.max(featuredProducts.length, 1)]

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

        {maxPrice > 0 && (
          <label className="price-field">
            <span>Max price</span>
            <input
              type="range"
              min="0"
              max={maxPrice}
              step="100"
              value={priceCap || maxPrice}
              onChange={(event) => setPriceCap(Number(event.target.value))}
            />
            <strong>{formatter.format(priceCap || maxPrice)}</strong>
          </label>
        )}
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
              setPriceCap(maxPrice)
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
                <div className="product-card-glow" aria-hidden="true" />
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

        <section className="guest-hero public-home">
          <div className="hero-copy">
            <p className="eyebrow">Modern menswear marketplace</p>
            <h1>Discover everyday style curated for sharper shopping.</h1>
            <p className="hero-text">
              ShopSphere brings shirts, tees, denim, and trousers into a clean storefront with
              polished product previews. Login or signup to open the full catalog, cart, and checkout.
            </p>
            <div className="hero-actions">
              <Link className="link-button dark large" href="/signup">
                Create account
              </Link>
              <Link className="link-button outline large" href="/login">
                Login
              </Link>
            </div>
            <div className="access-metrics home-metrics" aria-label="Store highlights">
              <div>
                <strong>{products.length || 'Fresh'}</strong>
                <span>catalog pieces</span>
              </div>
              <div>
                <strong>Curated</strong>
                <span>menswear edits</span>
              </div>
              <div>
                <strong>Secure</strong>
                <span>member checkout</span>
              </div>
            </div>
          </div>

          <div className="public-showcase" aria-label="Featured product preview">
            {previewProducts[0] && (
              <article className="preview-card hero-preview">
                {productImage(previewProducts[0]) && (
                  <img src={productImage(previewProducts[0])} alt={previewProducts[0].name} />
                )}
                <div>
                  <span>{categoryName(previewProducts[0])}</span>
                  <h2>{previewProducts[0].name}</h2>
                  <p>{formatter.format(previewProducts[0].price)}</p>
                </div>
              </article>
            )}

            <div className="preview-stack">
              {previewProducts.slice(1).map((product) => (
                <article className="preview-card mini-preview" key={product.id}>
                  {productImage(product) && <img src={productImage(product)} alt={product.name} />}
                  <div>
                    <span>{categoryName(product)}</span>
                    <h3>{product.name}</h3>
                    <p>{formatter.format(product.price)}</p>
                  </div>
                </article>
              ))}

              <div className="join-card">
                <span>Members get full access</span>
                <strong>View details, add to cart, and checkout after login.</strong>
                <Link className="link-button dark" href="/signup">
                  Join now
                </Link>
              </div>
            </div>
          </div>
        </section>

        {previewProducts.length > 0 && (
          <section className="public-product-strip" aria-label="Product preview">
            <div className="section-heading">
              <p className="eyebrow">Preview the edit</p>
              <h2>A small look at what is waiting inside.</h2>
            </div>
            <div className="preview-row">
              {products.slice(0, 6).map((product) => (
                <article className="strip-card" key={product.id}>
                  {productImage(product) && <img src={productImage(product)} alt={product.name} />}
                  <div>
                    <span>{categoryName(product)}</span>
                    <strong>{product.name}</strong>
                    <p>{formatter.format(product.price)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {error && <p className="alert">{error}</p>}
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
          <h1>Shop the drop with a faster, richer catalog.</h1>
          <p className="hero-text">
            Search, filter, sort, preview inventory, and jump into each product with smooth,
            image-forward shopping built around the current Payload collection.
          </p>
        </div>
        {spotlightProduct && (
          <Link className="catalog-spotlight" href={`/products/${spotlightProduct.id}`}>
            {productImage(spotlightProduct) && (
              <img src={productImage(spotlightProduct)} alt={spotlightProduct.name} />
            )}
            <span>{categoryName(spotlightProduct)}</span>
            <strong>{spotlightProduct.name}</strong>
            <em>{formatter.format(spotlightProduct.price)}</em>
          </Link>
        )}
      </section>

      {error && <p className="alert">{error}</p>}

      <section className="category-row" aria-label="Product categories">
        {categories.map((category) => (
          <span key={category}>{category}</span>
        ))}
      </section>

      {featuredProducts.length > 0 && (
        <section className="featured-grid interactive" aria-label="Featured products">
          {featuredProducts.map((product, index) => (
            <article
              className={activeSpotlight === index ? 'feature-card active' : 'feature-card'}
              key={product.id}
              onMouseEnter={() => setActiveSpotlight(index)}
            >
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
