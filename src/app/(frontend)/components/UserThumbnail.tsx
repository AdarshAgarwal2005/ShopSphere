'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Media = {
  url?: string
}

export type ThumbnailUser = {
  avatar?: Media | string | null
  email?: string
  name?: string | null
}

const avatarUrl = (user?: ThumbnailUser | null) =>
  typeof user?.avatar === 'object' && user.avatar?.url ? user.avatar.url : undefined

const initials = (user?: ThumbnailUser | null) => {
  const source = user?.name || user?.email || 'User'
  const parts = source.trim().split(/\s+/)

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function UserThumbnail({
  user: initialUser,
  showLabel = false,
}: {
  showLabel?: boolean
  user?: ThumbnailUser | null
}) {
  const [fetchedUser, setFetchedUser] = useState<ThumbnailUser | null>(null)
  const user = initialUser ?? fetchedUser

  useEffect(() => {
    if (initialUser) {
      return
    }

    const loadProfile = async () => {
      const res = await fetch('/api/users/profile', {
        credentials: 'include',
      })

      if (!res.ok) {
        return
      }

      const data = await res.json()
      setFetchedUser(data.user ?? null)
    }

    loadProfile()
  }, [initialUser])

  if (!user?.email) {
    return null
  }

  const image = avatarUrl(user)

  return (
    <Link className="user-thumbnail" href="/profile" aria-label="Open profile">
      <span className="avatar-frame">
        {image ? (
          <img src={image} alt={user.name || user.email || 'Profile photo'} />
        ) : (
          initials(user)
        )}
      </span>
      {showLabel && <span>{user.name || user.email}</span>}
    </Link>
  )
}
