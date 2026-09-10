# 🏓 PinoyPicklers by Giftists

A full-stack pickleball tournament & queue management app built with **Next.js 14**, **React**, **TypeScript**, **Prisma**, and **SQLite via Turso**.
 
---

## ✨ Features

- 🏆 **Tournament Management** — Round robin format, auto-generated schedules, match recording
- 🏟️ **Queue Play** — Paddle stacking with 3 rotation modes (4-in-4-out, Winners Stay, Split Queue)
- 👥 **Multi-user** — Admin, Player, and Spectator roles
- 📊 **All-time Stats** — Per-player win/loss records across all tournaments
- 🔐 **Authentication** — Email/password login via NextAuth.js
- 📱 **Mobile-first** — PWA-ready, Add to Home Screen on iPhone/Android

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/pinoypicklers.git
cd pinoypicklers
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="any-random-secret-string-here"
```

Generate a secret:
```bash
openssl rand -base64 32
```

### 3. Set Up Database

```bash
npm run db:push    # Create tables
npm run db:seed    # Add sample data
```

### 4. Run

```bash
npm run dev
```

Open **http://localhost:3000**

**Default admin login:**
- Email: `admin@pinoypicklers.com`
- Password: `admin123`

---

## 🌐 Deploy to Vercel

### Step 1 — Set Up Turso (SQLite in the cloud)

SQLite files don't persist on Vercel's filesystem. Use [Turso](https://turso.tech) — it's free and SQLite-compatible.

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create a database
turso db create pinoypicklers

# Get your connection URL
turso db show pinoypicklers --url
# → libsql://pinoypicklers-yourname.turso.io

# Get auth token
turso db tokens create pinoypicklers
# → eyJ...
```

### Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/pinoypicklers.git
git push -u origin main
```

### Step 3 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Add these **Environment Variables**:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `libsql://pinoypicklers-yourname.turso.io` |
| `DATABASE_AUTH_TOKEN` | `eyJ...` (from turso) |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Your generated secret |

4. Click **Deploy**

### Step 4 — Initialize Production Database

After first deploy, run migrations via Vercel CLI or locally with Turso credentials:

```bash
# Set env vars locally
export DATABASE_URL="libsql://pinoypicklers-yourname.turso.io"
export DATABASE_AUTH_TOKEN="eyJ..."

# Push schema
npx prisma db push

# Seed initial admin user
npm run db:seed
```

---

## 👥 User Roles

| Role | Permissions |
|------|------------|
| 👑 **Admin** | Create/manage tournaments, record matches, manage users & players |
| 🏓 **Player** | View stats, see tournaments, use queue play |
| 👁️ **Spectator** | View-only — standings, matches, leaderboard |

To make someone an admin:
1. Log in as admin
2. Go to **Admin Panel** → find the user → **Change Role** → Admin

---

## 🏟️ Queue Rotation Modes

| Mode | Description |
|------|-------------|
| 🔄 **4 In, 4 Out** | All 4 players rotate out after every game |
| 🏆 **Winners Stay** | Winning pair stays up to 2 consecutive wins |
| 🏅 **Split Queue** | Winners/losers go to separate queues, no repeat partners |

**Odd number handling:** If fewer than 4 players are available, waiting players get a 🔄 Bye and are priority-queued for the next game.

---

## 🏆 Tournament Format

- **Round Robin** — every team plays every other team exactly once
- Points: Win = 2 pts, Loss = 1 pt
- Rankings by: Points → Wins → Losses
- Add teams → matches auto-generated → record results → view live standings

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite via Prisma + Turso |
| Auth | NextAuth.js v5 |
| Styling | Tailwind CSS |
| UI | Custom components |
| Deployment | Vercel |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth + register
│   │   ├── tournaments/  # CRUD + teams + matches
│   │   ├── players/      # Player management
│   │   └── admin/        # Admin user management
│   ├── auth/             # Login & register pages
│   ├── dashboard/        # Main app pages
│   │   ├── page.tsx      # Home dashboard
│   │   ├── queue/        # Queue play
│   │   ├── tournaments/  # Tournament list + detail
│   │   └── players/      # All-time leaderboard
│   └── admin/            # Admin panel
├── components/
│   ├── tournament/       # Tournament UI components
│   ├── queue/            # Queue app component
│   └── ui/               # Shared UI components
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # DB client
│   ├── queue.ts          # Queue logic utilities
│   └── utils.ts          # Helpers
└── middleware.ts          # Route protection
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Seed data
```

---

## 🔒 Changing Admin Password

After first login, go to your profile or use Prisma Studio:

```bash
npm run db:studio
```

Open the **User** table → find the admin → update password (must be bcrypt-hashed).

Or add a profile page and implement password change via API.

---

## 📱 Add to Home Screen (iPhone)

1. Open your Vercel URL in **Safari**
2. Tap **Share ↑**
3. Tap **Add to Home Screen**
4. Done — runs like a native app 🏓

---

## 🆘 Troubleshooting

**"PrismaClientInitializationError"** — Check your `DATABASE_URL` env var is set correctly.

**"NEXTAUTH_SECRET missing"** — Make sure `NEXTAUTH_SECRET` is set in Vercel env vars.

**Vercel build fails** — Run `npm run build` locally first to catch TypeScript errors.

**Turso connection issues** — Make sure `DATABASE_AUTH_TOKEN` is correct and not expired.
