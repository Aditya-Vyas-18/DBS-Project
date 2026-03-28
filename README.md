# Electronic Marketplace Management System

Full-stack demo: **React (Vite)** frontend, **Node.js (Express)** API, and **MySQL** for hierarchical categories, listings, private demand **alerts**, and **notifications** when new listings match subscriber constraints.

## Features

- **Users**: register, log in (JWT), list items, browse catalog.
- **Hierarchical categories**: parent/child in MySQL; API returns a nested tree; listing filter applies to a category **and all descendants**.
- **Private alerts**: users define watches on a category with optional min/max price and keyword (not shown as public “wanted” posts).
- **Notifications**: when an **active** item is created, the server evaluates all active alerts (excluding the seller’s own subscriptions), matches category ancestry + constraints, and inserts `notifications` rows.

## Prerequisites

- Node.js 18+
- MySQL 8+ (or compatible) with a user that can create databases

## Database setup

1. Copy `server/.env.example` to `server/.env` and set `MYSQL_PASSWORD` (and other fields if needed).

2. From the `server` folder:

```bash
npm install
npm run db:init
```

This applies `server/db/schema.sql`, seeds categories, and creates demo users:

- `alice@demo.local` / `demo123`
- `bob@demo.local` / `demo123`

Re-running `db:init` is safe for categories and demo users (`INSERT IGNORE`). If you need a clean slate, drop the `marketplace` database in MySQL and run `db:init` again.

## Run the API

From `server/`:

```bash
npm run dev
```

API default: `http://localhost:4000` (see `PORT` in `.env`).

## Run the React app

From `client/`:

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The dev server proxies `/api` to the backend.

## Try the alert flow

1. Log in as **Bob** → **My alerts** → add an alert on **Electronics** (or a child) with optional price/keyword.
2. Log in as **Alice** → **Sell** → publish an item in a matching subcategory with a matching price/keyword.
3. Log back in as **Bob** → **Notifications** to see the match.

## Project layout

- `server/` — Express API (`/api/auth`, `/api/categories`, `/api/items`, `/api/alerts`, `/api/notifications`)
- `client/` — React SPA with React Router
- `server/db/schema.sql` — tables: `users`, `categories`, `items`, `alerts`, `notifications`

## Production notes

- Set a strong `JWT_SECRET` in `.env`.
- Serve the built client (`npm run build` in `client/`) from a static host or the same origin as the API; adjust CORS and API base URL as needed.
