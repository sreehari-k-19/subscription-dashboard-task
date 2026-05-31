# Subscription Management Dashboard

A full-stack SaaS admin dashboard for subscription management — built with React, Fastify, MongoDB, and Stripe.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js 22 + Fastify 5 | HTTP server, schema validation |
| TypeScript 5 (strict) | Type safety |
| MongoDB Atlas + Mongoose 8 | Database + ODM |
| Zod | Runtime validation + env schema |
| jose (JWT) | Access + refresh token auth |
| bcryptjs | Password hashing (cost 12) |
| node-cron | Subscription expiry jobs |
| Resend | Transactional email |
| Stripe SDK | Payment processing (test mode) |

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite 6 | UI framework + build tool |
| TypeScript 5 (strict) | Type safety |
| TailwindCSS 3 | Utility-first styling |
| Zustand 5 | Client state (auth, theme) |
| TanStack Query 5 | Server state, caching, mutations |
| React Hook Form + Zod | Form management + validation |
| Framer Motion 12 | Animations + transitions |
| Recharts 2 | Analytics charts |
| React Router v7 | Client-side routing |

---

## Features

### User
- Register / login with JWT auth (access + refresh token rotation)
- Browse plans on public `/pricing` page
- Subscribe to a plan with optional coupon code
- Dashboard showing active plan, features, status badge
- Upgrade or downgrade plans with **proration preview** (credit calculation)
- Toggle auto-renew on/off
- Cancel subscription with confirmation
- Billing history with full event timeline
- Profile management + in-app notification center
- Dark / light / system theme toggle

### Admin
- Analytics command center: MRR, active subscribers, churn rate, MoM growth
- Bar chart (sign-ups last 30 days) + donut chart (plan distribution)
- Real-time activity feed
- All subscriptions table with search, status filter, pagination
- CSV export of all subscriptions
- Users table with activate / deactivate controls
- Manually assign plans to users
- Create and manage coupon codes

### Backend Architecture
- Clean separation: routes → controllers → services → models
- Subscription state machine: `pending → active → grace_period → expired/cancelled`
- Proration service (pure calculation, tier-based upgrade/downgrade)
- Refresh token stored as SHA-256 hash in MongoDB (TTL index auto-cleans)
- Audit log collection (TTL 90 days, auto-purge)
- node-cron: midnight expiry job + 6-hour grace period check
- Rate limiting: 10 req/min on auth, 100 req/min global

---

## Project Structure

```
subscription-dashboard/
├── server/                 # Fastify + Node.js backend
│   ├── src/
│   │   ├── config/         # env validation, DB connection
│   │   ├── models/         # Mongoose models
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # JWT, proration logic
│   │   ├── middleware/     # authenticate, authorize, requireFeature
│   │   ├── routes/         # Route definitions
│   │   ├── jobs/           # node-cron scheduler
│   │   ├── utils/          # apiResponse, auditLog, notification
│   │   └── errors/         # AppError hierarchy
│   ├── seed/               # Database seeding script
│   └── .env.example
└── client/                 # React frontend
    └── src/
        ├── features/       # Feature-based modules (auth, subscription, admin...)
        ├── pages/          # Route-level page components
        ├── shared/         # Types, stores, lib, components
        └── router/         # Routes + guards
```

---

## Setup & Run

### Prerequisites
- Node.js 18+
- npm or pnpm
- MongoDB Atlas account (free tier works)
- Stripe account (test mode)
- Resend account (free tier)

---

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/subscription-dashboard-task.git
cd subscription-dashboard-task
```

---

### 2. Backend Setup

```bash
cd server
npm install
```

Copy and fill in environment variables:

```bash
cp .env.example .env
```

Required variables in `server/.env`:

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers |
| `JWT_ACCESS_SECRET` | Any random 32+ char string |
| `JWT_REFRESH_SECRET` | Any random 32+ char string (different) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Run `stripe listen` (see below) |
| `RESEND_API_KEY` | Resend Dashboard → API Keys |

**Seed the database** (creates 4 plans + admin user):

```bash
npm run seed
```

Seeded admin credentials (from `.env`):
- Email: `admin@example.com`
- Password: `Admin@123456`

**Start the server:**

```bash
npm run dev
```

Server runs on `http://localhost:5000`

**Stripe webhook (local testing):**

```bash
# Install Stripe CLI first: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe
# Copy the webhook secret printed and set STRIPE_WEBHOOK_SECRET in .env
```

---

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

The Vite dev server proxies `/api/*` to `http://localhost:5000` — no CORS config needed in development.

---

### 4. Open in browser

| URL | Description |
|---|---|
| `http://localhost:5173/pricing` | Public pricing page |
| `http://localhost:5173/register` | Create an account |
| `http://localhost:5173/login` | Sign in |
| `http://localhost:5173/dashboard` | User dashboard |
| `http://localhost:5173/plans` | Browse + subscribe |
| `http://localhost:5173/billing` | Billing history |

Admin routes (login as `admin@example.com`):

| URL | Description |
|---|---|
| `http://localhost:5173/admin/analytics` | Command center |
| `http://localhost:5173/admin/subscriptions` | All subscriptions |
| `http://localhost:5173/admin/users` | User management |

---

## API Reference

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/plans
GET    /api/v1/plans/:slug

POST   /api/v1/subscriptions/:planId
GET    /api/v1/subscriptions/me
GET    /api/v1/subscriptions/me/history
GET    /api/v1/subscriptions/proration-preview/:newPlanId
PATCH  /api/v1/subscriptions/switch/:newPlanId
PATCH  /api/v1/subscriptions/cancel
PATCH  /api/v1/subscriptions/auto-renew

GET    /api/v1/user/profile
PATCH  /api/v1/user/profile
GET    /api/v1/user/notifications
PATCH  /api/v1/user/notifications/:id/read
PATCH  /api/v1/user/notifications/read-all

GET    /api/v1/admin/analytics
GET    /api/v1/admin/subscriptions
GET    /api/v1/admin/subscriptions/export
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:id/toggle-active
POST   /api/v1/admin/subscriptions/assign
POST   /api/v1/admin/coupons
GET    /api/v1/admin/coupons

GET    /health
```

---

## Deployment

### Backend → Railway

1. Push to GitHub
2. New project on [Railway](https://railway.app)
3. Connect GitHub repo → select `server/` as root
4. Add environment variables from `server/.env`
5. Deploy

### Frontend → Vercel

1. New project on [Vercel](https://vercel.com)
2. Connect GitHub repo → select `client/` as root
3. Set `VITE_API_URL` to your Railway backend URL
4. Update `CLIENT_URL` in Railway env to your Vercel frontend URL
5. Deploy

---

## Author

**Your Name**  
Email: your@email.com  
GitHub: https://github.com/YOUR_USERNAME
