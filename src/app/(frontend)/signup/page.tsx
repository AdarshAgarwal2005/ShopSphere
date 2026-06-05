'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { StoreFooter } from '../components/StoreFooter'

export default function SignupPage() {
  const router = useRouter()
  const [nextPath] = useState(() => {
    if (typeof window === 'undefined') {
      return '/'
    }

    const next = new URLSearchParams(window.location.search).get('next') || '/'

    return next.startsWith('/') && !next.startsWith('//') ? next : '/'
  })
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const signup = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const res = await fetch('/api/users', {
      body: JSON.stringify({
        age: Number(age),
        email,
        name,
        password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    setSubmitting(false)

    if (res.ok) {
      const loginRes = await fetch('/api/users/login', {
        body: JSON.stringify({
          email,
          password,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      router.push(loginRes.ok ? nextPath : `/login?next=${encodeURIComponent(nextPath)}`)
      return
    }

    const data = await res.json().catch(() => null)
    setError(data?.errors?.[0]?.message ?? 'Account creation failed. Try another email.')
  }

  return (
    <main className="auth-page signup-page">
      <Link className="brand auth-brand" href="/">
        <span className="brand-mark">S</span>
        <span>ShopSphere</span>
      </Link>

      <section className="auth-layout">
        <div className="auth-copy">
          <p className="eyebrow">Start shopping</p>
          <h1>Create an account for the full catalog.</h1>
          <p>
            Sign up once and your storefront opens into the product grid, category highlights, and
            fresh inventory from your Payload CMS.
          </p>
        </div>

        <form className="auth-card" onSubmit={signup}>
          <div>
            <p className="form-kicker">New account</p>
            <h2>Signup</h2>
          </div>

          {error && <p className="alert">{error}</p>}

          <label>
            Full name
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label>
            Age
            <input
              type="number"
              min="1"
              max="120"
              placeholder="Your age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </label>

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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className="submit-button" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>

          <p className="auth-switch">
            Already registered? <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>Login</Link>
          </p>
        </form>
      </section>
      <StoreFooter />
    </main>
  )
}
