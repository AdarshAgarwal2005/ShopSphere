'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { SphereAIChat } from './components/SphereAIChat'
import { StoreFooter } from './components/StoreFooter'
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
  averageRating?: number | null
  description?: string
  ratingCount?: number | null
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
const PRODUCTS_PER_PAGE = 8

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

const starterRatingForName = (name?: string | null) => {
  const source = name || 'ShopSphere'
  const score = Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return Number((4.1 + (score % 8) / 10).toFixed(1))
}

const productRating = (product: Product) =>
  typeof product.averageRating === 'number' && product.averageRating > 0
    ? Number(product.averageRating.toFixed(1))
    : starterRatingForName(product.name)

const productRatingCount = (product: Product) =>
  typeof product.ratingCount === 'number' && product.ratingCount > 0 ? product.ratingCount : 18

const RatingStars = ({ product, compact = false }: { compact?: boolean; product: Product }) => {
  const rating = productRating(product)

  return (
    <div
      className={compact ? 'rating-stars compact' : 'rating-stars'}
      aria-label={`${rating} out of 5 stars`}
    >
      <span aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <b className={index < Math.round(rating) ? 'filled' : ''} key={index}>
            ★
          </b>
        ))}
      </span>
      <strong>{rating.toFixed(1)}</strong>
      {!compact && <em>({productRatingCount(product)})</em>}
    </div>
  )
}

const readCart = (): CartItem[] => {
  try {
    const rawCart = window.localStorage.getItem(CART_KEY)
    const cart = rawCart ? JSON.parse(rawCart) : []

    return Array.isArray(cart) ? cart : []
  } catch {
    return []
  }
}

const cartCountFromStorage = () => {
  if (typeof window === 'undefined') {
    return 0
  }

  return readCart().reduce((sum, item) => sum + item.quantity, 0)
}

export function StorefrontPage({ forceShopView = false }: { forceShopView?: boolean }) {
  const isShopView = forceShopView
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortMode, setSortMode] = useState('featured')
  const [priceCap, setPriceCap] = useState(0)
  const [cartCount] = useState(cartCountFromStorage)
  const [visibleProductCount, setVisibleProductCount] = useState(PRODUCTS_PER_PAGE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const previewProducts = products.slice(0, 3)
  const heroProduct = previewProducts[0] || products[0]
  const editorialProducts = products.slice(0, 6)
  const visibleProducts = filteredProducts.slice(0, visibleProductCount)
  const hasMoreProducts = visibleProductCount < filteredProducts.length
  const categoryTiles = categories
    .slice(0, 4)
    .map((category) => products.find((product) => categoryName(product) === category))
    .filter((product): product is Product => Boolean(product))

  const logout = async () => {
    await fetch('/api/users/logout', {
      credentials: 'include',
      method: 'POST',
    })

    setUser(null)
    setProducts([])
  }

  const categoryCounts = useMemo(
    () =>
      categories.map((category) => ({
        count: products.filter((product) => categoryName(product) === category).length,
        name: category,
      })),
    [categories, products],
  )

  const catalogContent = (
    <>
      <section className="shop-layout" aria-label="Product catalog">
        <aside className="shop-sidebar" aria-label="Catalog filters">
        <label className="search-field">
          <span>Search products</span>
          <input
            type="search"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value)
              setVisibleProductCount(PRODUCTS_PER_PAGE)
            }}
          />
        </label>

        <div className="shop-filter-block">
          <h2>Categories</h2>
          <button
            className={selectedCategory === 'All' ? 'active' : ''}
            type="button"
            onClick={() => {
              setSelectedCategory('All')
              setVisibleProductCount(PRODUCTS_PER_PAGE)
            }}
          >
            <span>All</span>
            <em>{products.length}</em>
          </button>
          {categoryCounts.map((category) => (
            <button
              className={selectedCategory === category.name ? 'active' : ''}
              key={category.name}
              type="button"
              onClick={() => {
                setSelectedCategory(category.name)
                setVisibleProductCount(PRODUCTS_PER_PAGE)
              }}
            >
              <span>{category.name}</span>
              <em>{category.count}</em>
            </button>
          ))}
        </div>

        {maxPrice > 0 && (
          <label className="price-field shop-filter-block">
            <span>Price</span>
            <input
              type="range"
              min="0"
              max={maxPrice}
              step="100"
              value={priceCap || maxPrice}
              onChange={(event) => {
                setPriceCap(Number(event.target.value))
                setVisibleProductCount(PRODUCTS_PER_PAGE)
              }}
            />
            <strong>{formatter.format(priceCap || maxPrice)}</strong>
          </label>
        )}

        <div className="shop-filter-block tag-cloud">
          <h2>Product Tags</h2>
          {['autumn', 'fashion', 'daily', 'new', 'style'].map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </aside>

      <div className="shop-products">
        <div className="catalog-status">
          <span>
            Showing {Math.min(visibleProductCount, filteredProducts.length)} of{' '}
            {filteredProducts.length} results
          </span>
          <label className="sort-field">
            <span>Sort</span>
            <select
              value={sortMode}
              onChange={(event) => {
                setSortMode(event.target.value)
                setVisibleProductCount(PRODUCTS_PER_PAGE)
              }}
            >
              <option value="featured">Default sorting</option>
              <option value="price-low">Price low to high</option>
              <option value="price-high">Price high to low</option>
              <option value="stock">Most stock</option>
            </select>
          </label>
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
              setVisibleProductCount(PRODUCTS_PER_PAGE)
            }}
          >
            Reset filters
          </button>
        </section>
      ) : (
        <section className="product-grid shop-grid" aria-label="All products">
          {visibleProducts.map((product) => {
            const image = productImage(product)
            const stock = product.stock ?? 0
            const isLowStock = stock > 0 && stock <= 10
            const isUnavailable = stock <= 0

            return (
              <article className="product-card" key={product.id}>
                <Link className="product-media" href={`/products/${product.id}`}>
                  {image ? <img src={image} alt={product.name} /> : <span>No image</span>}
                  <span className={isUnavailable ? 'media-badge sold' : 'media-badge'}>
                    {isUnavailable ? 'Sold Out' : isLowStock ? 'Sale' : 'New'}
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
                  <RatingStars product={product} />
                  <p>{product.description}</p>
                  <div className="product-footer">
                    <strong>{formatter.format(product.price)}</strong>
                    <div className="product-actions">
                      <Link href={`/products/${product.id}`} className="wishlist-link">
                        Add to Wishlist
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="product-card-glow" aria-hidden="true" />
              </article>
            )
          })}
        </section>
      )}
        {hasMoreProducts && (
          <button
            className="show-more-button"
            type="button"
            onClick={() =>
              setVisibleProductCount((currentCount) => currentCount + PRODUCTS_PER_PAGE)
            }
          >
            Show more
          </button>
        )}
      </div>
      </section>
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

  if (isShopView && !user) {
    return (
      <main className="store-shell">
        <div className="boutique-announcement">
          <span>Members get access to the live catalog</span>
        </div>

        <nav className="site-nav">
          <Link className="brand" href="/">
            <span className="brand-mark">S</span>
            <span>ShopSphere</span>
          </Link>
          <div className="nav-actions">
            <Link className="link-button ghost" href="/login?next=%2Fshop">
              Login
            </Link>
            <Link className="link-button dark" href="/signup?next=%2Fshop">
              Signup
            </Link>
          </div>
        </nav>

        <section className="product-gate">
          <div className="empty-cart">
            <h1>Login to shop the full catalog.</h1>
            <p>Create an account or login to view products, save wishlist items, and checkout.</p>
            <Link className="link-button dark large" href="/signup?next=%2Fshop">
              Continue to signup
            </Link>
          </div>
        </section>
        {user && <SphereAIChat />}
        <StoreFooter />
      </main>
    )
  }

  if (!isShopView) {
    const homeHref = user ? '/' : '/signup?next=%2F'
    const shopHref = user ? '/shop' : '/signup?next=%2Fshop'
    const loginHref = user ? '/' : '/login?next=%2F'
    const signupHref = user ? '/shop' : '/signup?next=%2F'

    return (
      <main className="store-shell">
        <div className="boutique-announcement">
          <span>Free shipping on all orders over Rs. 999. Learn more!</span>
        </div>

        <nav className="site-nav">
          <Link className="brand" href="/">
            <span className="brand-mark">S</span>
            <span>ShopSphere</span>
          </Link>

          <div className="nav-menu" aria-label="Main categories">
            <Link href={homeHref}>Home</Link>
            <Link href={shopHref}>Shop</Link>
            <Link href={shopHref}>Pages</Link>
            <Link href={shopHref}>Blog</Link>
            <Link href={shopHref}>Contact</Link>
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                <Link className="cart-link" href="/cart" aria-label={`Cart with ${cartCount} items`}>
                  Cart <span>{cartCount}</span>
                </Link>
                <UserThumbnail user={user} showLabel />
                <button className="icon-button" type="button" onClick={logout} aria-label="Logout">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="link-button ghost" href={loginHref}>
                  Login
                </Link>
                <Link className="link-button dark" href={signupHref}>
                  Signup
                </Link>
              </>
            )}
          </div>
        </nav>

        <section className="guest-hero public-home boutique-hero">
          {heroProduct && productImage(heroProduct) && (
            <div className="boutique-hero-video">
              <span className="video-kicker">Campaign film</span>
              <video
                autoPlay
                loop
                muted
                playsInline
                poster={productImage(heroProduct)}
                aria-label="ShopSphere campaign video"
              >
                <source
                  src="https://cdn.coverr.co/videos/coverr-browsing-in-a-fashion-store-4162/720p.mp4"
                  type="video/mp4"
                />
              </video>
              <img
                className="boutique-hero-image"
                src={productImage(heroProduct)}
                alt={heroProduct.name}
              />
            </div>
          )}
          <div className="hero-copy">
            <p className="hero-script">be style</p>
            <p className="eyebrow">The new everyday wardrobe</p>
            <h1>Enhancing your everyday style.</h1>
            <p className="hero-text">
              A refined ShopSphere edit of shirts, tees, denim, and trousers pulled straight from
              your live Payload catalog.
            </p>
            <div className="hero-actions">
              <Link className="link-button dark large" href={shopHref}>
                Buy now
              </Link>
              <Link className="link-button outline large" href={loginHref}>
                {user ? 'Stay home' : 'Member login'}
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
        </section>

        <section className="home-service-strip" aria-label="Store service highlights">
          <div>
            <span className="service-icon">01</span>
            <strong>Flat-rate Delivery</strong>
          </div>
          <div>
            <span className="service-icon">24/7</span>
            <strong>Support 24/7</strong>
          </div>
          <div>
            <span className="service-icon">SSL</span>
            <strong>Secure Payment</strong>
          </div>
          <div>
            <span className="service-icon">30D</span>
            <strong>Free Return</strong>
          </div>
        </section>

        <section className="membership-section" id="membership" aria-label="ShopSphere membership">
          <div className="membership-copy">
            <p className="eyebrow">ShopSphere membership</p>
            <h2>Premium delivery and savings for Rs. 99/month.</h2>
            <p>
              Become a member to get free delivery, faster shipment priority, automatic discounts,
              early access to new drops, and more benefits on every order.
            </p>
            <div className="membership-actions">
              <Link className="link-button dark large" href={shopHref}>
                Buy membership
              </Link>
              <span>Cancel anytime</span>
            </div>
          </div>

          <div className="membership-card">
            <span>Rs. 99</span>
            <strong>per month</strong>
            <ul>
              <li>Free delivery on eligible orders</li>
              <li>Fast shipment priority</li>
              <li>10 percent discount on every order</li>
              <li>Early access to new arrivals</li>
              <li>Extra member-only offers and support</li>
            </ul>
          </div>
        </section>

        {categoryTiles.length > 0 && (
          <section className="collection-story" id="edits" aria-label="Shop by edit">
            <div className="section-heading centered">
              <p className="eyebrow">Shop by edit</p>
              <h2>Polished essentials, arranged like a boutique rail.</h2>
            </div>
            <div className="collection-tiles">
              {categoryTiles.map((product) => (
                <Link
                  className="collection-tile"
                  href={user ? `/products/${product.id}` : shopHref}
                  key={product.id}
                >
                  {productImage(product) && <img src={productImage(product)} alt={categoryName(product)} />}
                  <span>{categoryName(product)}</span>
                  <strong>Explore the edit</strong>
                </Link>
              ))}
            </div>
          </section>
        )}

        {previewProducts.length > 0 && (
          <section className="public-product-strip" id="preview" aria-label="Product preview">
            <div className="section-heading centered">
              <p className="eyebrow">Just landed</p>
              <h2>Clean silhouettes from the current ShopSphere drop.</h2>
            </div>
            <div className="preview-row">
              {editorialProducts.map((product) => (
                <article className="strip-card" key={product.id}>
                  {productImage(product) && <img src={productImage(product)} alt={product.name} />}
                  <div>
                    <span>{categoryName(product)}</span>
                    <strong>{product.name}</strong>
                    <RatingStars compact product={product} />
                    <p>{formatter.format(product.price)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {error && <p className="alert">{error}</p>}
        {user && <SphereAIChat />}
        <StoreFooter />
      </main>
    )
  }

  return (
    <main className="store-shell">
      <div className="boutique-announcement">
        <span>Free styling help with SphereAI</span>
        <a href="#catalog">Shop the live catalog</a>
        <span>{products.length} pieces available</span>
      </div>

      <nav className="site-nav">
        <Link className="brand" href="/">
          <span className="brand-mark">S</span>
          <span>ShopSphere</span>
        </Link>
        <div className="nav-menu" aria-label="Main categories">
          <a href="#catalog">New in</a>
          <a href="#catalog">Categories</a>
          <a href="#catalog">Featured</a>
        </div>
        <div className="nav-actions">
          <label className="nav-search">
            <span>Search catalog</span>
            <input
              type="search"
              placeholder="Search products"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setVisibleProductCount(PRODUCTS_PER_PAGE)
              }}
            />
          </label>
          <Link className="cart-link" href="/cart" aria-label={`Cart with ${cartCount} items`}>
            Cart <span>{cartCount}</span>
          </Link>
          <UserThumbnail user={user} showLabel />
          <button className="icon-button" type="button" onClick={logout} aria-label="Logout">
            Logout
          </button>
        </div>
      </nav>

      {error && <p className="alert">{error}</p>}

      <section id="catalog">{catalogContent}</section>
      {user && <SphereAIChat />}
      <StoreFooter />
    </main>
  )
}

export default function HomePage() {
  return <StorefrontPage />
}
