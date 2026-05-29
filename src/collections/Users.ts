import type { CollectionConfig } from 'payload'

const ADMIN_EMAIL = 'adarshagrawal2233@gmail.com'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    admin: ({ req }) => {
      return req.user?.email === ADMIN_EMAIL
    },
    create: () => true,
  },
  fields: [],
}
