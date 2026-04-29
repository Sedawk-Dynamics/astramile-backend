# AstraMile — Backend (Admin Panel API)

Node + Express + TypeScript + Prisma + PostgreSQL service that powers the AstraMile public site and admin panel.

Manages: **rockets, missions, crew, launches, news, blog, gallery, technology, about page, homepage stats, and the contact-form inbox**, plus authentication, image uploads, and dashboard summaries.

---

## Table of contents

1. [Architecture](#1-architecture)
2. [Prerequisites](#2-prerequisites)
3. [Local setup](#3-local-setup)
4. [Environment variables](#4-environment-variables)
5. [Database & migrations](#5-database--migrations)
6. [Seeding behaviour](#6-seeding-behaviour)
7. [Running in development](#7-running-in-development)
8. [Building for production](#8-building-for-production)
9. [Deployment guide](#9-deployment-guide)
   - [Generic Linux VM (Ubuntu / Debian)](#91-generic-linux-vm-ubuntu--debian)
   - [Docker](#92-docker)
   - [Render / Railway / Fly.io](#93-render--railway--flyio)
   - [Heroku](#94-heroku)
   - [Windows Server / IIS](#95-windows-server--iis)
10. [Reverse proxy (Nginx)](#10-reverse-proxy-nginx)
11. [HTTPS / SSL](#11-https--ssl)
12. [Uploads & persistent storage](#12-uploads--persistent-storage)
13. [Backups](#13-backups)
14. [Logs & monitoring](#14-logs--monitoring)
15. [Troubleshooting](#15-troubleshooting)
16. [API surface](#16-api-surface)

---

## 1. Architecture

```
backend/
├── prisma/
│   ├── schema.prisma          # Postgres schema (single source of truth)
│   ├── migrations/            # Generated migration history
│   └── seed.ts                # Idempotent seed (admin + demo content)
├── src/
│   ├── server.ts              # Bootstraps HTTP server
│   ├── app.ts                 # Express app (helmet, cors, routes)
│   ├── config/env.ts          # dotenv + required-var validation
│   ├── routes/                # auth, rockets, missions, crew, …
│   ├── controllers/           # Route handlers
│   ├── middleware/            # auth, error, upload
│   ├── lib/prisma.ts          # Singleton Prisma client
│   └── utils/
├── uploads/                   # Image upload directory (runtime data)
├── dist/                      # Compiled output (after `npm run build`)
└── package.json
```

The compiled entry is `dist/src/server.js`. Static uploads are served from `/uploads/*` and stored on disk in `backend/uploads/`.

---

## 2. Prerequisites

- **Node.js 18+** (20 LTS recommended)
- **npm 9+**
- **PostgreSQL 14+** (any reachable instance — local, Docker, RDS, Supabase, Neon, …)
- A POSIX-like shell for the production scripts (Linux/macOS, WSL, or Git Bash on Windows)

Verify:

```bash
node -v        # v20.x
npm -v
psql --version
```

---

## 3. Local setup

```bash
git clone <repo>
cd astramile-full-v3/backend
npm install
cp .env.example .env            # then edit .env
createdb astramile               # or: CREATE DATABASE astramile;
npm run prisma:migrate           # creates tables, generates client
npm run seed                     # seeds admin + demo content
npm run dev                      # http://localhost:4000
```

Health check:

```bash
curl http://localhost:4000/health
# {"ok":true,"uptime":1.23}
```

---

## 4. Environment variables

All variables are read from `backend/.env` (development) or the host environment (production). `DATABASE_URL` and `JWT_SECRET` are **required** — the process exits on boot if they are missing.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | yes | — | `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_SECRET` | yes | — | Long random string. Rotate to invalidate all sessions. |
| `PORT` | no | `4000` | HTTP listen port |
| `NODE_ENV` | no | `development` | Set to `production` in deploys |
| `CORS_ORIGIN` | no | `http://localhost:3000` | Comma-separated list, or `*` |
| `JWT_EXPIRES_IN` | no | `7d` | Any [ms](https://github.com/vercel/ms) duration |
| `SEED_ADMIN_EMAIL` | no | `admin@astramile.local` | Used by seed |
| `SEED_ADMIN_PASSWORD` | no | `ChangeMe123!` | Only overwrites existing admin if explicitly set |
| `SEED_ADMIN_NAME` | no | `AstraMile Admin` | |
| `SEED_FORCE` | no | `false` | `true` re-upserts demo rows |
| `UPLOAD_DIR` | no | `uploads` | Relative to `process.cwd()` |
| `MAX_UPLOAD_MB` | no | `10` | Per-file image upload limit |

> **Encoding passwords**: if your DB password contains `@ : / ? # %`, URL-encode them. `Prince@1902` → `Prince%401902`.

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Production `.env` example

```env
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://astramile:STRONG_PW@db.internal:5432/astramile?schema=public"
JWT_SECRET="b8f1…(64+ hex chars)…"
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://astramile.com,https://www.astramile.com
SEED_ADMIN_EMAIL=admin@astramile.com
SEED_ADMIN_PASSWORD=PleaseChangeOnFirstLogin!
UPLOAD_DIR=/var/lib/astramile/uploads
MAX_UPLOAD_MB=10
```

---

## 5. Database & migrations

| Command | Purpose |
|---|---|
| `npm run prisma:generate` | Regenerate the Prisma client (runs automatically after `npm install`) |
| `npm run prisma:migrate` | **Dev only** — create + apply a new migration interactively |
| `npm run prisma:deploy` | **Production** — apply existing migrations non-interactively |
| `npm run prisma:studio` | Visual DB browser at `http://localhost:5555` |

Workflow when changing `schema.prisma`:

```bash
npm run prisma:migrate -- --name add_blog_video_url
git add prisma/migrations
```

In production you only ever run `prisma:deploy`. Never `prisma migrate dev` against a real database.

---

## 6. Seeding behaviour

`prisma/seed.ts` is **idempotent and safe to run on every deploy**.

- **Admin user** — always upserted, so re-running can restore a lost admin account. The password is overwritten only when `SEED_ADMIN_PASSWORD` is explicitly set in the environment.
- **Demo catalog** (rockets, missions, crew, launches, news, gallery, technology, stats, about) — seeded **only on first run**. The guard checks "does the seeded admin email already exist?". Subsequent runs log `demo content already seeded; skipping.` and never overwrite admin-panel edits.
- **Force re-seed** — set `SEED_FORCE=true` to upsert the demo rows over the existing ones. Use only when restoring demo data after wiping the DB.

```bash
# First deploy
npm run prisma:deploy
npm run seed:prod          # seeds admin + demo content

# Every subsequent deploy
npm run prisma:deploy
npm run seed:prod          # no-op — "already seeded; skipping."
```

The all-in-one script:

```bash
npm run deploy             # = prisma migrate deploy && seed:prod && start
```

---

## 7. Running in development

```bash
npm run dev                # ts-node-dev with auto-restart
```

- Listens on `http://localhost:${PORT}` (default `4000`)
- `morgan` logs each request
- Edit `src/**/*.ts` — server reloads automatically
- Health: `GET /health`
- Prisma Studio: `npm run prisma:studio`

---

## 8. Building for production

```bash
npm install                # dev deps needed to compile
npm run build              # tsc → dist/
npm prune --omit=dev       # optional: drop devDeps after build
npm run prisma:deploy
npm run seed:prod
npm start                  # node dist/src/server.js
```

The compiled output is fully self-contained inside `dist/`. The runtime needs:

- `dist/`
- `node_modules/` (production only)
- `prisma/` (migrations + schema, for `prisma migrate deploy`)
- `package.json`
- `.env` (or environment vars set on the host)
- writable `uploads/` directory

---

## 9. Deployment guide

### 9.1 Generic Linux VM (Ubuntu / Debian)

#### One-time host setup

```bash
# Node 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql

# Create DB + user
sudo -u postgres psql <<SQL
CREATE USER astramile WITH PASSWORD 'STRONG_PW';
CREATE DATABASE astramile OWNER astramile;
SQL

# App user + directories
sudo useradd -r -m -s /bin/bash astramile
sudo mkdir -p /var/lib/astramile/uploads
sudo chown -R astramile:astramile /var/lib/astramile
```

#### Deploy the code

```bash
sudo -u astramile -H bash <<'EOF'
cd ~
git clone <repo> app
cd app/backend
npm ci
cp .env.example .env
# edit .env — set DATABASE_URL, JWT_SECRET, CORS_ORIGIN, UPLOAD_DIR=/var/lib/astramile/uploads
npm run build
npm run prisma:deploy
npm run seed:prod
EOF
```

#### systemd service

`/etc/systemd/system/astramile-api.service`:

```ini
[Unit]
Description=AstraMile API
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=astramile
WorkingDirectory=/home/astramile/app/backend
EnvironmentFile=/home/astramile/app/backend/.env
ExecStart=/usr/bin/node dist/src/server.js
Restart=always
RestartSec=5
# Optional hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/var/lib/astramile

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now astramile-api
sudo systemctl status astramile-api
journalctl -u astramile-api -f
```

#### Updates

```bash
sudo -u astramile -H bash <<'EOF'
cd ~/app
git pull
cd backend
npm ci
npm run build
npm run prisma:deploy
npm run seed:prod
EOF
sudo systemctl restart astramile-api
```

#### PM2 alternative

If you'd rather use PM2:

```bash
sudo npm i -g pm2
pm2 start dist/src/server.js --name astramile-api --cwd /home/astramile/app/backend
pm2 save
pm2 startup systemd        # follow the printed instructions
```

---

### 9.2 Docker

#### Dockerfile

```dockerfile
# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- run stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
ENV UPLOAD_DIR=/data/uploads
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js && node dist/src/server.js"]
```

#### docker-compose.yml

```yaml
version: "3.9"
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: astramile
      POSTGRES_PASSWORD: STRONG_PW
      POSTGRES_DB: astramile
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U astramile"]
      interval: 10s
      retries: 5

  api:
    build: ./backend
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://astramile:STRONG_PW@db:5432/astramile?schema=public
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: https://astramile.com
      NODE_ENV: production
      PORT: "4000"
      UPLOAD_DIR: /data/uploads
    volumes:
      - uploads:/data/uploads
    ports:
      - "4000:4000"

volumes:
  pgdata:
  uploads:
```

```bash
docker compose up -d --build
docker compose logs -f api
```

---

### 9.3 Render / Railway / Fly.io

These platforms detect Node automatically.

- **Build command**: `npm ci && npm run build`
- **Start command**: `npm run prisma:deploy && npm run seed:prod && node dist/src/server.js`
  (or just `npm run deploy`)
- **Node version**: 20
- **Env vars**: set everything from §4 in the dashboard
- **Persistent disk**: mount it at `/data/uploads` and set `UPLOAD_DIR=/data/uploads`. Without a disk, uploaded images vanish on every redeploy.
- **Database**: provision a managed Postgres add-on and copy its connection string into `DATABASE_URL`.

#### Render `render.yaml` example

```yaml
services:
  - type: web
    name: astramile-api
    runtime: node
    plan: starter
    buildCommand: npm ci && npm run build
    startCommand: npm run prisma:deploy && npm run seed:prod && node dist/src/server.js
    disk:
      name: uploads
      mountPath: /data/uploads
      sizeGB: 5
    envVars:
      - key: DATABASE_URL
        fromDatabase: { name: astramile-db, property: connectionString }
      - key: JWT_SECRET
        generateValue: true
      - key: NODE_ENV
        value: production
      - key: UPLOAD_DIR
        value: /data/uploads
      - key: CORS_ORIGIN
        value: https://astramile.com

databases:
  - name: astramile-db
    plan: starter
```

---

### 9.4 Heroku

Heroku has an ephemeral filesystem, so uploads must go to S3 (or a similar object store). Out of the box this codebase writes to local disk — Heroku is fine for a quick demo but **not** for production unless you swap in S3.

```bash
heroku create astramile-api
heroku addons:create heroku-postgresql:essential-0
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
heroku config:set CORS_ORIGIN=https://astramile.com
heroku config:set NODE_ENV=production
git push heroku main
heroku run "npm run prisma:deploy && npm run seed:prod"
```

`Procfile`:

```
web: node dist/src/server.js
release: npx prisma migrate deploy && node dist/prisma/seed.js
```

---

### 9.5 Windows Server / IIS

```powershell
# Install Node 20 LTS, PostgreSQL 16
# Open PowerShell as the service user
cd C:\apps\astramile\backend
npm ci
copy .env.example .env       # edit .env
npm run build
npm run prisma:deploy
npm run seed:prod
```

Run as a Windows service via [`node-windows`](https://github.com/coreybutler/node-windows) or [NSSM](https://nssm.cc/):

```cmd
nssm install AstramileAPI "C:\Program Files\nodejs\node.exe" "C:\apps\astramile\backend\dist\src\server.js"
nssm set AstramileAPI AppDirectory "C:\apps\astramile\backend"
nssm set AstramileAPI AppEnvironmentExtra DATABASE_URL=... JWT_SECRET=... NODE_ENV=production
nssm start AstramileAPI
```

For IIS as a reverse proxy, install **URL Rewrite** + **Application Request Routing** and forward `/api/*` and `/uploads/*` to `http://localhost:4000`.

---

## 10. Reverse proxy (Nginx)

Recommended in front of the Node process. Terminates TLS, serves uploads efficiently, sets sensible headers.

`/etc/nginx/sites-available/astramile-api`:

```nginx
server {
  listen 80;
  server_name api.astramile.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.astramile.com;

  ssl_certificate     /etc/letsencrypt/live/api.astramile.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.astramile.com/privkey.pem;

  client_max_body_size 12m;     # MAX_UPLOAD_MB + a bit of headroom

  # Static uploads — let Nginx serve them
  location /uploads/ {
    alias /var/lib/astramile/uploads/;
    expires 7d;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin *;
  }

  location / {
    proxy_pass         http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/astramile-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 11. HTTPS / SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.astramile.com
sudo systemctl status certbot.timer    # auto-renews
```

If you're behind Cloudflare or another CDN, set its TLS mode to **Full (strict)** and keep the Nginx cert valid.

---

## 12. Uploads & persistent storage

- Files are written to `${UPLOAD_DIR}` (default `backend/uploads/`). Always point this at a **persistent volume** in production (`/var/lib/astramile/uploads`, a Docker named volume, a Render disk, …).
- Per-file size limit: `MAX_UPLOAD_MB` (default 10 MB). Mirror this in your reverse proxy via `client_max_body_size`.
- The directory is served read-only at `GET /uploads/<file>`. The frontend's `resolveImage()` prefixes relative `/uploads/...` paths with `NEXT_PUBLIC_API_BASE`.
- For multi-instance deployments or platforms with ephemeral disk (Heroku, Cloud Run, Vercel functions), replace the on-disk store with S3/GCS — only `controllers/upload.controller.ts` and `app.ts`'s static handler need to change.

---

## 13. Backups

Daily logical backup is enough for almost any team:

```bash
# /etc/cron.daily/astramile-db
#!/usr/bin/env bash
set -euo pipefail
ts=$(date +%F)
pg_dump "$DATABASE_URL" | gzip > /var/backups/astramile/db-$ts.sql.gz
find /var/backups/astramile -name 'db-*.sql.gz' -mtime +30 -delete
```

Don't forget the uploads directory:

```bash
rsync -a --delete /var/lib/astramile/uploads/ /var/backups/astramile/uploads/
```

Restore:

```bash
gunzip -c db-2026-04-29.sql.gz | psql "$DATABASE_URL"
```

---

## 14. Logs & monitoring

- **stdout/stderr** — Express logs each request through `morgan`. With systemd: `journalctl -u astramile-api -f`. With PM2: `pm2 logs astramile-api`.
- **Health check** — `GET /health` returns `{ ok: true, uptime }`. Wire this into your load balancer / uptime monitor.
- **Process metrics** — `pm2 monit` or your host's metrics. The process is single-threaded; scale horizontally behind Nginx if you need more capacity.

---

## 15. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Missing required env var: DATABASE_URL` | `.env` not loaded or var unset | Confirm `.env` is in `backend/`; or set vars in the host environment |
| `P1001 Can't reach database server` | Wrong host/port/credentials, or DB not running | Test with `psql "$DATABASE_URL"` |
| `P1000 Authentication failed` | Wrong password, or special chars not URL-encoded | URL-encode `@ : / ? # %` |
| `CORS: origin … not allowed` | Frontend origin missing from `CORS_ORIGIN` | Add it (comma-separated). Restart the API. |
| Uploaded image returns 404 | Wrong `UPLOAD_DIR` or volume not mounted | Confirm the path Nginx serves matches `UPLOAD_DIR` |
| `413 Payload Too Large` | File exceeds `MAX_UPLOAD_MB` *or* Nginx limit | Raise `MAX_UPLOAD_MB` and `client_max_body_size` |
| Login works but `/api/auth/me` returns 401 | `JWT_SECRET` changed since the token was issued | Log in again, or keep the secret stable |
| `Migration … not yet applied` after deploy | Pipeline skipped `prisma migrate deploy` | Run `npm run prisma:deploy` |
| Demo content reappears after edit | `SEED_FORCE=true` left in env | Unset it |

---

## 16. API surface

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/auth/login` | no | returns `{ token, user }` |
| `GET` | `/api/auth/me` | yes | |
| `POST` | `/api/auth/change-password` | yes | |
| `POST` | `/api/upload/image` | yes | `multipart/form-data`, field `file` — stored in `${UPLOAD_DIR}` |
| `GET` | `/api/dashboard/summary` | yes | counts + upcoming launches |
| `GET, POST, PATCH, DELETE` | `/api/rockets` | mixed | GET public, writes auth |
| `GET, POST, PATCH, DELETE` | `/api/missions` | mixed | |
| `GET, POST, PATCH, DELETE` | `/api/crew` | mixed | "Our Team" members |
| `GET, POST, PATCH, DELETE` | `/api/launches` | mixed | |
| `GET, POST, PATCH, DELETE` | `/api/news` | mixed | |
| `GET, POST, PATCH, DELETE` | `/api/blog` | mixed | Articles + YouTube/Vimeo/video URL |
| `GET, POST, PATCH, DELETE` | `/api/gallery` | mixed | |
| `GET, POST, PATCH, DELETE` | `/api/technology` | mixed | |
| `GET, PUT` | `/api/about` | mixed | singleton |
| `POST` | `/api/contact` | no | public form submit |
| `GET, PATCH, DELETE` | `/api/contact(/:id)` | yes | admin inbox |
| `GET` | `/api/contact/unread-count` | yes | |
| `GET` | `/health` | no | liveness probe |

Public `GET`s return only `isPublished: true` rows. Send `?all=true` (or any `Authorization: Bearer …` header) to include drafts. Uploaded images are served at `GET /uploads/<file>`.

---

## License

Proprietary — © AstraMile.
