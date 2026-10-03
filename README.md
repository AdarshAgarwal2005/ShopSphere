<div align="center">

# 🛍️ ShopSphere

**An ecommerce storefront built with Next.js and Payload CMS, backed by MongoDB, with Razorpay test-mode checkout.**

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Visit_Site-2EA44F?style=for-the-badge)](https://shopsphere-nu-orpin.vercel.app/)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Payload CMS](https://img.shields.io/badge/Payload_CMS-000000?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-0C2451?style=flat-square&logo=razorpay&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Payments](https://img.shields.io/badge/Payments-Test_Mode-F2A33A?style=flat-square)
![Verification](https://img.shields.io/badge/Payment_Verification-Server--side-2EA44F?style=flat-square)

</div>

---

<!--
## 📸 Screenshots

Add screenshots to docs/screenshots/ and uncomment this section.

| Product Listing | Product Details |
|:---:|:---:|
| ![Product listing](docs/screenshots/product-listing.png) | ![Product details](docs/screenshots/product-details.png) |

| Search and Filters | Shopping Cart |
|:---:|:---:|
| ![Search and filters](docs/screenshots/search-filters.png) | ![Cart](docs/screenshots/cart.png) |

| User Profile | Payload CMS Dashboard |
|:---:|:---:|
| ![Profile](docs/screenshots/profile.png) | ![Payload dashboard](docs/screenshots/payload-dashboard.png) |
-->

## 🔭 Overview

ShopSphere is a CMS-backed ecommerce storefront. The customer-facing application is built with **Next.js**, while **Payload CMS** provides the backend and content layer: authentication, structured collections for products, categories, media and orders, and an admin interface for managing the catalog. Data is persisted in **MongoDB**.

Products are managed through the CMS rather than hardcoded in the frontend, and checkout is wired to **Razorpay** with server-side payment verification. The project was built to cover the full flow of a real storefront (catalog, accounts, cart, payment, data seeding and deployment) rather than only the UI.

### ⚙️ Engineering highlights

- 📦 Product catalog driven by Payload CMS collections, not static frontend data
- 👤 Authenticated user accounts with editable profiles and avatar support
- 🔎 Product search, filtering and sorting
- 🔐 Razorpay checkout with **server-side signature verification**, so payment results are not trusted from the client alone
- 🌱 Seed scripts for products and product images to make local setup repeatable
- 🐳 Docker Compose setup for a local MongoDB instance
- 🧩 TypeScript throughout, with Payload type generation, ESLint and a production build workflow

<!--
Add this only after verifying the numbers against the codebase:

Built with 15+ application modules, 25+ reusable React components, 10+ API endpoints and 5+ Payload CMS collections.
-->

---

## ✨ Features

| Area | What it includes |
|------|------------------|
| 🛍️ **Catalog** | Product listing, detail pages, categories, product images and pricing, all managed in Payload CMS |
| 🔎 **Discovery** | Search, filtering, sorting and category-based browsing |
| 👤 **Accounts** | Signup and login, user profile with name, age and avatar, editable profile information, avatar thumbnail in the navigation |
| 🛒 **Cart** | Add products, view the cart, adjust quantities, cart totals, proceed to checkout |
| 💳 **Payments** | Razorpay order creation, Razorpay Checkout (test mode), server-side payment signature verification |
| 🗄️ **Content and data** | Payload collections for Users, Products, Categories, Media and Orders, with MongoDB persistence |
| 🧪 **Developer workflow** | Seed scripts, Docker-based local MongoDB, Payload type generation, linting and production builds |

---

## 🧰 Tech Stack

| Layer | Technologies |
|-------|--------------|
| 🖥️ **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) ![HTML](https://img.shields.io/badge/HTML-E34F26?style=flat-square) ![CSS](https://img.shields.io/badge/CSS-1572B6?style=flat-square) |
| ⚙️ **Backend / CMS** | ![Payload CMS](https://img.shields.io/badge/Payload_CMS-000000?style=flat-square) ![Next.js server-side](https://img.shields.io/badge/Server--side_Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white) |
| 🗄️ **Database** | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white) |
| 💳 **Payments** | ![Razorpay](https://img.shields.io/badge/Razorpay-0C2451?style=flat-square&logo=razorpay&logoColor=white) ![Test mode](https://img.shields.io/badge/Test_Mode-F2A33A?style=flat-square) |
| 🛠️ **Tooling** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat-square&logo=eslint&logoColor=white) ![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white) ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white) ![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white) |

---

## 🏗️ Architecture

```mermaid
flowchart TB
    User["👤 User"] --> Next["🖥️ Next.js Storefront"]
    Next --> Payload["⚙️ Payload CMS<br/>Backend and content layer"]
    Next --> Razorpay["💳 Razorpay<br/>Test-mode checkout"]
    Payload --> Mongo[("🗄️ MongoDB")]

    subgraph Collections["Payload Collections"]
        Users["Users"]
        Products["Products"]
        Categories["Categories"]
        Media["Media"]
        Orders["Orders"]
    end

    Payload --- Collections
```

**Role of each layer**

- 🖥️ **Next.js** renders the storefront: product browsing, search, filtering, cart, profile and checkout screens, plus server-side logic for the payment flow.
- ⚙️ **Payload CMS** owns the structured data model and authentication, handles media uploads, and gives administrators a dashboard for managing products and content.
- 🗄️ **MongoDB** stores the data behind every Payload collection.
- 💳 **Razorpay** handles payment collection in test mode.

### 🔄 Application flow

```mermaid
flowchart LR
    A["🛍️ Browse products"] --> B["🔎 Search, filter, sort"]
    B --> C["📄 Product details"]
    C --> D["➕ Add to cart"]
    D --> E["🛒 Cart"]
    E --> F["💳 Checkout"]
    F --> G["Razorpay payment"]
    G --> H["🔐 Server-side verification"]
    H --> I["✅ Order processing"]
```

---

## 🗄️ Data Model

Content and application data live in Payload collections.

| Collection | Purpose |
|------------|---------|
| 👤 **Users** | Customer accounts, authentication, profile information and avatar |
| 📦 **Products** | Product information, pricing, images and category association |
| 🏷️ **Categories** | Organizes products into browsable categories |
| 🖼️ **Media** | Uploaded files such as product images and user avatars |
| 🧾 **Orders** | Order data associated with checkout and payment |

---

## 🔐 Authentication and Profiles

![Auth](https://img.shields.io/badge/Auth-Payload-000000?style=flat-square) ![Profile](https://img.shields.io/badge/Profile-Editable-2EA44F?style=flat-square) ![Avatar](https://img.shields.io/badge/Avatar-Supported-3178C6?style=flat-square)

Users can sign up and log in, and the storefront adapts to the signed-in user.

- 📝 Account creation and login handled through Payload's authentication
- 🙋 Profile page with name, age and avatar, all editable
- 🖼️ Avatar thumbnail displayed in the navigation bar

---

## 🛒 Cart and Checkout

![Cart](https://img.shields.io/badge/Cart-Quantity_controls-2EA44F?style=flat-square) ![Razorpay](https://img.shields.io/badge/Razorpay-Test_Mode-F2A33A?style=flat-square) ![Verification](https://img.shields.io/badge/Signature_Check-Server--side-2EA44F?style=flat-square)

Users can add products to the cart, review items, adjust quantities and see cart totals before moving to checkout, where the Razorpay payment flow begins.

### 💳 Razorpay payment flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Next.js Storefront
    participant Server as Server-side Logic
    participant RZP as Razorpay

    User->>App: Proceed to checkout
    App->>Server: Request payment order
    Server->>RZP: Create Razorpay order
    RZP-->>Server: Order details
    Server-->>App: Order details for checkout
    App->>RZP: Open Razorpay Checkout
    User->>RZP: Complete test payment
    RZP-->>App: Payment response and signature
    App->>Server: Submit payment response
    Server->>Server: Verify signature with secret key
    Server-->>App: Verification result
```

🔐 **Server-side verification.** After a payment, Razorpay returns a response that includes a signature. ShopSphere verifies that signature on the server using the Razorpay secret instead of trusting client-side payment data. The secret key never reaches the browser.

> ⚠️ **Test mode only.** Razorpay is configured with test credentials. Normal development does not process real money, and the project does not claim production payment processing.

---

## 🚀 Getting Started

![Node.js](https://img.shields.io/badge/Node.js-npm-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![MongoDB](https://img.shields.io/badge/MongoDB-Required-47A248?style=flat-square&logo=mongodb&logoColor=white) ![Razorpay keys](https://img.shields.io/badge/Razorpay-Test_keys-F2A33A?style=flat-square)

### 📋 Prerequisites

- Node.js and npm
- MongoDB, either installed locally or run through Docker
- A Razorpay account with test-mode API keys

### 1️⃣ Clone and install

```bash
git clone <repository-url>
cd ShopSphere
npm install
```

### 2️⃣ Configure environment variables

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MongoDB connection string used by Payload, for example `mongodb://127.0.0.1/ShopSphere` for local development |
| `PAYLOAD_SECRET` | Secret used by Payload to secure authentication. Use a long, random value |
| `RAZORPAY_KEY_ID` | Razorpay API key ID. Use a test key (`rzp_test_...`) in development |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret, used on the server to create orders and verify payment signatures. Never expose it to the client |

```env
DATABASE_URL=mongodb://127.0.0.1/ShopSphere
PAYLOAD_SECRET=replace-with-a-long-random-secret
RAZORPAY_KEY_ID=rzp_test_replace_me
RAZORPAY_KEY_SECRET=replace-with-your-razorpay-test-secret
```

### 3️⃣ Start MongoDB

The repository includes Docker configuration for running MongoDB locally:

```bash
docker-compose up -d
```

This starts the database only; the application itself runs through npm.

### 4️⃣ Seed the catalog (optional)

```bash
npm run seed:products
npm run seed:product-images
```

These scripts create product records and product images so you have a working catalog without entering data by hand.

### 5️⃣ Run the app

```bash
npm run dev
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | ▶️ Start the development server |
| `npm run build` | 📦 Create a production build |
| `npm run start` | 🚀 Start the production application |
| `npm run lint` | 🧹 Run ESLint |
| `npm run generate:types` | 🧬 Generate Payload TypeScript types |
| `npm run seed:products` | 🌱 Seed product records |
| `npm run seed:product-images` | 🖼️ Seed product media and images |

<!--
## 📂 Project Structure

Check this against the actual repository before uncommenting, and adjust names to match.

```text
ShopSphere/
├── app/               # Next.js routes and pages
├── components/        # Reusable UI components
├── collections/       # Payload CMS collections
├── scripts/           # Data seeding scripts
├── payload.config.*   # Payload configuration
├── docker-compose.yml # Local MongoDB
├── .env.example
└── package.json
```
-->

---

## ☁️ Deployment

[![Vercel](https://img.shields.io/badge/Vercel-Live-000000?style=flat-square&logo=vercel&logoColor=white)](https://shopsphere-nu-orpin.vercel.app/)

ShopSphere is deployed on Vercel: **[shopsphere-nu-orpin.vercel.app](https://shopsphere-nu-orpin.vercel.app/)**

To deploy your own instance:

1. Run the checks locally:

   ```bash
   npm run lint
   npm run build
   ```

2. Set these environment variables in the hosting provider: `DATABASE_URL`, `PAYLOAD_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
3. Make sure the MongoDB database is reachable from the deployed application.

---

## 🛡️ Security Considerations

- 🚫 Never commit `.env`. Keep real values in environment variables only.
- 🔑 Never expose `RAZORPAY_KEY_SECRET` to the client or in version control.
- 🧪 Use Razorpay **test** credentials for development and demos.
- 🎲 Use a long, random `PAYLOAD_SECRET`.
- ☁️ Store production credentials only in your hosting provider's secure environment settings.
- 🔒 Serve the application over HTTPS in production.

---

## 🗺️ Future Improvements

![Status](https://img.shields.io/badge/Status-Not_implemented_yet-lightgrey?style=flat-square)

- [ ] Order history and order tracking
- [ ] Wishlist
- [ ] Product reviews and ratings
- [ ] Inventory management
- [ ] Coupons and discounts
- [ ] Admin analytics
- [ ] Email notifications
- [ ] Production Razorpay payments
- [ ] Automated tests and a CI/CD pipeline

---

## 👨‍💻 Author

**Adarsh Agarwal**, software developer focused on backend and full-stack web development. Final-year B.Tech CSE student at Amity University Lucknow, with internship experience at Tata Consultancy Services and W3villa Technologies.

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/AdarshAgarwal2005)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:adarshagrawal2233@gmail.com)
