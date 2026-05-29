import 'dotenv/config'

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import sharp from 'sharp'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const sheetPath = path.resolve(dirname, 'assets/product-image-sheet.png')
const outputDir = path.resolve(dirname, 'generated-product-images')

const productNames = [
  'Indigo Straight Fit Jeans',
  'Black Slim Stretch Jeans',
  'Light Wash Relaxed Jeans',
  'Grey Tapered Denim Jeans',
  'Navy Formal Trousers',
  'Charcoal Pleated Trousers',
  'Khaki Chino Trousers',
  'Olive Utility Trousers',
  'White Oxford Shirt',
  'Sky Blue Linen Blend Shirt',
  'Black Printed Casual Shirt',
  'Olive Checked Flannel Shirt',
  'Classic White Crew Neck T-shirt',
  'Navy Pocket T-shirt',
  'Maroon Graphic T-shirt',
  'Heather Grey Oversized T-shirt',
] as const

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

await fs.mkdir(outputDir, { recursive: true })

const sheet = sharp(sheetPath)
const metadata = await sheet.metadata()

if (!metadata.width || !metadata.height) {
  throw new Error('Could not read product image sheet dimensions.')
}

const tileWidth = Math.floor(metadata.width / 4)
const tileHeight = Math.floor(metadata.height / 4)
const cropSize = Math.min(tileWidth, tileHeight)
const payload = await getPayload({ config })

for (const [index, productName] of productNames.entries()) {
  const column = index % 4
  const row = Math.floor(index / 4)
  const slug = toSlug(productName)
  const imagePath = path.resolve(outputDir, `${slug}.webp`)

  await sharp(sheetPath)
    .extract({
      left: column * tileWidth + Math.floor((tileWidth - cropSize) / 2),
      top: row * tileHeight + Math.floor((tileHeight - cropSize) / 2),
      width: cropSize,
      height: cropSize,
    })
    .resize(900, 900, { fit: 'cover' })
    .webp({ quality: 88 })
    .toFile(imagePath)

  const existingMedia = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    where: {
      filename: {
        equals: `${slug}.webp`,
      },
    },
  })

  const media =
    existingMedia.docs[0] ??
    (await payload.create({
      collection: 'media',
      data: {
        alt: productName,
      },
      filePath: imagePath,
    }))

  if (existingMedia.docs[0] && existingMedia.docs[0].alt !== productName) {
    await payload.update({
      collection: 'media',
      id: existingMedia.docs[0].id,
      data: {
        alt: productName,
      },
    })
  }

  const product = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 1,
    where: {
      name: {
        equals: productName,
      },
    },
  })

  if (!product.docs[0]) {
    throw new Error(`Missing product "${productName}". Run npm run seed:products first.`)
  }

  await payload.update({
    collection: 'products',
    id: product.docs[0].id,
    data: {
      image: media.id,
    },
  })
}

console.log(`Attached images to ${productNames.length} products.`)
process.exit(0)
