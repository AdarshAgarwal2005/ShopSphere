# ShopSphere

ShopSphere is a Payload CMS + Next.js ecommerce storefront with user authentication, product browsing, profile avatars, cart management, and Razorpay test checkout.

## Features

- Payload CMS collections for users, media, categories, products, and orders
- Authenticated storefront with product search, filters, sorting, product detail pages, and cart
- User signup with name and age, editable profile page, and avatar thumbnails in navigation
- Razorpay test-mode checkout with server-side order creation and signature verification
- Seed scripts for product data and product media

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Update `.env`:

```env
DATABASE_URL=mongodb://127.0.0.1/ShopSphere
PAYLOAD_SECRET=replace-with-a-long-random-secret
RAZORPAY_KEY_ID=rzp_test_replace_me
RAZORPAY_KEY_SECRET=replace-with-your-razorpay-test-secret
```

4. Start MongoDB locally or run the included Docker database:

```bash
docker-compose up -d
```

5. Seed products and images when needed:

```bash
npm run seed:products
npm run seed:product-images
```

6. Start development:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deployment Checklist

- Set `DATABASE_URL`, `PAYLOAD_SECRET`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` in the hosting provider.
- Use Razorpay test keys for testing and live keys only when going to production.
- Use a strong unique `PAYLOAD_SECRET`.
- Make sure MongoDB is reachable from the deployed app.
- Run checks before deploying:

```bash
npm run lint
npm run build
```

## Scripts

- `npm run dev` - start the Next.js development server
- `npm run build` - create a production build
- `npm run start` - start the production server
- `npm run lint` - run ESLint
- `npm run generate:types` - regenerate Payload TypeScript types
- `npm run seed:products` - seed product records
- `npm run seed:product-images` - seed product media
