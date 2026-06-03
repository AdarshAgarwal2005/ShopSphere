import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'stock',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'averageRating',
      type: 'number',
      admin: {
        description: 'Average product rating shown as stars.',
        readOnly: true,
      },
      defaultValue: 4.5,
      max: 5,
      min: 0,
    },
    {
      name: 'ratingCount',
      type: 'number',
      admin: {
        readOnly: true,
      },
      defaultValue: 18,
      min: 0,
    },
    {
      name: 'ratingTotal',
      type: 'number',
      admin: {
        readOnly: true,
      },
      defaultValue: 81,
      min: 0,
    },
    {
      name: 'ratings',
      type: 'array',
      admin: {
        description: 'Individual customer ratings. One rating per user is kept by the storefront.',
        readOnly: true,
      },
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'rating',
          type: 'number',
          max: 5,
          min: 1,
          required: true,
        },
      ],
    },
  ],
}
