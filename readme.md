# Subscription Management Dashboard

A production-grade full-stack SaaS admin dashboard for subscription lifecycle management — built with React 19, Express, MongoDB, and Stripe.

> **Assessment submission** for GNXTACE Technologies – Full Stack Web Developer role.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup & Run](#setup--run)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Known Integrations & Notes](#known-integrations--notes)
- [Deployment](#deployment)
- [Author](#author)

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 22+ | Runtime |
| Express.js | ^4.21 | HTTP server, routing |
| TypeScript | ^5.8 (strict) | Type safety |
| MongoDB Atlas | — | Cloud database |
| Mongoose | ^8.15 | ODM, schemas, TTL indexes |
| Zod | ^3.25 | Runtime validation + env schema |
| jose | ^5.10 | JWT signing/verification (HS256) |
| bcryptjs | ^3.0 | Password hashing (cost 12) |
| node-cron | ^3.0 | Subscription expiry scheduler |
| Stripe SDK | ^18.1 | Payment processing (test mode) |
| Resend | ^4.5 | Transactional email |
| express-rate-limit | ^7.5 | Rate limiting |
| helmet | ^8.0 | Security headers |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | ^19.2 | UI library |
| Vite | ^8.0 | Build tool + dev server |
| TypeScript | ~6.0 (strict) | Type safety |
| TailwindCSS | ^3.4 | Utility-first styling |
| Zustand | ^5.0 | Client state (auth, theme, toasts) |
| TanStack Query | ^5.75 | Server state, caching, mutations |
| React Hook Form | ^7.56 | Form management |
| Zod | ^3.25 | Form schema validation |
| Framer Motion | ^12.11 | Animations and transitions |
| Recharts | ^2.15 | Analytics charts |
| React Router | ^7.6 | Client-side routing |
| Radix UI | — | Accessible headless UI primitives |
| Axios | ^1.9 | HTTP client with interceptors |
| lucide-react | ^0.511 | Icon library |
| date-fns | ^4.1 | Date formatting utilities |

---

## Features

### User Features
- **Auth** — Register/login with JWT access + refresh token rotation; httpOnly cookie for refresh token; memory-only access token
- **Public Pricing** — Browse all plans without signing in
- **Subscribe** — Pick a plan, apply coupon codes, activate subscription
- **Dashboard** — Live view of active plan, features included, status badge, days remaining
- **Upgrade / Downgrade** — Switch plans with real-time proration preview modal (credit applied to new plan duration)
- **Auto-Renew Toggle** — Enable or disable automatic renewal per subscription
- **Cancel Subscription** — Cancel with confirmation dialog
- **Billing History** — Full event timeline: activations, upgrades, downgrades, cancellations
- **Profile** — Update name/email; manage in-app notification preferences
- **Notification Center** — In-app bell with unread count; mark read/read-all
- **Dark / Light / System Theme** — Persisted to localStorage, syncs with OS preference

### Admin Features
- **Analytics Command Center** — MRR, total active subscribers, churn rate, month-over-month growth
- **Charts** — Bar chart (daily signups, last 30 days) + donut chart (plan distribution)
- **Real-Time Activity Feed** — Latest subscription events
- **Subscriptions Table** — Search, filter by status, paginated; CSV export
- **User Management** — Paginated users list; activate/deactivate accounts; manually assign plans
- **Coupon Management** — Create time-limited, usage-capped discount codes; view all coupons

### Backend Architecture
- Clean layered architecture: `routes → controllers → services → models`
- Subscription state machine: `pending → active → grace_period → expired / cancelled`
- Proration service — pure calculation, no side effects, credit-based upgrade/downgrade
- Refresh token hashed with SHA-256 before storage; token-family reuse detection (revoke entire family on theft)
- Audit log collection with 90-day auto-purge (MongoDB TTL index)
- node-cron jobs: midnight subscription expiry, 6-hour grace period check, daily 9 AM expiry warnings
- Rate limiting: 10 req/min on auth routes, 100 req/min global
- Structured error responses via `AppError` hierarchy
- Role-based access control middleware: `admin`, `user`
- Feature-flag middleware: `requireFeature` enforces plan-tier gating

---

## Project Structure

```
subscription-dashboard-task/
├── server/                         # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts         # MongoDB connection + reconnect logic
│   │   │   └── env.ts              # Zod env schema validation
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── plan.controller.ts
│   │   │   ├── subscription.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── admin.controller.ts
│   │   │   └── webhook.controller.ts
│   │   ├── middleware/
│   │   │   ├── authenticate.ts     # JWT access token guard
│   │   │   ├── authorize.ts        # Role-based access
│   │   │   └── requireFeature.ts   # Plan feature flag enforcement
│   │   ├── models/
│   │   │   ├── User.model.ts
│   │   │   ├── Plan.model.ts
│   │   │   ├── Subscription.model.ts
│   │   │   ├── Coupon.model.ts
│   │   │   ├── Notification.model.ts
│   │   │   ├── RefreshToken.model.ts   # Hashed, TTL-indexed
│   │   │   └── AuditLog.model.ts       # 90-day TTL auto-purge
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── plan.routes.ts
│   │   │   ├── subscription.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   └── webhook.routes.ts   # Raw body for Stripe signature
│   │   ├── services/
│   │   │   ├── jwt.service.ts
│   │   │   ├── stripe.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── proration.service.ts
│   │   ├── jobs/
│   │   │   └── scheduler.ts        # node-cron job definitions
│   │   ├── errors/
│   │   │   └── AppError.ts
│   │   └── utils/
│   │       ├── apiResponse.ts
│   │       ├── auditLog.ts
│   │       └── notification.ts
│   ├── seed/
│   │   └── index.ts                # Seeds 4 plans + admin user
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── client/                         # React 19 + Vite frontend
    └── src/
        ├── features/
        │   ├── auth/               # Login/register forms + API
        │   ├── subscription/       # Subscribe + proration modal
        │   ├── profile/            # Profile form + notifications
        │   ├── notifications/      # Bell, panel, hooks
        │   └── admin/              # Tables, analytics, hooks
        ├── pages/
        │   ├── auth/               # LoginPage, RegisterPage
        │   ├── user/               # DashboardPage, PlansPage, BillingPage, ProfilePage
        │   ├── admin/              # AnalyticsPage, SubscriptionsAdminPage, UsersAdminPage
        │   └── errors/             # NotFoundPage, UnauthorizedPage
        ├── shared/
        │   ├── store/              # Zustand: authStore, themeStore, notificationStore
        │   ├── lib/                # axios instance, queryClient, silentRefresh, tokenTimer
        │   ├── hooks/              # useAuthInit
        │   └── components/
        │       ├── layout/         # AppShell, Navbar, Sidebar, RootLayout
        │       └── common/         # StatusBadge, StatCard, Pagination, Toaster...
        └── router/
            ├── index.tsx           # Route definitions with lazy loading
            └── guards/             # AuthGuard, GuestGuard, RoleGuard
```

---

## Setup & Run

### Prerequisites

- Node.js 18+
- npm
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
cp .env.example .env
```

Fill in `server/.env` (see [Environment Variables](#environment-variables) below).

**Seed the database** — creates 4 plans and an admin account:

```bash
npm run seed
```

Default seeded admin credentials:
- Email: `admin@example.com`
- Password: `Admin@123456`

> Change these in your `.env` before any shared/public deployment.

**Start the dev server:**

```bash
npm run dev
```

Server runs at `http://localhost:5000`

**Stripe webhooks (local testing):**

```bash
# Requires Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:5000/api/v1/webhooks/stripe
# Copy the printed whsec_... value into STRIPE_WEBHOOK_SECRET in .env
```

---

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

The Vite dev server proxies all `/api/*` requests to `http://localhost:5000` — no CORS configuration needed during development.

---

### 4. Open in Browser

**User routes:**

| URL | Description |
|---|---|
| `/pricing` | Public pricing page (no login required) |
| `/register` | Create an account |
| `/login` | Sign in |
| `/dashboard` | Active subscription overview |
| `/plans` | Browse and subscribe to plans |
| `/billing` | Billing history and events |
| `/profile` | Profile settings and notifications |

**Admin routes** (login as `admin@example.com`):

| URL | Description |
|---|---|
| `/admin/analytics` | Analytics command center |
| `/admin/subscriptions` | All subscriptions management |
| `/admin/users` | User management |

---

## Environment Variables

Copy `server/.env.example` to `server/.env` and fill in:

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | `development` or `production` | Yes |
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `JWT_ACCESS_SECRET` | Random string, 32+ characters | Yes |
| `JWT_REFRESH_SECRET` | Random string, 32+ characters (different from above) | Yes |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (e.g., `15m`) | Yes |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g., `7d`) | Yes |
| `CLIENT_URL` | Frontend origin for CORS (e.g., `http://localhost:5173`) | Yes |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys (`sk_test_...`) | Yes |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` output (`whsec_...`) | Yes |
| `RESEND_API_KEY` | Resend Dashboard → API Keys (`re_...`) | Yes |
| `EMAIL_FROM` | Sender address (e.g., `onboarding@resend.dev`) | Yes |
| `ADMIN_EMAIL` | Email for seeded admin account | No |
| `ADMIN_PASSWORD` | Password for seeded admin account | No |

> Generate secure JWT secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## API Reference

### Auth — `POST /api/v1/auth/*`

```
POST  /api/v1/auth/register     # Create account
POST  /api/v1/auth/login        # Authenticate, receive tokens
POST  /api/v1/auth/refresh      # Rotate refresh token
POST  /api/v1/auth/logout       # Revoke session
```

### Plans — `GET /api/v1/plans/*`

```
GET   /api/v1/plans             # List all active plans
GET   /api/v1/plans/:slug       # Get plan by slug
```

### Subscriptions — `/api/v1/subscriptions/*` *(auth required)*

```
POST  /api/v1/subscriptions/:planId                    # Subscribe to plan
GET   /api/v1/subscriptions/me                         # Active subscription
GET   /api/v1/subscriptions/me/history                 # Billing event history
GET   /api/v1/subscriptions/proration-preview/:planId  # Preview upgrade/downgrade credit
PATCH /api/v1/subscriptions/switch/:newPlanId          # Switch plan
PATCH /api/v1/subscriptions/cancel                     # Cancel subscription
PATCH /api/v1/subscriptions/auto-renew                 # Toggle auto-renewal
```

### User — `/api/v1/user/*` *(auth required)*

```
GET   /api/v1/user/profile                      # Get profile
PATCH /api/v1/user/profile                      # Update profile
GET   /api/v1/user/notifications                # In-app notifications
PATCH /api/v1/user/notifications/:id/read       # Mark single as read
PATCH /api/v1/user/notifications/read-all       # Mark all as read
```

### Admin — `/api/v1/admin/*` *(auth + admin role)*

```
GET   /api/v1/admin/analytics                   # MRR, churn, growth metrics
GET   /api/v1/admin/subscriptions               # All subscriptions (filterable, paginated)
GET   /api/v1/admin/subscriptions/export        # CSV download
GET   /api/v1/admin/users                       # All users (paginated)
PATCH /api/v1/admin/users/:id/toggle-active     # Activate / deactivate user
POST  /api/v1/admin/subscriptions/assign        # Manually assign plan
POST  /api/v1/admin/coupons                     # Create coupon
GET   /api/v1/admin/coupons                     # List coupons
```

### Other

```
POST  /api/v1/webhooks/stripe   # Stripe webhook handler (raw body)
GET   /health                   # Server health check
```

---

## Known Integrations & Notes

### Stripe — Test Mode Only

Stripe is integrated in test mode for payment simulation. Webhook events (payment success, failure) update subscription status automatically. For local testing, use the Stripe CLI to forward webhooks.

For production deployment, register your live domain in the Stripe Dashboard under **Developers → Webhooks → Add endpoint** and update `STRIPE_WEBHOOK_SECRET` accordingly.

### Resend Email — Domain Not Yet Verified

Transactional emails (welcome, expiry warnings, grace period alerts) are integrated via Resend. Currently using the default `onboarding@resend.dev` sender address, which is limited to delivering only to the Resend account owner's email until a custom domain is verified.

To enable full email delivery:
1. Add and verify your domain in [Resend Dashboard → Domains](https://resend.com/domains)
2. Update `EMAIL_FROM` in `.env` to your verified domain address (e.g., `noreply@yourdomain.com`)

All email templates and triggers are fully implemented — only the sender domain verification is pending.

### Scheduled Jobs (node-cron)

| Schedule | Job |
|---|---|
| Midnight daily (`0 0 * * *`) | Expire active subscriptions past `endDate` |
| Every 6 hours (`0 */6 * * *`) | Expire grace-period subscriptions past `gracePeriodEndsAt`; send email |
| 9 AM daily (`0 9 * * *`) | Send expiry warning for subscriptions expiring in 2–3 days |

---

## Deployment

### Backend → Railway

1. Push to GitHub
2. New project on [Railway](https://railway.app) → connect repo → set root to `server/`
3. Add all environment variables from `server/.env`
4. Set `NODE_ENV=production`
5. Deploy — Railway auto-detects `npm run start`

### Frontend → Vercel

1. New project on [Vercel](https://vercel.com) → connect repo → set root to `client/`
2. Add environment variable: `VITE_API_URL=https://your-railway-backend.up.railway.app`
3. Update `CLIENT_URL` in Railway env to your Vercel frontend URL (for CORS)
4. Deploy

---

## Author

**Hari**  
Email: hari807849@gmail.com  
GitHub: https://github.com/YOUR_USERNAME
