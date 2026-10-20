# Deployment guide — personal lightweight edition

This server is a **single-process** Node service (Express + Socket.IO + Prisma) designed for **2-person personal use** on Render's free tier. No microservices, no Redis, no heavy infrastructure.

---

## 0. Quickest path: Render Blueprint (recommended)

Render's free tier is perfect for Duora personal use: 750h/month, sleeps after 15 min idle, wakes on next request.

1. Push this repo to GitHub (`main`).
2. In Render: **New → Blueprint → Connect repository** → select your repo.
3. Render reads `render.yaml` at the repo root and shows:
   - `duora-server` (Node web service, free, region Singapore, Node 22)
   - `duora-db` (PostgreSQL, free, 256MB — ample for 2-person chat)
4. Click **Apply** → Render generates `JWT_*` secrets and `DATABASE_URL` automatically.
5. Wait for deploy:
   - build: `npm ci --include=dev && npm run build` (build = `prisma generate` + `tsc` → `dist/server.js`)
   - start: `npx prisma migrate deploy && node dist/server.js`
6. Once live, open `https://<your-service>.onrender.com/health` → `{"status":"ok"}`.
7. **Set your public URL:** Render Dashboard → duora-server → Environment → set `PUBLIC_BASE_URL` to `https://<your-service>.onrender.com` (the exact URL Render assigned), save → redeploy.
8. Point the app at it:

```env
# duora/app/.env (then restart expo)
EXPO_PUBLIC_API_BASE_URL="https://<your-service>.onrender.com/api/v1"
EXPO_PUBLIC_WS_URL="https://<your-service>.onrender.com"
EXPO_PUBLIC_ENV="production"
```

Free-tier note: after 15 min idle the service sleeps; the first request wakes it in ~30s. The app shows a gentle "Reconnecting…" banner — not an error.

Blueprint file: [`/render.yaml`](../../render.yaml) — tweak region, plan, or autoDeploy there.

### Manual Render (without blueprint)

- **New → PostgreSQL** (free) → copy **Internal Database URL**.
- **New → Web Service** → connect repo, then set **exactly** these fields:

| Field | Value |
|---|---|
| Root Directory | `duora/server` |
| Runtime | Node |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npx prisma migrate deploy && node dist/server.js` |
| Health Check Path | `/health` |

> ⚠️ Do **not** leave Build Command as `npm run build` alone. Render then installs
> nothing, and `tsc` is missing → `error TS2688: Cannot find type definition file for 'node'`.
> `--include=dev` also matters because `NODE_ENV=production` makes a bare `npm ci`
> skip devDependencies (where `typescript`, `@types/node` and the `prisma` CLI live).

- Environment: `NODE_ENV=production`, `NODE_VERSION=22` (otherwise Render picks the newest
  Node, e.g. 26.x, which Prisma 6 is not built for), `DATABASE_URL=<Internal URL>`,
  generate two `JWT_*` secrets (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`),
  `PUBLIC_BASE_URL=https://<your-service>.onrender.com`, `LOG_LEVEL=warn`.
  Leave Firebase/TURN empty for lightweight. `PORT` is injected by Render — do not hardcode it.

---

## 1. Local / VPS PostgreSQL (alternative)

Any managed Postgres (≥14) works — local, Neon, Supabase, Railway.

```sql
CREATE DATABASE duora;
CREATE USER duora WITH ENCRYPTED PASSWORD '<strong-password>';
GRANT ALL PRIVILEGES ON DATABASE duora TO duora;
```

## 2. Environment (only 3 required vars)

```bash
cd server
cp .env.example .env
```

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Render/Neon URL or local `postgresql://...` |
| `JWT_ACCESS_SECRET` | ✅ | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | ✅ | different value from above |
| `FIREBASE_*` | optional | leave empty — push is skipped, chat still works via socket |
| `TURN_*` | optional | leave empty — STUN handles most home Wi-Fi calls |
| `ATTACHMENTS_ENABLED` | optional | default `false` for lightweight personal use |

## 3. Migrations and start

```bash
npm ci --include=dev        # devDeps carry tsc, @types/node and the prisma CLI
npx prisma migrate deploy   # on Render this runs in the start command
npm run build               # prisma generate + tsc → dist/server.js
npm run db:seed             # optional demo couple alice/bob Password123!
npm start                   # locally: :4000, on Render: :10000
```

Layout note: `tsconfig.json` compiles **only** `src/` with `rootDir: src`, so the entry
point lands at `dist/server.js` — the path `npm start` and Render's start command use.
`tsconfig.test.json` (used by `npm run typecheck`) additionally covers `tests/` and
`prisma/seed.ts` without emitting.

`GET /ready` → 503 until DB connects (use as health check), `GET /health` → always ok if process alive.

## 4. Docker (lightweight Alpine)

```bash
docker build -t duora-server:latest ./server
docker run --rm --env-file ./server/.env -p 4000:10000 duora-server:latest
```

Image is Alpine + tini, ~120MB, pruned dev deps — the Prisma CLI is *not* in it, so run
migrations once with the dedicated target (or let Render's start command do it):

```bash
docker build --target migrate -t duora-migrate ./server
docker run --rm --env-file ./server/.env duora-migrate   # → prisma migrate deploy
```

Compose for local Postgres:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment: { POSTGRES_USER: duora, POSTGRES_PASSWORD: duora, POSTGRES_DB: duora }
    volumes: ["pgdata:/var/lib/postgresql/data"]
  api:
    build: ./server
    env_file: ./server/.env
    ports: ["4000:10000"]
    depends_on: [db]
volumes: { pgdata: {} }
```

## 5. Reverse proxy (if self-hosting, not Render)

Nginx must allow Socket.IO upgrade:

```nginx
location / {
  proxy_pass http://127.0.0.1:10000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_read_timeout 300s;
}
```

## 6. Lightweight tuning for personal use (applied)

- **Cleanup job:** every 5 min (was 60s) — expired invites/sessions + missed-call sweep, saves 4/5 DB wakeups.
- **Socket heartbeat:** ping 25s / timeout 30s (was 20s/30s) — fewer packets for 2 users.
- **Logging:** `pino-http` skips `/health`+`/ready`, `LOG_LEVEL=warn` on Render — less log drain I/O.
- **Attachments:** default `false` — no disk I/O or object storage.
- **TURN:** default `false` — no credential minting unless you configure coturn.
- **Memory:** single Prisma client, no Redis, in-memory rate limiters (correct for 1 instance).

Cost note: TURN relay bandwidth (if you add coturn) and Render Postgres storage beyond free limits are the only variable costs — everything else fits free tier for 2-person chat.

## 7. Troubleshooting a failed Render build

| Symptom in the build log | Cause | Fix |
|---|---|---|
| `error TS2688: Cannot find type definition file for 'node'` (and `'vitest/globals'`) | Dependencies were never installed, or `npm ci` skipped devDependencies because `NODE_ENV=production` | Build Command: `npm ci --include=dev && npm run build` |
| `error TS5108: Option 'moduleResolution=node10' has been removed` | Render used a TypeScript 6.x compiler (only possible when the local `node_modules/.bin/tsc` is missing) | Same fix as above — the repo pins `typescript ^5.7.3` locally, and `tsconfig.json` now uses `NodeNext` so either compiler works |
| `Cannot find module .../dist/server.js` at start | Build emitted to `dist/src/server.js` | Already fixed: `rootDir: "src"`, `include: ["src/**/*.ts"]` → `dist/server.js` |
| `The engine node-20.x is incompatible` / Prisma engine errors | Render selected a brand-new Node (26.x) from `engines: ">=20"` | Pinned: `NODE_VERSION=22` in `render.yaml`, `.node-version` = `22`, `engines.node: "22.x"` |
| `/ready` returns 503 after a successful build | Migrations never ran | Start Command must be `npx prisma migrate deploy && node dist/server.js` (or use the Docker `migrate` target) |
| `npx prisma: command not found` inside the Docker container | Runtime image prunes devDependencies, which include the Prisma CLI | Use `docker build --target migrate` (see §4), or migrate from the host |
| Build succeeds, app can't reach the server | `PUBLIC_BASE_URL` still the placeholder, or CORS origins listed | Set `PUBLIC_BASE_URL` to your exact `https://<service>.onrender.com`; leave `CORS_ORIGINS=""` (mobile clients send no `Origin`) |

Local equivalents, before you redeploy:

```bash
cd duora/server
npm ci --include=dev
npm run build      # → dist/server.js
npm run typecheck  # src + tests + prisma seed
npm test           # 24 tests, mocked Prisma, no DB needed
```


## 7. Graceful shutdown

On SIGTERM (Render deploy/stop): stop timers → close Socket.IO → close HTTP → disconnect Prisma → exit, 10s hard ceiling. Cold starts re-run `prisma migrate deploy` idempotently.

## 8. Push & TURN (optional for personal use)

Without them you still get: register/login, pairing, real-time chat, WebRTC calls while both apps are open. Push only matters for *background* alerts when the partner's app is closed.

- **FCM:** add Firebase service account env vars later; invalid tokens auto-pruned.
- **TURN:** host coturn and set `TURN_ENABLED=true` + `TURN_SECRET` + `TURN_URLS`.

## 9. Security checklist (personal)

- [x] HTTPS/WSS on Render (automatic TLS + HSTS via helmet)
- [x] Short-lived JWT + rotated refresh, bcrypt cost 12
- [x] Rate limits (gentle — 5 reg/hour, 10 login/15m, 60 msg/min — fine for 2 users)
- [ ] Rotate `render.yaml` generated JWT secrets if you ever expose logs
- [ ] Don't commit `.env` or `*-serviceAccount*.json` (already in .gitignore)

## 10. Data retention (personal)

- `RefreshSession` expired rows deleted every 5 min; logout revokes immediately.
- Account delete is soft (`deletedAt`) — hard-delete manually if you truly want to wipe: `DELETE FROM users WHERE "deletedAt" IS NOT NULL;`.
- "Delete for me" hides per-user; "delete for everyone" blanks content but keeps the row for receipt integrity.
