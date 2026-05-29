import React from 'react'
import './styles.css'

export const metadata = {
  description: 'A modern Payload CMS powered fashion storefront.',
  title: 'ShopSphere',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
