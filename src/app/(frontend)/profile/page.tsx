'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { UserThumbnail } from '../components/UserThumbnail'

type Media = {
  url?: string
}

type UserProfile = {
  age?: number | null
  avatar?: Media | string | null
  email: string
  id: string
  name?: string | null
}

const avatarUrl = (user?: UserProfile | null) =>
  typeof user?.avatar === 'object' && user.avatar?.url ? user.avatar.url : undefined

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const resetForm = (nextUser = user) => {
    setName(nextUser?.name ?? '')
    setAge(nextUser?.age ? String(nextUser.age) : '')
    setAvatar(null)
    setPreview(avatarUrl(nextUser) ?? '')
  }

  useEffect(() => {
    const loadProfile = async () => {
      const res = await fetch('/api/users/profile', {
        credentials: 'include',
      })

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) {
        setError('Unable to load your profile.')
        setLoading(false)
        return
      }

      const data = await res.json()
      const nextUser = data.user as UserProfile

      setUser(nextUser)
      setName(nextUser.name ?? '')
      setAge(nextUser.age ? String(nextUser.age) : '')
      setAvatar(null)
      setPreview(avatarUrl(nextUser) ?? '')
      setLoading(false)
    }

    loadProfile()
  }, [router])

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    const formData = new FormData()
    formData.append(
      '_payload',
      JSON.stringify({
        age: Number(age),
        name,
      }),
    )

    if (avatar) {
      formData.append('file', avatar)
    }

    const res = await fetch('/api/users/profile', {
      body: formData,
      credentials: 'include',
      method: 'PATCH',
    })
    const data = await res.json().catch(() => null)

    setSaving(false)

    if (!res.ok) {
      setError(data?.message ?? 'Unable to update your profile.')
      return
    }

    const nextUser = data.user as UserProfile
    setUser(nextUser)
    setPreview(avatarUrl(nextUser) ?? preview)
    setAvatar(null)
    setIsEditing(false)
    setSuccess('Profile updated.')
  }

  if (loading) {
    return (
      <main className="store-shell">
        <div className="loading-screen">
          <div className="loader" />
          <p>Loading profile...</p>
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
        <div className="nav-actions">
          <Link className="link-button ghost" href="/cart">
            Cart
          </Link>
          <Link className="link-button outline" href="/">
            Products
          </Link>
          <UserThumbnail user={user} />
        </div>
      </nav>

      <section className="profile-layout">
        <aside className="profile-card">
          <div className="profile-photo-large">
            {preview ? (
              <img src={preview} alt={user?.name || 'Profile photo'} />
            ) : (
              <span>Profile</span>
            )}
          </div>
          <div>
            <p className="eyebrow">Your account</p>
            <h1>{user?.name || 'ShopSphere member'}</h1>
            <p>{user?.email}</p>
          </div>
        </aside>

        <section className="auth-card profile-form">
          {!isEditing ? (
            <>
              <div className="profile-section-heading">
                <div>
                  <p className="form-kicker">Profile details</p>
                  <h2>Your details</h2>
                </div>
                <button
                  className="link-button dark"
                  type="button"
                  onClick={() => {
                    resetForm()
                    setError('')
                    setSuccess('')
                    setIsEditing(true)
                  }}
                >
                  Edit profile
                </button>
              </div>

              {error && <p className="alert">{error}</p>}
              {success && <p className="success-message">{success}</p>}

              <dl className="profile-details">
                <div>
                  <dt>Full name</dt>
                  <dd>{user?.name || 'Not added yet'}</dd>
                </div>
                <div>
                  <dt>Age</dt>
                  <dd>{user?.age ? `${user.age} years` : 'Not added yet'}</dd>
                </div>
                <div>
                  <dt>Email address</dt>
                  <dd>{user?.email}</dd>
                </div>
                <div>
                  <dt>Profile image</dt>
                  <dd>{avatarUrl(user) ? 'Uploaded' : 'Not uploaded yet'}</dd>
                </div>
              </dl>
            </>
          ) : (
            <form className="profile-edit-form" onSubmit={saveProfile}>
              <div className="profile-section-heading">
                <div>
                  <p className="form-kicker">Profile details</p>
                  <h2>Edit profile</h2>
                </div>
                <button
                  className="link-button ghost"
                  type="button"
                  onClick={() => {
                    resetForm()
                    setError('')
                    setIsEditing(false)
                  }}
                >
                  Cancel
                </button>
              </div>

              {error && <p className="alert">{error}</p>}
              {success && <p className="success-message">{success}</p>}

              <label>
                Full name
                <input value={name} onChange={(event) => setName(event.target.value)} required />
              </label>

              <label>
                Age
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  required
                />
              </label>

              <label>
                Email address
                <input type="email" value={user?.email ?? ''} disabled />
              </label>

              <label>
                Profile image
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    setAvatar(file)

                    if (file) {
                      setPreview(URL.createObjectURL(file))
                    }
                  }}
                />
              </label>

              <button className="submit-button" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </form>
          )}
        </section>
      </section>
    </main>
  )
}
