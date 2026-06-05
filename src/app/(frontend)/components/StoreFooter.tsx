import Link from 'next/link'

export function StoreFooter() {
  return (
    <footer className="store-footer">
      <section className="footer-newsletter" aria-label="ShopSphere newsletter">
        <div>
          <span className="eyebrow">Stay in the edit</span>
          <h2>New arrivals, quiet styling notes, and first look collections.</h2>
        </div>
        <form>
          <input type="email" placeholder="Email address" aria-label="Email address" />
          <button type="button">Join</button>
        </form>
      </section>

      <div className="footer-grid">
        <div className="footer-brand">
          <Link className="brand" href="/">
            <span className="brand-mark">S</span>
            <span>ShopSphere</span>
          </Link>
          <p>A modern boutique storefront powered by a live Payload CMS catalog.</p>
        </div>

        <nav aria-label="Footer shop links">
          <strong>Shop</strong>
          <Link href="/">New arrivals</Link>
          <Link href="/cart">Cart</Link>
          <Link href="/profile">Account</Link>
        </nav>

        <nav aria-label="Footer support links">
          <strong>Support</strong>
          <Link href="/login">Login</Link>
          <Link href="/signup">Signup</Link>
          <Link href="/admin">Admin</Link>
        </nav>

        <div className="footer-social">
          <strong>Social</strong>
          <div>
            <span>IG</span>
            <span>X</span>
            <span>YT</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
