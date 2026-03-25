# keepsailing

A daily accountability app built for people who want to stay on course — without the overwhelm of calendars, notifications, and rigid systems. Track what matters, log your time, and keep sailing.

## Tech Stack

- **Next.js** (App Router, TypeScript)
- **Prisma** with `@prisma/adapter-pg` (PostgreSQL driver)
- **Supabase** (PostgreSQL database)
- **Tailwind CSS v4**
- **Framer Motion** for animations
- **Lucide React** for icons

---

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** and fill in the details
3. Wait for the project to finish provisioning (~1 minute)

### 2. Get Your Connection String

In your Supabase dashboard:

1. Go to **Project Settings → Database → Connection string**
2. Select **URI** format and copy the direct connection (port 5432)

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

- **Daily Dashboard** — score, goals, time logged, streaks
- **Goals** — with steps, categories, priority levels, and timers
- **Extra-Curriculars** — habit tracking with 7-day rolling history
- **Chores** — deadline-based tasks on a timeline
- **Focus Timer** — floating timer with atom orbital animation
- **Onboarding** — guided first-run setup
- **6 Themes** — dark, light, purple, orange, amber, charcoal

---

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npx prisma studio  # Open Prisma Studio (DB GUI)
```

---

## Deployment

Vercel recommended:

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add environment variables
4. Deploy
