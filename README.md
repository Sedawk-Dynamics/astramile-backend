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

## 2. Install

```bash
cd backend
npm install
```

## 3. Configure

Copy `.env.example` to `.env` (a default `.env` is already committed for local dev — edit as needed):

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/astramile?schema=public"
PORT=4000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET="change-me"
JWT_EXPIRES_IN=7d
SEED_ADMIN_EMAIL=admin@astramile.local
SEED_ADMIN_PASSWORD=ChangeMe123!
```

## 4. Run migrations + seed

```bash
npm run prisma:migrate      # creates tables (will prompt for a migration name, e.g. "init")
npm run seed                # creates the admin user + demo content
```

## 5. Start

```bash
npm run dev                 # ts-node-dev on http://localhost:4000
```

Health check: `GET http://localhost:4000/health` → `{ ok: true }`

## 6. Prisma tooling

```bash
npm run prisma:studio       # GUI on http://localhost:5555
npm run prisma:generate     # regenerate client after schema edits
```

---

## API surface

| Method | Path                          | Auth | Notes |
|--------|-------------------------------|------|-------|
| POST   | /api/auth/login               | no   | returns `{ token, user }` |
| GET    | /api/auth/me                  | yes  | |
| POST   | /api/auth/change-password     | yes  | |
| POST   | /api/upload/image             | yes  | `multipart/form-data`, field `file` |
| GET    | /api/dashboard/summary        | yes  | counts + upcoming launches |
| GET/POST/PATCH/DELETE | /api/rockets         | mixed | GET public, rest auth |
| GET/POST/PATCH/DELETE | /api/missions        | mixed | |
| GET/POST/PATCH/DELETE | /api/crew            | mixed | |
| GET/POST/PATCH/DELETE | /api/launches        | mixed | |
| GET/POST/PATCH/DELETE | /api/news            | mixed | |
| GET/POST/PATCH/DELETE | /api/gallery         | mixed | |
| GET/POST/PATCH/DELETE | /api/technology      | mixed | |
| GET/POST/PATCH/DELETE | /api/stats           | mixed | |
| GET/PUT                | /api/about           | mixed | singleton |
| POST                   | /api/contact         | no    | public form submit |
| GET/PATCH/DELETE       | /api/contact(/:id)   | yes   | admin inbox |
| GET                    | /api/contact/unread-count | yes | |

Public GETs return only rows where `isPublished = true`. Send `?all=true` (or any `Authorization: Bearer` header) to include drafts.

Uploaded images are served from `GET /uploads/<filename>`.

---

## Frontend admin UI

The admin panel lives in the Next.js app at `/admin`.

```bash
cd ../frontend
npm install
# set NEXT_PUBLIC_API_BASE=http://localhost:4000 in .env.local
npm run dev
```

Open <http://localhost:3000/admin/login> and sign in with the seeded credentials.

---

## Production build

```bash
npm run build
npm run prisma:deploy
npm start
```

Remember to:
- Use a strong random `JWT_SECRET`.
- Set `NODE_ENV=production`.
- Change the seeded admin password (`/api/auth/change-password`).
- Serve uploads from durable storage (S3/R2) if scaling beyond a single host — current setup uses local disk.
