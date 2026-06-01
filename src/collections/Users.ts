import type { CollectionConfig } from 'payload'
import { addDataAndFileToRequest } from 'payload'

const ADMIN_EMAIL = 'adarshagrawal2233@gmail.com'
const isAdminUser = (user: { email?: string | null; role?: string | null } | null | undefined) =>
  user?.email === ADMIN_EMAIL || user?.role === 'admin'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    admin: async ({ req }) => {
      if (isAdminUser(req.user)) {
        return true
      }

      if (!req.user?.id) {
        return false
      }

      const user = await req.payload.findByID({
        collection: 'users',
        depth: 0,
        id: req.user.id,
      })

      return user?.role === 'admin'
    },
    create: () => true,
  },
  endpoints: [
    {
      handler: async (req) => {
        if (!req.user) {
          return Response.json({ message: 'Login required' }, { status: 401 })
        }

        const user = await req.payload.findByID({
          collection: 'users',
          depth: 1,
          id: req.user.id,
        })

        return Response.json({ user })
      },
      method: 'get',
      path: '/profile',
    },
    {
      handler: async (req) => {
        if (!req.user) {
          return Response.json({ message: 'Login required' }, { status: 401 })
        }

        await addDataAndFileToRequest(req)

        const data = req.data ?? {}
        const updateData: Record<string, unknown> = {}

        if (typeof data.name === 'string') {
          updateData.name = data.name.trim()
        }

        if (typeof data.age === 'number' || typeof data.age === 'string') {
          const age = Number(data.age)

          if (Number.isFinite(age)) {
            updateData.age = age
          }
        }

        if (req.file) {
          const avatar = await req.payload.create({
            collection: 'media',
            data: {
              alt:
                typeof updateData.name === 'string' && updateData.name
                  ? `${updateData.name} profile photo`
                  : `${req.user.email} profile photo`,
            },
            file: req.file,
          })

          updateData.avatar = avatar.id
        }

        const user = await req.payload.update({
          collection: 'users',
          data: updateData,
          depth: 1,
          id: req.user.id,
        })

        return Response.json({ user })
      },
      method: 'patch',
      path: '/profile',
    },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'age',
      type: 'number',
      min: 1,
      max: 120,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'role',
      type: 'select',
      access: {
        create: ({ req }) => isAdminUser(req.user),
        update: ({ req }) => isAdminUser(req.user),
      },
      defaultValue: 'customer',
      options: [
        {
          label: 'Customer',
          value: 'customer',
        },
        {
          label: 'Admin',
          value: 'admin',
        },
      ],
      saveToJWT: true,
    },
  ],
}
