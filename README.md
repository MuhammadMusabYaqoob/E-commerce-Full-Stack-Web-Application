# 🛒 P7 E-commerce Full Stack

A complete e-commerce web application built with **Vue 3**, **Express**, **PostgreSQL**, **Cloudinary**, and **Tailwind CSS**.

It has a public storefront, customer accounts, seller tools, and a full admin panel. Product photos are uploaded to Cloudinary, users log in with secure JWT cookies, and orders are stored in a relational database.

> **Who is this README for?**
> It assumes you are new to full-stack development. Every folder, file, command, and concept is explained in plain language. If you only want to run the project, jump to [Getting started](#-getting-started). If you want to understand how it works, read top to bottom.

---

## 📚 Table of contents

1. [What this project is](#-what-this-project-is)
2. [What I built (features)](#-what-i-built-features)
3. [Tech stack](#-tech-stack)
4. [How the pieces fit together](#-how-the-pieces-fit-together)
5. [Folder structure](#-folder-structure)
6. [Getting started](#-getting-started)
7. [Environment variables](#-environment-variables)
8. [Available scripts](#-available-scripts)
9. [Database design](#-database-design)
10. [API reference](#-api-reference)
11. [How login and authentication work](#-how-login-and-authentication-work)
12. [How the frontend is organized](#-how-the-frontend-is-organized)
13. [How images and orders work](#-how-images-and-orders-work)
14. [Roles and permissions](#-roles-and-permissions)
15. [Beginner glossary](#-beginner-glossary)
16. [Troubleshooting](#-troubleshooting)
17. [Known limitations and security notes](#-known-limitations-and-security-notes)
18. [Roadmap](#-roadmap)
19. [Pushing this project to GitHub](#-pushing-this-project-to-github)
20. [Deployment notes](#-deployment-notes)
21. [License and author](#-license-and-author)

---

## 🧭 What this project is

Think of a normal online shop such as Amazon or Daraz, reduced to the essential parts:

- A **visitor** can browse products, search, filter by category or price, open a product page, and add items to a cart.
- A **customer** can register, log in, update their profile, place an order, and see their order history.
- A **seller** can add and manage products.
- An **admin** can manage categories, products, users, and all orders.

The project is split into two applications:

| Part | What it does | Where it lives |
|---|---|---|
| **Backend** | Stores data, checks permissions, talks to the database and Cloudinary, exposes a REST API | `backend/` |
| **Frontend** | The screens the user sees and clicks in the browser | `frontend/` |

They are separate programs. The frontend never talks to the database directly. It sends HTTP requests to the backend, and the backend decides what to do.

---

## ✨ What I built (features)

### 🏬 Storefront

- Home page listing all products
- Live search by product name or description (debounced, so it waits for you to stop typing)
- Category filter with checkboxes
- Price-range filter
- Pagination
- Loading skeletons and friendly error states
- Product details page with image gallery
- Related products from the same category
- Category listing page and per-category pages
- Shopping cart saved in `localStorage`
- Quantity controls (1–99), remove item, live subtotal
- Checkout form with delivery details

### 👤 Accounts

- Registration with validation
- Login and logout
- Passwords hashed with **bcrypt** (never stored as plain text)
- JWT access token stored in an **HTTP-only cookie**
- Update name, email, phone, and address
- Change password with current-password confirmation
- Password rules: 8–16 characters, uppercase, lowercase, number, and special character
- Route guards: logged-out users are redirected to login; logged-in users cannot open login/register

### 🧑‍💼 Customer dashboard

- Overview page
- Editable profile
- Change-password form
- Order history with item images, totals, status, and delivery address

### 📦 Seller dashboard

- Overview page
- Shared product list
- Create product
- Update product
- Delete product

### 🛠️ Admin panel

- Overview
- Create, edit, and delete categories
- Product list with edit links
- Create, update, and delete products
- View all customer orders
- View all users with role counts and pagination

### ⚙️ Backend engineering

- REST API with clear resource routes (`users`, `categories`, `products`, `orders`)
- Central error handler and consistent JSON responses
- Custom `ApiError` and `ApiResponse` classes
- `asyncHandler` wrapper so `async` errors reach the error middleware
- JWT verification middleware
- Role-authorization middleware
- Multer file uploads with type/size limits
- Cloudinary upload and cleanup (including rollback if a database insert fails)
- Unique slugs generated from product/category names
- Server-side price calculation for orders (client prices are ignored)
- SQL transactions (`BEGIN` / `COMMIT` / `ROLLBACK`) for products and orders
- Pagination on products, users, and admin orders
- Server-side filtering and search

### 🎨 Frontend engineering

- Vue 3 Composition API with `<script setup>`
- Vue Router with nested, role-protected routes
- Axios service with `withCredentials` for cookies
- Reusable components (`BaseButton`, `BaseInput`, `ModelBox`)
- Global toast notifications
- Reusable composables (`useCart`, `useToast`)
- Responsive Tailwind CSS 4 design
- Accessible forms, labels, and focus styles
- Loading, empty, and error states on every data page

> **A note on the two backends:** the project contains a **MongoDB/Mongoose** implementation *and* a newer **PostgreSQL** implementation. The frontend uses the PostgreSQL API. The Mongo code is kept as reference/learning material. The active, recommended setup is **PostgreSQL**.

---

## 🧰 Tech stack

| Technology | Version | What it does in this project |
|---|---|---|
| **Node.js** | 20.19+ (22 LTS recommended) | Runs JavaScript on the server and the Vite build |
| **Express** | 5 | Web framework for the REST API |
| **PostgreSQL** | 13+ | Relational database (active) |
| **MongoDB + Mongoose** | 9 | Older database implementation, kept for reference |
| **bcrypt** | 6 | Hashes passwords |
| **jsonwebtoken** | 9 | Creates and verifies login tokens |
| **cookie-parser** | 1.4 | Reads cookies from requests |
| **cors** | 2 | Allows the frontend origin to call the API |
| **multer** | 2 | Receives uploaded image files |
| **cloudinary** | 2 | Stores product images in the cloud |
| **slugify** | 1.6 | Turns `"Wireless Headphones"` into `"wireless-headphones"` |
| **dotenv** | 18 | Loads secrets from `.env` |
| **Vue** | 3.5 | Frontend UI framework |
| **Vue Router** | 5 | Client-side page navigation |
| **Vite** | 8 | Frontend dev server and build tool |
| **Tailwind CSS** | 4 | Utility-first styling |
| **Axios** | 1.21 | HTTP client for API calls |
| **PrimeIcons** | 8 | Icon set |

---

## 🔄 How the pieces fit together

```
┌──────────────────────────┐
│        Browser           │
│  Vue 3 + Vue Router      │
│  Tailwind CSS            │
└────────────┬─────────────┘
             │  HTTP requests (JSON / multipart)
             │  cookies sent with withCredentials
             ▼
┌──────────────────────────┐
│      Express API         │
│  routes → middlewares    │
│  → controllers → utils   │
└───────┬──────────┬───────┘
        │          │
        │          │ image files
        │          ▼
        │   ┌──────────────┐
        │   │  Cloudinary  │
        │   └──────────────┘
        ▼
┌──────────────────────────┐
│       PostgreSQL         │
│  users, categories,      │
│  products, images,       │
│  orders, order_items     │
└──────────────────────────┘
```

### What happens on a typical request?

Example: a customer opens the home page.

1. Vue mounts `HomePage.vue`.
2. `HomePage.vue` calls `api.get("/api/v1/products/get-products")`.
3. Axios combines the base URL (`VITE_API_URL`) with the path and sends a request.
4. Express receives it at `app.postgres.js`, which forwards it to the product router.
5. The router calls `getAllProducts` in `product.controller.postgres.js`.
6. The controller builds a SQL query, asks PostgreSQL for data, and wraps the result in `ApiResponse`.
7. The browser receives JSON and Vue re-renders the product cards.

This flow is the same for login, cart checkout, and every other page.

---

## 📁 Folder structure

```text
P7 E-commerce Full Stack/
│
├── README.md                     ← you are here
├── .kilo/                        ← AI-editor config (not part of the app)
│
├── backend/                      ← Express REST API
│   ├── .env                      ← secrets (NEVER commit this)
│   ├── .env.example              ← safe template you can commit
│   ├── package.json              ← dependencies and scripts
│   ├── Readme.md
│   ├── public/                   ← static files served by Express
│   ├── database/
│   │   └── schema.sql            ← PostgreSQL tables, keys, and indexes
│   └── src/
│       ├── app.js                ← Express app using MongoDB
│       ├── app.postgres.js       ← Express app using PostgreSQL (ACTIVE)
│       ├── server.js             ← starts the Mongo version
│       ├── server.postgres.js    ← starts the Postgres version (ACTIVE)
│       ├── constants.js          ← shared constants
│       ├── db/
│       │   ├── db.js             ← MongoDB connection
│       │   └── postgres.js       ← PostgreSQL connection pool
│       ├── models/               ← Mongoose schemas (Mongo version)
│       │   ├── user.model.js
│       │   ├── category.model.js
│       │   ├── product.model.js
│       │   └── order.model.js
│       ├── routes/               ← URL definitions
│       │   ├── user.route.js
│       │   ├── category.route.js
│       │   ├── product.route.js
│       │   ├── order.route.js
│       │   └── *.postgres.js     ← Postgres versions
│       ├── controllers/          ← business logic
│       │   ├── user.controller.js
│       │   ├── category.controller.js
│       │   ├── product.controller.js
│       │   ├── order.controller.js
│       │   └── *.postgres.js     ← Postgres versions
│       ├── middlewares/
│       │   ├── auth.middleware.js          ← verifies JWT
│       │   ├── auth.middleware.postgres.js ← verifies JWT against Postgres
│       │   ├── authorizeRoles.js           ← role checks
│       │   ├── multer.middleware.js        ← image upload rules
│       │   └── error.middleware.js         ← central error handler
│       └── utils/
│           ├── ApiError.js        ← custom error shape
│           ├── ApiResponse.js     ← custom success shape
│           ├── asyncHandler.js    ← catches async errors
│           └── cloudinary.js      ← upload/delete images
│
└── frontend/                     ← Vue single-page application
    ├── .env                      ← API URL
    ├── .env.example
    ├── index.html                ← Vite entry HTML
    ├── vite.config.js
    ├── package.json
    ├── public/                   ← static images and icons
    ├── dist/                     ← production build (ignored by Git)
    └── src/
        ├── main.js               ← creates the Vue app
        ├── App.vue               ← root component + auth store
        ├── style.css             ← fonts + Tailwind import
        ├── assets/
        ├── services/
        │   └── api.js            ← configured Axios instance
        ├── composables/
        │   ├── useCart.js        ← shared cart logic
        │   ├── useToast.js       ← notification logic
        │   └── characterLimit.js
        ├── router/
        │   └── router.js         ← all routes + navigation guards
        ├── components/
        │   ├── BaseButton.vue
        │   ├── BaseInput.vue
        │   ├── ModelBox.vue
        │   ├── AdminFeaturePlaceholder.vue
        │   └── layout/
        │       ├── Layout.vue    ← header + footer wrapper
        │       ├── Header.vue
        │       ├── Footer.vue
        │       ├── AuthLayout.vue
        │       └── ToastMessage.vue
        └── views/
            ├── HomePage.vue
            ├── ProductDetails.vue
            ├── CategoryPage.vue
            ├── CartPage.vue
            ├── CheckoutPage.vue
            ├── LogInPage.vue
            ├── RegisterPage.vue
            ├── Dashboard.vue
            ├── AboutPage.vue
            ├── ContactPage.vue
            ├── Policy.vue
            ├── PageNotFound.vue
            ├── User/             ← customer pages
            ├── Seller/           ← seller pages
            └── Admin/            ← admin pages
```

---

## 🚀 Getting started

### Prerequisites

Install these first:

| Tool | Why | Check with |
|---|---|---|
| **Node.js 20.19+** (22 LTS recommended) | Runs backend and frontend | `node -v` |
| **npm** | Installs dependencies | `npm -v` |
| **PostgreSQL 13+** | Database | `psql --version` |
| **A Cloudinary account** | Free image hosting | [cloudinary.com](https://cloudinary.com) |
| **Git** (optional) | Version control + GitHub | `git --version` |

You also need a code editor such as VS Code.

---

### Step 1 — Download the project

If the project is already on your computer, open a terminal in the project root:

```bash
cd "P7 E-commerce Full Stack"
```

If you cloned it from GitHub:

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
```

---

### Step 2 — Install backend dependencies

```bash
cd backend
npm install
```

`npm install` reads `package.json` and downloads every library into a `node_modules/` folder. You never edit `node_modules` by hand and never commit it.

---

### Step 3 — Create the PostgreSQL database

Open a terminal and connect to PostgreSQL:

```bash
psql -U postgres
```

Create the database:

```sql
CREATE DATABASE ecommerce;
```

Exit with `\q`, then load the schema file:

```bash
psql -U postgres -d ecommerce -f backend/database/schema.sql
```

> Run that command from the project root. If you are already inside `backend/`, use `psql -U postgres -d ecommerce -f database/schema.sql`.

What this does: creates six tables (`users`, `categories`, `products`, `product_images`, `orders`, `order_items`) plus indexes and foreign keys. See [Database design](#-database-design).

Verify it worked:

```bash
psql -U postgres -d ecommerce -c "\dt"
```

You should see all six tables listed.

---

### Step 4 — Create the backend `.env` file

Create `backend/.env` by copying the template:

**Windows (PowerShell):**

```powershell
Copy-Item backend/.env.example backend/.env
```

**macOS / Linux:**

```bash
cp backend/.env.example backend/.env
```

Now open `backend/.env` and fill in real values. At minimum you need:

- `DATABASE_URL` — your PostgreSQL connection string
- `ACCESS_TOKEN_SECRET` — any long random string
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

Generate a strong token secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run that twice: once for `ACCESS_TOKEN_SECRET`, once for `REFRESH_TOKEN_SECRET`.

> ⚠️ **Never commit `.env`.** It contains database passwords and API keys. The backend `.gitignore` already ignores it.

---

### Step 5 — Start the backend

From `backend/`:

```bash
npm run server
```

This starts the **PostgreSQL** server with `nodemon`, which restarts automatically when you edit a file.

Expected output:

```text
PostgreSQL API server is running on port 3000
```

> `npm start` starts the older **MongoDB** server instead. Use `npm run server` for the active Postgres version.

Test the API in a browser or with curl:

```bash
curl http://localhost:3000/api/v1/categories/get-categories
```

You should get JSON such as:

```json
{
  "statusCode": 200,
  "data": [],
  "message": "Categories retrieved successfully",
  "success": true
}
```

---

### Step 6 — Install and start the frontend

Open a **second terminal** (keep the backend running):

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```bash
cp .env.example .env
```

It should contain:

```env
VITE_API_URL=http://localhost:3000
```

Then start Vite:

```bash
npm run dev
```

Expected output:

```text
  VITE v8.x  ready in ... ms
  ➜  Local:   http://localhost:5173/
```

---

### Step 7 — Open the app

Visit **http://localhost:5173**.

You should see the storefront. Because the database is empty, it will say there are no products yet.

---

### Step 8 — Create your first admin account

1. Go to **Register**.
2. Fill in the form.
3. Choose **Admin** as the account type.
4. Log in and open **Dashboard**.

> **Important:** the current registration form lets anyone choose `seller` or `admin`. This is convenient for learning but **not safe for a real shop**. See [Known limitations](#-known-limitations-and-security-notes) for the fix.

If you prefer to promote an existing account manually:

```bash
psql -U postgres -d ecommerce
```

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Then log out and log in again.

---

### Step 9 — Add sample data

1. Open **Dashboard → Create Category**.
2. Create a category such as `Electronics`.
3. Open **Dashboard → Products → Add Product**.
4. Fill in the form and upload at least one image.
5. The product now appears on the home page.

---

## 🔐 Environment variables

Environment variables are settings stored outside your code. They let the same code run on your laptop and on a server without editing source files.

### `backend/.env`

| Variable | Required | Example | What it means |
|---|---|---|---|
| `PORT` | No | `3000` | Port the API listens on (default `8080` if missing) |
| `CORS_ORIGIN` | Yes | `http://localhost:5173` | Which frontend origin may call the API |
| `DATABASE_URL` | **Yes** | `postgresql://postgres:password@localhost:5432/ecommerce` | PostgreSQL connection string |
| `ACCESS_TOKEN_SECRET` | **Yes** | long random string | Secret used to sign login tokens |
| `ACCESS_TOKEN_EXPIRY` | No | `1d` | How long a login lasts |
| `REFRESH_TOKEN_SECRET` | No | long random string | Reserved for a future refresh-token feature |
| `REFRESH_TOKEN_EXPIRY` | No | `10d` | Reserved for a future refresh-token feature |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | `my-cloud` | Cloudinary project name |
| `CLOUDINARY_API_KEY` | **Yes** | `123456789012345` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | **Yes** | long string | Cloudinary API secret |
| `MONGODB_URI` | Only for Mongo | `mongodb+srv://...` | Old Mongo connection string |
| `MONGODB_USERNAME` | No | — | Legacy, not used by the current code |
| `MONGODB_PASSWORD` | No | — | Legacy, not used by the current code |
| `COLLECTION_URL` | No | — | Unused placeholder |

Where to find Cloudinary values: log in to Cloudinary → **Dashboard** → **Product Environment Credentials**.

### `frontend/.env`

| Variable | Required | Example | What it means |
|---|---|---|---|
| `VITE_API_URL` | **Yes** | `http://localhost:3000` | Base URL of the backend API |

Vite only exposes variables that start with `VITE_`. That is why the frontend variable has that prefix.

> **Security rule:** anything in a `VITE_` variable ends up in the browser bundle. Never put secrets there.

---

## 📜 Available scripts

### Backend (`backend/package.json`)

| Command | What it runs | When to use |
|---|---|---|
| `npm run server` | `nodemon src/server.postgres.js` | **Normal development** (PostgreSQL) |
| `npm start` | `node src/server.js` | Older MongoDB server |

### Frontend (`frontend/package.json`)

| Command | What it does | When to use |
|---|---|---|
| `npm run dev` | Starts Vite dev server with hot reload | Development |
| `npm run build` | Creates an optimized `dist/` folder | Before deploying |
| `npm run preview` | Serves the built `dist/` locally | Checking a production build |

There is also `npx prettier --write .` in the backend for formatting.

---

## 🗄️ Database design

The active PostgreSQL schema lives in [`backend/database/schema.sql`](backend/database/schema.sql).

### Tables

| Table | What it stores |
|---|---|
| `users` | Accounts: name, email, password hash, phone, address, role |
| `categories` | Product categories: name and URL-friendly slug |
| `products` | Product details: name, slug, description, price, category, shipping flag |
| `product_images` | One row per image, linked to a product (supports up to 5 images) |
| `orders` | One row per order: customer, delivery details, totals, statuses |
| `order_items` | One row per product inside an order, with a price snapshot |

### Relationships

```
users 1 ──── * orders
orders 1 ─── * order_items
products 1 ── * order_items          (price/name are copied into the order)
categories 1 ─ * products
products 1 ── * product_images
```

Read the arrows like this: **one user can have many orders**, **one order has many order items**, and so on.

### Why some data is copied into `order_items`

An order item stores `product_name`, `image_url`, and `unit_price` even though those already exist in `products`. This is intentional:

- If an admin renames a product later, old orders still show the name the customer bought.
- If a product is deleted, the order history still makes sense.
- The price the customer paid never changes retroactively.

This technique is called a **snapshot**.

### Why prices are recalculated on the server

The checkout request sends only product IDs and quantities. The backend looks up the real prices in PostgreSQL, converts them to cents, multiplies, and stores the result. A malicious user cannot send `price: 0.01` and buy a laptop cheaply.

### UUID primary keys

Every table uses a UUID such as `8f14e45f-ceea-467f-a1fb-2f0b0a71a9a3` instead of `1, 2, 3`. UUIDs are hard to guess and safe to expose in URLs.

---

## 🔌 API reference

Base URL:

```text
http://localhost:3000/api/v1
```

### Response format

Success:

```json
{
  "statusCode": 200,
  "data": { },
  "message": "Products retrieved successfully",
  "success": true
}
```

Error:

```json
{
  "success": false,
  "message": "Product not found",
  "errors": []
}
```

### Authentication

Protected routes accept the JWT in either of two ways:

1. The `accessToken` **HTTP-only cookie** set by the login endpoint (used by the browser).
2. An `Authorization: Bearer <token>` header (useful for Postman or mobile apps).

The frontend uses the cookie method automatically because Axios is configured with `withCredentials: true`.

### Users

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/users/register` | Public | Create an account |
| `POST` | `/users/login` | Public | Log in and set the cookie |
| `POST` | `/users/logout` | Logged in | Clear auth cookies |
| `PATCH` | `/users/update-profile` | Logged in | Update name, email, phone, address |
| `PATCH` | `/users/change-password` | Logged in | Change password |
| `GET` | `/users/admin/users?page=1` | Admin | List users with role counts |

### Categories

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/categories/get-categories` | Public | List all categories |
| `GET` | `/categories/single-category/:slug` | Public | Get one category by slug |
| `POST` | `/categories/create-category` | Admin | Create a category |
| `PUT` | `/categories/:categoryId` | Admin | Rename a category |
| `DELETE` | `/categories/delete-category/:id` | Admin | Delete an unused category |

### Products

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/products/get-products` | Public | List/search/filter products |
| `GET` | `/products/single-product/:slug` | Public | Get one product by slug |
| `POST` | `/products/create-product` | Admin, Seller | Create a product (multipart form) |
| `PUT` | `/products/update-product/:id` | Admin, Seller | Update a product (multipart form) |
| `DELETE` | `/products/delete-product/:id` | Admin, Seller | Delete a product and its images |

**Product list query parameters**

| Parameter | Example | Meaning |
|---|---|---|
| `page` | `2` | Page number (10 products per page) |
| `category` | `uuid1,uuid2` | Comma-separated category IDs |
| `search` | `headphones` | Matches name or description |
| `minPrice` | `20` | Minimum price |
| `maxPrice` | `99.99` | Maximum price |

### Orders

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/orders/place-order` | Customer | Place an order |
| `GET` | `/orders/my-orders` | Customer | Get the current user's orders |
| `GET` | `/orders/admin/orders?page=1` | Admin | Get every order |

**Place-order body example**

```json
{
  "items": [
    { "productId": "8f14e45f-ceea-467f-a1fb-2f0b0a71a9a3", "quantity": 2 }
  ],
  "shippingAddress": {
    "name": "Ali Khan",
    "email": "ali@example.com",
    "phone": "03001234567",
    "address": "House 12, Street 4, Lahore"
  }
}
```

### Common HTTP status codes

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `400` | Bad request (missing or invalid data) |
| `401` | Not logged in / invalid token |
| `403` | Logged in but not allowed |
| `404` | Not found |
| `409` | Conflict (duplicate email, category in use) |
| `500` | Server error |

---

## 🔑 How login and authentication work

This is often the hardest part for beginners. Here is the whole flow, step by step.

### 1. Register

The user submits name, email, password, phone, and address.

- The frontend validates the form in `RegisterPage.vue`.
- The backend validates again in `user.controller.postgres.js` (never trust the browser).
- `bcrypt.hash(password, 10)` turns the password into an irreversible hash.
- The hash is stored in `users.password_hash`. The real password is never saved.

### 2. Login

The user submits email and password.

- The backend finds the user by email.
- `bcrypt.compare(password, password_hash)` checks whether they match.
- If correct, the backend creates a JWT:

```js
jwt.sign({ _id: user.id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" })
```

- The token is placed in a cookie:

```js
res.cookie("accessToken", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});
```

### 3. Why HTTP-only?

`httpOnly: true` means JavaScript in the browser **cannot read the cookie**. This protects the token from common cross-site scripting (XSS) attacks.

### 4. Protected requests

For routes like `PATCH /users/update-profile`:

1. The browser automatically sends the cookie.
2. `verifyJWT` reads `req.cookies.accessToken`.
3. It verifies the token signature and expiry.
4. It loads the current user from the database.
5. It attaches the user to `req.user`.
6. `authorizeRoles("admin")` checks the role.
7. Only then does the controller run.

### 5. Logout

The backend clears the cookie with `res.clearCookie(...)`. The frontend also removes the cached user from `localStorage`.

### 6. Frontend state

`App.vue` provides an `auth` object to every component:

```js
provide("auth", { user, isAuthenticated, setUser, clearUser });
```

Any component can access it with:

```js
const { user, setUser } = inject("auth");
```

`user` is also saved in `localStorage` so a page refresh keeps the user “logged in” visually. The real security still comes from the server-side cookie check.

> **Important:** the frontend route guard is only for user experience. Real permission checks always happen on the backend.

---

## 🖥️ How the frontend is organized

### Routes

| Path | Page | Who can access it |
|---|---|---|
| `/` | Home / product list | Everyone |
| `/product/:slug` | Product details | Everyone |
| `/category` | All categories | Everyone |
| `/category/:slug` | Products in a category | Everyone |
| `/cart` | Cart | Everyone |
| `/checkout` | Checkout | Logged-in customers |
| `/login` | Login | Guests only |
| `/register` | Register | Guests only |
| `/dashboard` | Redirects by role | Logged-in users |
| `/dashboard/customer` | Customer overview | Customers |
| `/dashboard/customer/profile` | Profile | Customers |
| `/dashboard/customer/orders` | Order history | Customers |
| `/dashboard/seller` | Seller overview | Sellers |
| `/dashboard/seller/products` | Seller product list | Sellers |
| `/dashboard/seller/products/new` | Create product | Sellers |
| `/dashboard/seller/products/:slug/edit` | Edit product | Sellers |
| `/dashboard/admin` | Admin overview | Admins |
| `/dashboard/admin/categories/new` | Category management | Admins |
| `/dashboard/admin/products` | Product list | Admins |
| `/dashboard/admin/products/new` | Create product | Admins |
| `/dashboard/admin/products/:slug/edit` | Edit product | Admins |
| `/dashboard/admin/orders` | All orders | Admins |
| `/dashboard/admin/users` | All users | Admins |
| `*` | 404 page | Everyone |

The guard in `router.js` checks:

```js
if (to.matched.some((route) => route.meta.requiresAuth) && !user) {
  return { name: "login", query: { redirect: to.fullPath } };
}

const roleRoute = to.matched.find((route) => route.meta.roles);
if (roleRoute && !roleRoute.meta.roles.includes(user?.role)) {
  return { name: "dashboard" };
}
```

In plain English:

- If the page needs a login and there is no user → go to login.
- If the page is for a different role → go to the dashboard chooser.
- If the page is login/register and the user is already logged in → go to the dashboard.

### Shared state

| Shared thing | Where it lives | Why |
|---|---|---|
| Logged-in user | `App.vue` + `provide/inject` | Available everywhere without prop drilling |
| Cart | `composables/useCart.js` + `localStorage` | Survives page refresh |
| Toast messages | `composables/useToast.js` | One notification component for the whole app |

### Axios

`services/api.js` creates one configured Axios instance:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
});
```

`withCredentials: true` is what allows the browser to send the auth cookie to the API.

---

## 🖼️ How images and orders work

### Product image upload

1. The admin selects up to 5 images in `CreateProduct.vue`.
2. Vue builds a `FormData` object and adds each file under the field name `photos`.
3. Axios sends it as `multipart/form-data`.
4. Multer receives the files, checks that each is an image, and enforces the 5 MB limit.
5. Each file is temporarily saved in the OS temp folder.
6. `uploadOnCloudinary` sends it to Cloudinary and returns a secure URL and public ID.
7. The product row and one `product_images` row per image are inserted inside a SQL transaction.
8. If anything fails, the transaction is rolled back and already-uploaded Cloudinary images are deleted.
9. Temporary files are always removed in a `finally` block.

Why store `public_id`? Cloudinary needs it to delete or replace the image later.

### Update product images

When new images are uploaded:

1. New images are uploaded first.
2. The database transaction replaces all image rows.
3. Only after a successful commit are the old Cloudinary images deleted.

This order prevents a failed update from leaving a product with no images.

### Delete product

1. Delete the product row. `product_images` rows are removed by `ON DELETE CASCADE`.
2. Delete each Cloudinary image.
3. If Cloudinary cleanup fails, the product is still deleted, but an informative message is returned.

### Order placement

1. The cart lives in `localStorage` on the frontend.
2. Checkout sends `[{ productId, quantity }]` and the delivery address.
3. The backend validates every UUID and quantity.
4. It opens a transaction and locks the product rows with `FOR SHARE`.
5. It fetches current prices and first images from PostgreSQL.
6. It recalculates each line total and the subtotal **in cents** to avoid floating-point rounding errors.
7. It inserts the `orders` row and every `order_items` row.
8. It commits and returns the saved order.
9. The frontend clears the cart and redirects to order history.

### Pagination

All list endpoints use the same pattern:

```sql
SELECT ... LIMIT $1 OFFSET $2
```

- `LIMIT` = how many rows to return (10 here).
- `OFFSET` = how many rows to skip.
- Page 2 means `OFFSET 10`.

The response also returns `totalPages`, `currentPage`, and `totalProducts` so the UI can render page buttons.

---

## 🎭 Roles and permissions

| Action | Guest | Customer | Seller | Admin |
|---|:---:|:---:|:---:|:---:|
| Browse products and categories | ✅ | ✅ | ✅ | ✅ |
| Add to cart | ✅ | ✅ | ✅ | ✅ |
| Register / log in | ✅ | — | — | — |
| Place an order | ❌ | ✅ | ❌ | ❌ |
| View own orders | ❌ | ✅ | ❌ | ❌ |
| Edit own profile | ❌ | ✅ | ✅ | ✅ |
| Create/update/delete products | ❌ | ❌ | ✅ | ✅ |
| Manage categories | ❌ | ❌ | ❌ | ✅ |
| View all users | ❌ | ❌ | ❌ | ✅ |
| View all orders | ❌ | ❌ | ❌ | ✅ |

### What each role is for

- **Customer (default):** shops and places orders.
- **Seller:** manages products. Intended to manage *their own* products.
- **Admin:** full control of the store.

> ⚠️ The current schema has no `seller_id` on products, so sellers can edit any product. See the limitations section.

---

## 📖 Beginner glossary

| Term | Simple meaning |
|---|---|
| **API** | A set of URLs the frontend calls to read or change data |
| **REST** | A style of API that uses HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and resource names |
| **Endpoint** | One specific API URL, such as `/api/v1/products/get-products` |
| **HTTP method** | The action: `GET` reads, `POST` creates, `PUT`/`PATCH` updates, `DELETE` removes |
| **JSON** | A text format for sending structured data |
| **Middleware** | A function that runs between the request and the controller (auth, validation, uploads) |
| **Controller** | The function that contains the actual business logic |
| **Router** | Maps a URL to a controller |
| **JWT** | A signed token that proves who the user is |
| **Cookie** | A small piece of data the browser stores and sends automatically |
| **HTTP-only cookie** | A cookie that JavaScript cannot read, which protects auth tokens |
| **bcrypt** | A slow hashing algorithm designed for passwords |
| **Hash** | A one-way fingerprint of data; you can verify it but not reverse it |
| **CORS** | Browser security rule that controls which frontend origins may call the API |
| **ORM** | A library that maps database rows to code objects (Mongoose is one for MongoDB) |
| **SQL** | The language used to query relational databases |
| **Transaction** | A group of database changes that either all succeed or all roll back |
| **Foreign key** | A rule that links a row to a row in another table |
| **Migration** | A versioned script that changes the database structure over time |
| **Slug** | A URL-friendly version of a name, e.g. `wireless-headphones` |
| **Pagination** | Splitting a large list into pages |
| **Multipart form** | The request format used to upload files |
| **SPA** | Single-page application: the browser loads once, then Vue swaps pages without full reloads |
| **SFC** | Single-File Component: a `.vue` file with `<script>`, `<template>`, and `<style>` |
| **Composable** | A reusable Vue function that shares state or logic (`useCart`) |
| **Reactive / `ref`** | Vue's way of tracking changes and updating the screen automatically |
| **Provide / inject** | Vue's way to share data with deeply nested components without passing props |
| **Environment variable** | A configuration value stored outside the code, such as a database password |
| **Cents-based math** | Storing money as integers to avoid `0.1 + 0.2 = 0.30000000000000004` errors |

---

## 🧯 Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| `connect ECONNREFUSED` on the backend | PostgreSQL is not running | Start PostgreSQL (Windows: Services → PostgreSQL; macOS: `brew services start postgresql`) |
| `relation "users" does not exist` | Schema was not loaded | Run `psql -U postgres -d ecommerce -f backend/database/schema.sql` |
| `password authentication failed` | Wrong password in `DATABASE_URL` | Recheck the URL: `postgresql://USER:PASSWORD@localhost:5432/ecommerce` |
| Frontend shows “Could not load the store” | Backend is not running or wrong URL | Start `npm run server`; confirm `VITE_API_URL=http://localhost:3000` |
| CORS error in the browser console | `CORS_ORIGIN` does not match the frontend URL | Set `CORS_ORIGIN=http://localhost:5173` and restart the backend |
| Login succeeds but protected pages return `401` | Cookie not sent | Make sure `withCredentials: true` is present; do not open the frontend on `127.0.0.1` while `CORS_ORIGIN` says `localhost` |
| Product creation fails | Missing Cloudinary keys or no image selected | Check `.env`; select at least one image |
| “Choose no more than 5 product photos” | More than 5 files selected | Select 5 or fewer |
| Images upload but do not show | Cloudinary upload failed silently | Check the backend console for `Cloudinary upload failed` |
| Port already in use | Another process uses 3000 or 5173 | Stop the other process or change `PORT` / use `npm run dev -- --port 5174` |
| `npm start` connects to MongoDB instead | Wrong script | Use `npm run server` |
| Products do not appear after creation | No category selected, or page not refreshed | Create a category first, then reload |
| `role` redirects to the wrong dashboard | Cached `authUser` in `localStorage` is stale | Log out and log in again, or clear site data |
| Build fails on a clean machine | Node version too old | Use Node 20.19 or newer (22 LTS recommended) |

### Useful debugging commands

```bash
# Check Node
node -v

# Check API health (should return JSON)
curl http://localhost:3000/api/v1/categories/get-categories

# Check tables
psql -U postgres -d ecommerce -c "\dt"

# Check users
psql -U postgres -d ecommerce -c "SELECT id, name, email, role FROM users;"

# Check the frontend production build
cd frontend
npm run build
```

Open the browser **Developer Tools → Console** and **Network** tabs. Most frontend problems become obvious there.

---

## ⚠️ Known limitations and security notes

This is a learning/portfolio project, not a production-ready shop. Be aware of these before publishing or deploying:

1. **Anyone can register as admin.** The registration endpoint accepts `role: "admin"`. In production, force new accounts to `customer` and promote roles only from a trusted admin panel or directly in the database.
2. **Sellers are not scoped to their own products.** `products` has no `seller_id`, so a seller can edit or delete any product.
3. **No payment gateway.** Orders are recorded as `pending` / `unpaid`. Card payment, Stripe, PayPal, etc. are not connected.
4. **No stock/inventory tracking.** Products have no quantity field, so two customers can order the same last item.
5. **Refresh tokens are configured but unused.** Only the access token is issued; sessions end after `ACCESS_TOKEN_EXPIRY` (1 day).
6. **No automated tests.** There are no unit, integration, or end-to-end tests.
7. **No rate limiting.** Login and registration can be brute-forced if exposed publicly.
8. **No input validation library.** Validation is handwritten in controllers, which is fine for learning but easy to miss a case.
9. **No email verification or password reset.** Users cannot recover a forgotten password.
10. **No product reviews or ratings.**
11. **No order status management UI.** Admins can view orders but cannot mark them shipped or delivered.
12. **No image optimization.** Original Cloudinary images are served as uploaded.
13. **The Mongo and Postgres backends duplicate logic.** Choose one as the source of truth; the frontend expects Postgres.
14. **`backend/Readme.md` is empty** and the frontend README is the default Vite file. This root README replaces both.
15. **`.env` files are present locally.** They are ignored by Git, but double-check before your first push.
16. **Unused placeholder:** `frontend/src/views/Admin/User.vue` is an old placeholder; the real page is `Users.vue`.

### Recommended quick security fixes

```js
// backend/src/controllers/user.controller.postgres.js
// Ignore any role sent by the browser:
const role = "customer";
```

Then add an admin-only endpoint to change roles:

```sql
UPDATE users SET role = $1 WHERE id = $2;
```

And add `seller_id` to products if you want true multi-seller support.

---

## 🗺️ Roadmap

Ideas for taking the project further:

- [ ] Force `customer` role on public registration
- [ ] Add `seller_id` to products and scope seller queries
- [ ] Add order status updates for admins (`confirmed`, `shipped`, `delivered`)
- [ ] Add stock quantity and prevent overselling
- [ ] Add refresh-token rotation
- [ ] Add Stripe or PayPal checkout
- [ ] Add product reviews and ratings
- [ ] Add wishlist
- [ ] Add email verification and password reset
- [ ] Add rate limiting (`express-rate-limit`) and security headers (`helmet`)
- [ ] Add request validation with Zod or Joi
- [ ] Add automated tests (Vitest + Supertest)
- [ ] Add database migrations (node-pg-migrate, Prisma, or Drizzle)
- [ ] Remove the unused MongoDB implementation
- [ ] Add Docker Compose for one-command setup
- [ ] Add CI with GitHub Actions
- [ ] Add screenshots and a live demo link

---

## 📤 Pushing this project to GitHub

### 1. Check what will be uploaded

From the project root:

```bash
git init
git status
```

Make sure you **do not** see:

- `node_modules/`
- `.env`
- `dist/`
- `frontend/dist/`

If `.env` appears, stop and confirm it is ignored before continuing.

### 2. Make sure `.env` is ignored

Backend `.gitignore` already contains `.env`.

The frontend `.env` contains only `VITE_API_URL`, but it is still good practice to ignore it. This project now does.

If a `.env` was ever committed by mistake, remove it from Git tracking:

```bash
git rm --cached backend/.env
git rm --cached frontend/.env
```

Then rotate any secrets that were exposed.

### 3. Commit

```bash
git add .
git commit -m "Initial commit: full-stack e-commerce app with Vue, Express, and PostgreSQL"
```

### 4. Create a GitHub repository

1. Go to [github.com/new](https://github.com/new).
2. Choose a name, for example `p7-ecommerce-full-stack`.
3. **Do not** initialize it with a README, `.gitignore`, or license (you already have them).
4. Click **Create repository**.

### 5. Connect and push

```bash
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

Replace `YOUR-USERNAME` and `YOUR-REPO` with your real values.

### 6. Repository checklist

- [ ] README shows on the repository home page
- [ ] `.env` is not visible in the file list
- [ ] `node_modules` is not visible
- [ ] `backend/database/schema.sql` is included
- [ ] `backend/.env.example` and `frontend/.env.example` are included
- [ ] Add a short repo description and topics such as `vue`, `express`, `postgresql`, `ecommerce`, `full-stack`
- [ ] Optionally add screenshots to the README

---

## ☁️ Deployment notes

A typical free setup:

| Piece | Suggested service |
|---|---|
| Frontend | Netlify or Vercel |
| Backend | Render, Railway, or Fly.io |
| Database | Neon, Supabase, or Railway PostgreSQL |
| Images | Cloudinary (already integrated) |

### Backend deployment

1. Create a PostgreSQL database and run `database/schema.sql` against it.
2. Set every variable from `backend/.env.example` in the hosting dashboard.
3. Set `CORS_ORIGIN` to your deployed frontend URL, e.g. `https://my-shop.netlify.app`.
4. Set `NODE_ENV=production`.
5. Start command: `node src/server.postgres.js`.

### Frontend deployment

1. Set `VITE_API_URL` to your deployed backend URL, e.g. `https://my-api.onrender.com`.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Redeploy after changing any `VITE_` variable, because Vite bakes them in at build time.

### Cookie warning for cross-site deployments

If the frontend and backend are on **different domains**, the auth cookie needs:

```js
sameSite: "none",
secure: true,
```

Browsers only accept `SameSite=None` cookies over HTTPS. Update `cookieOptions()` in `user.controller.postgres.js` if you deploy this way.

---

## 📄 License and author

**Author:** MUSAB

This repository was built as a full-stack learning and portfolio project. You are free to study and extend it. If you plan to publish it for reuse, add an explicit license file (for example, MIT) so others know what is allowed.

---

### ⭐ If this project helped you learn something

Star the repository, fork it, and build on it. The best way to learn is to break it, fix it, and add one feature at a time.
