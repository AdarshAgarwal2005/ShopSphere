import type { CollectionConfig } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { promises as fs } from 'fs'

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

        const contentType = req.headers.get('content-type') ?? ''
        let data: Record<string, unknown> = {}

        if (contentType.includes('application/json')) {
          if (typeof req.text !== 'function') {
            return Response.json({ message: 'Unable to read profile update.' }, { status: 400 })
          }

          try {
            data = JSON.parse(await req.text()) as Record<string, unknown>
          } catch {
            return Response.json({ message: 'Unable to read profile update.' }, { status: 400 })
          }
        } else {
          try {
            await addDataAndFileToRequest(req)
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : 'Unable to read profile update. Try a smaller image.'

            return Response.json({ message }, { status: 400 })
          }

          data = req.data ?? {}
        }

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
          if (!req.file.mimetype?.startsWith('image/')) {
            return Response.json({ message: 'Please upload an image file.' }, { status: 400 })
          }

          const fileSizeLimit = 750 * 1024

          if (req.file.size > fileSizeLimit) {
            return Response.json(
              { message: 'Profile image must be smaller than 750KB.' },
              { status: 400 },
            )
          }

          const fileData =
            req.file.data ??
            (req.file.tempFilePath ? await fs.readFile(req.file.tempFilePath) : undefined)

          if (!fileData) {
            return Response.json({ message: 'Unable to read profile image.' }, { status: 400 })
          }

          updateData.avatarDataUrl = `data:${req.file.mimetype};base64,${Buffer.from(fileData).toString('base64')}`
          updateData.avatar = null
        }

        if (typeof data.avatarDataUrl === 'string' && data.avatarDataUrl) {
          const isImageDataUrl = /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(
            data.avatarDataUrl,
          )

          if (!isImageDataUrl) {
            return Response.json({ message: 'Please upload an image file.' }, { status: 400 })
          }

          const dataUrlLimit = 440 * 1024

          if (data.avatarDataUrl.length > dataUrlLimit) {
            return Response.json(
              { message: 'Profile image must be smaller. Try another photo.' },
              { status: 400 },
            )
          }

          updateData.avatarDataUrl = data.avatarDataUrl
          updateData.avatar = null
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
      name: 'avatarDataUrl',
      type: 'textarea',
      admin: {
        description: 'Stores profile thumbnails for serverless deployments.',
      },
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
