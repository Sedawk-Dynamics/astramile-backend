# AstraMile — Admin Panel API

Node + Express + TypeScript + Prisma + PostgreSQL backend that powers the AstraMile admin panel.

Manages: rockets, missions, crew, launches, news, gallery, technology, about page, homepage stats, and the contact-form inbox.

---

## 1. Prerequisites

- **Node.js** 18+ (20 recommended)
- **PostgreSQL** 14+ running locally (or any reachable Postgres URL)

Create a database for the project, e.g.:

```sql
CREATE DATABASE astramile;
```

> If your password contains special characters (`@`, `:`, `/`, `?`, `#`, `%`), URL-encode them. `Prince@1902` becomes `Prince%401902`:
> ```
> DATABASE_URL="postgresql://postgres:Prince%401902@localhost:5432/astramile?schema=public"
> ```

## 2. Install

```bash
cd backend
npm install
```

## 3. Configure

Copy `.env.example` to `.env` and edit as needed.

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/astramile?schema=public"
PORT=4000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET="change-me"
JWT_EXPIRES_IN=7d

# Seed admin (used ONCE on first run; change the password after first login)
SEED_ADMIN_EMAIL=admin@astramile.local
SEED_ADMIN_PASSWORD=ChangeMe123!
SEED_ADMIN_NAME="AstraMile Admin"
```

## 4. Development

```bash
npm run prisma:migrate     # creates tables
npm run seed               # populates demo content + admin
npm run dev                # http://localhost:4000
```

Health check: `GET /health` → `{ ok: true }`

Prisma Studio: `npm run prisma:studio`

## 5. Production

```bash
npm install --omit=dev
npm run build              # compiles TS → dist/
npm run prisma:deploy      # applies migrations (non-interactive)
npm run seed:prod          # one-time seed (see below)
npm start                  # serves from dist/src/server.js
```

Or all-in-one:

```bash
npm run deploy             # prisma migrate deploy && seed:prod && start
```

---

## Seeding behaviour

The seed (`prisma/seed.ts`) is **one-time by design** and safe to run repeatedly in production:

- **Admin user** — always upserted, so re-running can restore a lost admin account. The password is only overwritten when `SEED_ADMIN_PASSWORD` is explicitly set in the environment.
- **Demo catalog** (rockets, missions, crew, launches, news, gallery, technology, stats, about) — seeded **only on first run**. The guard is "does the seeded admin email already exist?". After the first successful seed, subsequent runs log `demo content already seeded; skipping.` and leave existing rows alone, so your admin-panel edits are never overwritten.
- **Force re-seed** — set `SEED_FORCE=true` to upsert the demo rows over the existing ones. This is only needed if you want to restore demo data after clearing the DB.

Production workflow:

```bash
# First deploy
npm run prisma:deploy
npm run seed:prod          # seeds everything

# Every subsequent deploy
npm run prisma:deploy
npm run seed:prod          # no-op — "already seeded; skipping."
```

Safe to put `seed:prod` in your release pipeline.

---

## API surface

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | /api/auth/login | no | returns `{ token, user }` |
| GET | /api/auth/me | yes | |
| POST | /api/auth/change-password | yes | |
| POST | /api/upload/image | yes | `multipart/form-data`, field `file` — stored in `backend/uploads/` |
| GET | /api/dashboard/summary | yes | counts + upcoming launches |
| GET, POST, PATCH, DELETE | /api/rockets | mixed | GET public, writes auth |
| GET, POST, PATCH, DELETE | /api/missions | mixed | |
| GET, POST, PATCH, DELETE | /api/crew | mixed | "Our Team" members |
| GET, POST, PATCH, DELETE | /api/launches | mixed | |
| GET, POST, PATCH, DELETE | /api/news | mixed | |
| GET, POST, PATCH, DELETE | /api/blog | mixed | Articles + YouTube/Vimeo/video URL |
| GET, POST, PATCH, DELETE | /api/gallery | mixed | |
| GET, POST, PATCH, DELETE | /api/technology | mixed | |
| GET, PUT | /api/about | mixed | singleton |
| POST | /api/contact | no | public form submit |
| GET, PATCH, DELETE | /api/contact(/:id) | yes | admin inbox |
| GET | /api/contact/unread-count | yes | |

Public GETs return only `isPublished: true` rows. Send `?all=true` (or any `Authorization: Bearer` header) to include drafts.

Uploaded images: `GET /uploads/<file>` (served from `backend/uploads/`).

---

## Frontend admin UI

```bash
cd ../frontend
npm install
# set NEXT_PUBLIC_API_BASE=http://localhost:4000 in .env.local
npm run dev
```

Open <http://localhost:3000/admin/login> and sign in with the seeded credentials.
