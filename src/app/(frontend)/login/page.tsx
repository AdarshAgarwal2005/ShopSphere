'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { StoreFooter } from '../components/StoreFooter'

export default function LoginPage() {
  const router = useRouter()
  const [nextPath] = useState(() => {
    if (typeof window === 'undefined') {
      return '/'
    }

    const next = new URLSearchParams(window.location.search).get('next') || '/'

    return next.startsWith('/') && !next.startsWith('//') ? next : '/'
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const login = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const res = await fetch('/api/users/login', {
      body: JSON.stringify({
        email,
        password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    setSubmitting(false)

    if (res.ok) {
      router.push(nextPath)
      return
    }

    setError('Please check your email and password, then try again.')
  }

  return (
    <main className="auth-page">
      <Link className="brand auth-brand" href="/">
        <span className="brand-mark">S</span>
        <span>ShopSphere</span>
      </Link>

      <section className="auth-layout">
        <div className="auth-copy">
          <p className="eyebrow">Welcome back</p>
          <h1>Login to manage your shopping experience.</h1>
          <p>
            Access the full product catalog, browse new arrivals, and preview the storefront your
            Payload admin panel powers behind the scenes.
          </p>
        </div>

        <form className="auth-card" onSubmit={login}>
          <div>
            <p className="form-kicker">Member access</p>
            <h2>Login</h2>
          </div>

          {error && <p className="alert">{error}</p>}

          <label>
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className="submit-button" type="submit" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Login'}
          </button>

          <p className="auth-switch">
            New here? <Link href={`/signup?next=${encodeURIComponent(nextPath)}`}>Create an account</Link>
          </p>
        </form>
      </section>
      <StoreFooter />
    </main>
  )
}
