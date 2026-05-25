# Fundwise — Crowdfunding Platform
## Complete Setup & Deployment Guide

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Overview](#project-overview)
3. [Required Libraries & Dependencies](#required-libraries)
4. [Environment Configuration](#environment-configuration)
5. [Running Locally (Development)](#running-locally)
6. [Running with Docker (Production)](#running-with-docker)
7. [Portainer Deployment](#portainer-deployment)
8. [Razorpay Configuration](#razorpay-configuration)
9. [Admin Panel Usage](#admin-panel-usage)
10. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

Before starting, ensure the following are installed on your machine:

### For Local Development
| Tool | Version | Download |
|------|---------|---------|
| Node.js | 20.x or higher | https://nodejs.org |
| npm | 10.x or higher | Comes with Node.js |
| PostgreSQL | 15 or 16 | https://postgresql.org/download |
| Git | Any | https://git-scm.com |

### For Docker / Production Deployment
| Tool | Version | Download |
|------|---------|---------|
| Docker | 24.x or higher | https://docs.docker.com/get-docker |
| Docker Compose | 2.x or higher | Included with Docker Desktop |
| Portainer (optional) | CE 2.x | https://docs.portainer.io/start/install-ce |

---

## 2. Project Overview

```
fundwise/
├── .env.example                    ← Environment variable template
├── .gitignore
├── package.json                    ← All npm dependencies
├── tsconfig.json                   ← TypeScript configuration
├── next.config.ts                  ← Next.js config (standalone output)
├── postcss.config.mjs              ← PostCSS / Tailwind CSS v4
├── Dockerfile                      ← Multi-stage production Docker build
├── docker-compose.yml              ← PostgreSQL + App stack
├── SETUP_GUIDE.md                  ← This file
├── prisma/
│   └── schema.prisma               ← Database schema (User, Campaign, Donation)
└── src/
    ├── middleware.ts                ← JWT edge guard for /admin/* routes
    ├── lib/
    │   ├── prisma.ts               ← Singleton Prisma client
    │   ├── auth.ts                 ← JWT sign/verify, session helpers
    │   ├── utils.ts                ← formatCurrency, calcProgress, etc.
    │   └── razorpay.ts             ← Razorpay client singleton
    ├── app/
    │   ├── globals.css             ← Global styles + CSS variables
    │   ├── layout.tsx              ← Root HTML layout
    │   ├── not-found.tsx           ← 404 page
    │   ├── (public)/               ← Public-facing pages (no auth)
    │   │   ├── layout.tsx          ← Navbar + Footer
    │   │   ├── page.tsx            ← Homepage with campaign grid
    │   │   └── campaigns/[id]/     ← Individual campaign + donate widget
    │   ├── admin/                  ← Protected admin dashboard
    │   │   ├── layout.tsx          ← Sidebar layout
    │   │   ├── page.tsx            ← Dashboard with stats
    │   │   ├── login/page.tsx      ← Admin login form
    │   │   └── campaigns/          ← Campaign CRUD pages
    │   └── api/                    ← Backend API routes
    │       ├── auth/login/         ← POST: issues JWT cookie
    │       ├── auth/logout/        ← POST: clears cookie
    │       ├── campaigns/          ← GET: public campaign list
    │       ├── admin/campaigns/    ← Admin CRUD (GET, POST, PATCH, DELETE)
    │       ├── donate/checkout/    ← POST: create Razorpay order
    │       └── donate/webhook/     ← POST: Razorpay webhook handler
    └── components/shared/
        ├── DonateWidget.tsx        ← Razorpay checkout UI
        ├── CampaignForm.tsx        ← Create/Edit campaign form
        ├── CampaignStatusBadge.tsx ← Status pill component
        ├── DeleteCampaignButton.tsx← Confirm + delete button
        └── LogoutButton.tsx        ← Admin sign-out button
```

---

## 3. Required Libraries & Dependencies

All dependencies are defined in `package.json`. Here is what each does:

### Production Dependencies
```json
{
  "next": "^15.0.3",           // Full-stack React framework (App Router)
  "react": "^19.0.0",          // React core
  "react-dom": "^19.0.0",      // React DOM renderer
  "@prisma/client": "^5.22.0", // Auto-generated type-safe database client
  "jose": "^5.9.6",            // JWT sign/verify (works in Edge runtime)
  "razorpay": "^2.9.4",        // Razorpay Node.js SDK (server-side)
  "clsx": "^2.1.1",            // Conditional className helper
  "lucide-react": "^0.460.0",  // SVG icon library
  "tailwind-merge": "^2.5.4"   // Merge Tailwind class strings safely
}
```

### Development Dependencies
```json
{
  "prisma": "^5.22.0",              // Prisma CLI (migrations, schema push)
  "typescript": "^5.6.3",           // TypeScript compiler
  "tailwindcss": "^4.0.0",          // Utility-first CSS framework
  "@tailwindcss/postcss": "^4.0.0", // Tailwind PostCSS plugin (v4)
  "@types/node": "^22.9.1",         // Node.js type definitions
  "@types/react": "^19.0.1",        // React type definitions
  "@types/react-dom": "^19.0.1"     // React DOM type definitions
}
```

### External Script (Browser)
The Razorpay checkout overlay is loaded directly in the browser at runtime:
```
https://checkout.razorpay.com/v1/checkout.js
```
No npm install needed — it loads automatically when a user clicks "Donate".

---

## 4. Environment Configuration

### Step 1 — Copy the template
```bash
cp .env.example .env
```

### Step 2 — Fill in all values

Open `.env` in your editor and set:

```env
# ── Database ──────────────────────────────────────────────────
# For local dev: use your local PostgreSQL credentials
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/fundwise_db?schema=public"

# For Docker: these values must match what's in docker-compose.yml
POSTGRES_USER=crowdfund
POSTGRES_PASSWORD=crowdfund_secret     # ← CHANGE THIS
POSTGRES_DB=crowdfund_db

# ── Admin Login ───────────────────────────────────────────────
# These are the credentials you use to log in at /admin/login
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPasswordHere  # ← CHANGE THIS

# ── JWT Secret ────────────────────────────────────────────────
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=paste_64_char_hex_string_here

# ── App URL ───────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Razorpay ─────────────────────────────────────────────────
# From: https://dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx   # same as KEY_ID
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Generate a secure JWT_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 5. Running Locally (Development)

### Step 1 — Install dependencies
```bash
cd fundwise
npm install
```

### Step 2 — Set up PostgreSQL locally

**Option A — PostgreSQL already installed:**
```bash
# Create database
psql -U postgres -c "CREATE USER crowdfund WITH PASSWORD 'crowdfund_secret';"
psql -U postgres -c "CREATE DATABASE fundwise_db OWNER crowdfund;"
```

**Option B — Use Docker just for the database:**
```bash
docker run -d \
  --name fundwise_postgres \
  -e POSTGRES_USER=crowdfund \
  -e POSTGRES_PASSWORD=crowdfund_secret \
  -e POSTGRES_DB=fundwise_db \
  -p 5432:5432 \
  postgres:16-alpine
```

### Step 3 — Push database schema
```bash
npx prisma db push
```
This creates all tables (users, campaigns, donations) in your PostgreSQL database.

### Step 4 — Start the development server
```bash
npm run dev
```

Open: http://localhost:3000
Admin: http://localhost:3000/admin/login

---

## 6. Running with Docker (Production)

### Step 1 — Ensure Docker is running
```bash
docker --version
docker compose version
```

### Step 2 — Create your .env file
```bash
cp .env.example .env
# Edit .env with production values (real passwords, production Razorpay keys, etc.)
```

### Step 3 — Build and start
```bash
docker compose up --build -d
```

This command:
- Builds the Next.js app in a multi-stage Docker image
- Starts a PostgreSQL 16 container
- Waits for PostgreSQL to be healthy
- Runs `prisma db push` automatically
- Starts the Next.js production server on port 3000

### Step 4 — Verify containers are running
```bash
docker compose ps
docker compose logs -f app      # watch app logs
docker compose logs -f postgres # watch database logs
```

### Step 5 — Stop / restart
```bash
docker compose down             # stop (keeps data)
docker compose down -v          # stop and DELETE all data
docker compose restart app      # restart only the app
```

### Updating after code changes
```bash
docker compose up --build -d
```

---

## 7. Portainer Deployment

Portainer lets you manage Docker stacks via a web UI.

### Step 1 — Log in to Portainer
Navigate to: `http://your-server-ip:9000`

### Step 2 — Create a new Stack
1. Click **Stacks** in the left sidebar
2. Click **+ Add stack**
3. Give it a name: `fundwise`

### Step 3 — Paste docker-compose.yml
In the **Web editor** tab, paste the entire contents of `docker-compose.yml`.

### Step 4 — Add environment variables
Scroll down to **Environment variables** and add each variable:

| Name | Value |
|------|-------|
| `POSTGRES_USER` | `crowdfund` |
| `POSTGRES_PASSWORD` | `your_strong_password` |
| `POSTGRES_DB` | `crowdfund_db` |
| `JWT_SECRET` | `your_64_char_hex_secret` |
| `ADMIN_EMAIL` | `admin@yourdomain.com` |
| `ADMIN_PASSWORD` | `your_admin_password` |
| `RAZORPAY_KEY_ID` | `rzp_live_xxxx` |
| `RAZORPAY_KEY_SECRET` | `your_secret` |
| `RAZORPAY_WEBHOOK_SECRET` | `your_webhook_secret` |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |

### Step 5 — Deploy
Click **Deploy the stack**. Watch the logs to confirm `✅ Database schema synced`.

---

## 8. Razorpay Configuration

### Get API Keys
1. Sign up / log in at https://dashboard.razorpay.com
2. Go to **Settings → API Keys**
3. Click **Generate Key** (Test Mode for dev, Live Mode for production)
4. Copy `Key ID` → `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
5. Copy `Key Secret` → `RAZORPAY_KEY_SECRET`

### Set Up Webhook
1. Go to **Settings → Webhooks → Add New Webhook**
2. **Webhook URL**: `https://yourdomain.com/api/donate/webhook`
   - For local testing, use ngrok: `ngrok http 3000` → use the HTTPS URL
3. **Secret**: generate a random string, paste into `RAZORPAY_WEBHOOK_SECRET`
4. **Active Events**: check both:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
5. Click **Create Webhook**

### Test Payments (Test Mode)
Use Razorpay test card details:
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits
- UPI: `success@razorpay`

---

## 9. Admin Panel Usage

### Login
Navigate to `/admin/login` and enter the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.

### Dashboard
- View total raised, total donations, active campaigns
- See recent donations and top campaigns by amount raised

### Creating a Campaign
1. Go to **Campaigns → New Campaign**
2. Fill in title, description, target amount (₹), optional image URL, and status
3. Click **Create Campaign** — it appears instantly on the public homepage

### Editing a Campaign
1. Go to **Campaigns** → click the pencil icon
2. Change status to `PAUSED` to stop accepting donations
3. Change status to `COMPLETED` when the goal is met

### Deleting a Campaign
Click the trash icon → confirm the prompt. This also deletes all donation records for that campaign.

---

## 10. Troubleshooting

### `prisma db push` fails
```bash
# Ensure DATABASE_URL is correct in .env
# Check PostgreSQL is running:
docker compose ps postgres

# Check logs:
docker compose logs postgres
```

### Port 3000 already in use
```bash
# Find what's using it:
lsof -i :3000
# Kill it:
kill -9 <PID>
```

### Admin login not working
- Double-check `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`
- Ensure `JWT_SECRET` is set (any non-empty string works for dev)
- Clear browser cookies and try again

### Razorpay webhook not firing
- Ensure the webhook URL uses HTTPS (Razorpay requires it in production)
- For local dev, use ngrok: `ngrok http 3000`
- Check `RAZORPAY_WEBHOOK_SECRET` matches exactly what's in the Razorpay dashboard

### Docker build fails with Prisma error
```bash
# Ensure schema.prisma is present in the prisma/ folder
# Force a clean rebuild:
docker compose down
docker compose build --no-cache
docker compose up -d
```

### `Module not found` errors after npm install
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Available npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server (after build) |
| `npm run lint` | Run ESLint |
| `npx prisma db push` | Sync schema to database (no migration files) |
| `npx prisma studio` | Open visual database browser at :5555 |
| `npx prisma generate` | Regenerate Prisma Client after schema changes |

---

## Security Checklist Before Going Live

- [ ] Change `ADMIN_PASSWORD` to a strong unique password
- [ ] Generate a new `JWT_SECRET` (64 hex chars minimum)
- [ ] Switch Razorpay to **Live Mode** keys
- [ ] Set `NEXT_PUBLIC_APP_URL` to your real domain
- [ ] Configure HTTPS (via Nginx/Caddy reverse proxy or Cloudflare)
- [ ] Set `POSTGRES_PASSWORD` to a strong unique password
- [ ] Never commit `.env` to version control

---

*Built with Next.js 15, Prisma 5, PostgreSQL 16, Razorpay, Tailwind CSS v4, and Docker.*
