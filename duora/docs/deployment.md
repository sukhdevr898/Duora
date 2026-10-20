# Deployment guide — personal lightweight edition

This server is a **single-process** Node service (Express + Socket.IO + Prisma) designed for **2-person personal use** on Render's free tier. No microservices, no Redis, no heavy infrastructure.

---

## 0. Quickest path: Render Blueprint (recommended)

Render's free tier is perfect for Duora personal use: 750h/month, sleeps after 15 min idle, wakes on next request.

1. Push this repo to GitHub (branch `arena/006c31fc-duora` or `main`).
2. In Render: **New → Blueprint → Connect repository** → select your repo.
3. Render reads `render.yaml` at the repo root and shows:
   - `duora-server` (Node web service, free, region Singapore)
   - `duora-db` (PostgreSQL, free, 256MB — ample for 2-person chat)
4. Click **Apply** → Render generates `JWT_*` secrets and `DATABASE_URL` automatically.
5. Wait for deploy (build: `npm ci && prisma generate && build` → start: `prisma migrate deploy && node dist/server.js`).
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
- **New → Web Service** → connect repo → Root Directory: `duora/server` → Build: `npm ci && npx prisma generate && npm run build` → Start: `npx prisma migrate deploy && node dist/server.js` → Health Check: `/health`.
- Environment: `NODE_ENV=production`, `PORT=10000`, `DATABASE_URL=<Internal URL>`, generate two `JWT_*` secrets (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`), `PUBLIC_BASE_URL=https://<your-service>.onrender.com`, `LOG_LEVEL=warn`. Leave Firebase/TURN empty for lightweight.

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
npm ci
npx prisma migrate deploy   # on Render this runs automatically
npx prisma generate
npm run db:seed              # optional demo couple alice/bob Password123!
npm run build && npm start   # locally: :4000, on Render: :10000
```

`GET /ready` → 503 until DB connects (use as health check), `GET /health` → always ok if process alive.

## 4. Docker (lightweight Alpine)

```bash
docker build -t duora-server:latest ./server
docker run --rm --env-file ./server/.env -p 4000:10000 duora-server:latest
```

Image is Alpine + tini, ~120MB, pruned dev deps. Compose for local Postgres:

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
