# Nature's Nest — backend API

A small Express + PostgreSQL API for the Nature's Nest storefront: products and orders.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a PostgreSQL database and copy `.env.example` to `.env`, filling in your `DATABASE_URL`.
3. Load the schema and seed data (matches the products already in the frontend):
   ```bash
   psql "$DATABASE_URL" -f schema.sql
   ```
4. Start the server:
   ```bash
   npm start
   # or, for auto-reload during development:
   npm run dev
   ```

The API runs on `http://localhost:4000` by default (or whatever `PORT` you set in `.env`).

## Endpoints

### Products
| Method | Path | Description |
|---|---|---|
| GET | `/api/products` | List all in-stock products. Add `?category=grains` to filter. |
| GET | `/api/products/:id` | Get one product. |
| POST | `/api/products` | Create a product (admin). |
| PATCH | `/api/products/:id` | Update any product field (admin). |
| DELETE | `/api/products/:id` | Remove a product (admin). |

### Orders
| Method | Path | Description |
|---|---|---|
| POST | `/api/orders` | Create an order from a cart. See body shape below. |
| GET | `/api/orders/:id` | Get one order with its line items. |
| GET | `/api/orders` | List the 100 most recent orders (admin). |
| PATCH | `/api/orders/:id/status` | Update status: `pending`, `paid`, `fulfilled`, `cancelled`. |

**Creating an order:**
```json
POST /api/orders
{
  "customerName": "Ama Owusu",
  "email": "ama@example.com",
  "phone": "0244000000",
  "address": "12 Ring Road, Accra",
  "items": [
    { "productId": "shea", "quantity": 2 },
    { "productId": "suya", "quantity": 1 }
  ]
}
```
Prices are always looked up from the database at order time, never taken from the request, so the total can't be tampered with client-side.

## Payment integration

Checkout currently returns a placeholder `payment.status: "not_processed"` instead of charging anyone. When you're ready to take real payments:
1. Pick a provider (Stripe, Paystack, and Flutterwave are common choices for Ghana-based businesses).
2. In `routes/orders.js`, replace the placeholder block in `POST /api/orders` with a real charge call.
3. Update the order's `status` to `paid` once the charge succeeds (or leave it `pending` if you want to charge only on delivery).

## Connecting the frontend

The existing `natures-nest.html` file has a hardcoded product list and an in-memory cart. To connect it to this API:
- Replace the `products` array with a `fetch('/api/products')` call on page load.
- On checkout, send the cart's `{ productId, quantity }` pairs to `POST /api/orders` instead of showing the placeholder alert.
- Set `ALLOWED_ORIGINS` in `.env` to wherever the frontend is hosted, so the browser's CORS check doesn't block requests.

## Project structure
```
natures-nest-backend/
├── server.js          entry point
├── db.js              PostgreSQL connection pool
├── schema.sql          table definitions + seed data
├── routes/
│   ├── products.js
│   └── orders.js
├── .env.example
└── package.json
```
