# Deployment guide — Render (free tier, personal use)

The Duora backend is a **single-process** Node service (Express 4 + Socket.IO + JWT)
that runs on SQLite locally and PostgreSQL on Render. No microservices, no Redis,
no separate migration step — the schema is applied on every boot.

> Live deployment: **https://duora.onrender.com** · health: `/health` · `/api/v1/health`

---

## 0. Quickest path: Render Blueprint (recommended)

Render's free tier is perfect for Duora personal use: it sleeps after 15 min idle and
wakes on the next request (~30 s).

1. Push this repo to GitHub (`main`).
2. In Render: **New → Blueprint → Connect repository** → select this repo.
3. Render reads [`render.yaml`](../render.yaml) and shows:
   - `duora` — Docker web service (free, region Singapore, Node 22) → `https://duora.onrender.com`
   - `duora-db` — PostgreSQL 16 (free, 256 MB — ample for two people)
4. **Apply** → Render generates `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` and wires
   `DATABASE_URL` from the database automatically.
5. Wait for the deploy, then open `https://duora.onrender.com/health`:

```json
{"status":"operational","version":"2.0.0","region":"Singapore · ap-southeast",
 "database":{"driver":"postgres","status":"operational"},"services":[...]}
```

6. The blueprint sets `PUBLIC_BASE_URL` to the service URL, so avatars and memory
   photos resolve automatically.
7. `SEED_ON_BOOT=true` seeds the demo couple on the first boot —
   **sukhdev@duora.app / love1234** and **ruhi@duora.app / love1234**.

The app already points at `https://duora.onrender.com`; nothing to configure there.

### Manual Render (without the blueprint)

- **New → PostgreSQL** (free) → copy the **Internal Database URL**.
- **New → Web Service** → connect the repo, then set:

| Field | Value |
|---|---|
| Runtime | Docker |
| Dockerfile Path | `./duora/server/Dockerfile` |
| Docker Context | `./duora/server` |
| Health Check Path | `/health` |

Environment: `NODE_ENV=production`, `DATABASE_URL=<Internal URL>`,
`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (two different random values),
`PUBLIC_BASE_URL=https://duora.onrender.com`, `LOG_LEVEL=info`,
`SEED_ON_BOOT=true`. `PORT` is injected by Render — never hardcode it.

> The image builds with `npm ci --include=dev` inside the builder stage, so the
> TypeScript compiler is always present. `NODE_ENV=production` at *runtime* only
> affects the slim runtime stage.

---

## 1. Docker build (what Render runs)

```bash
docker build -t duora-server:latest ./duora/server
docker run --rm --env-file ./duora/server/.env -p 4000:10000 duora-server:latest
```

- **Builder stage** — `node:22-alpine`, `npm ci --include=dev`,
  `npm run build` → `tsc -p tsconfig.json` + copy of the SQL schema into `dist/db/`.
- **Runtime stage** — `npm ci --omit=dev`, only `dist/`, `scripts/` and `public/`
  are copied. Start command: `node dist/index.js`.

---

## 2. Environment

| Variable | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql://…` (Render) or `file:./data/duora.db` (SQLite) |
| `JWT_ACCESS_SECRET` | ✅ | min 16 chars, 64+ random hex |
| `JWT_REFRESH_SECRET` | ✅ | a **different** random value |
| `PORT` | Render only | injected by Render |
| `NODE_ENV` | optional | `production` on Render |
| `ACCESS_TTL` | optional | access-token lifetime, default `30d` (blueprint: `1h`) |
| `REFRESH_TTL_DAYS` | optional | default `30` |
| `PUBLIC_BASE_URL` | optional | public URL of the deployment — used to build avatar/photo links |
| `CORS_ORIGINS` | optional | empty = allow any origin (mobile clients send no `Origin`) |
| `SEED_ON_BOOT` | optional | `true` seeds the demo couple on boot |
| `LOG_LEVEL` | optional | `fatal｜error｜warn｜info｜debug｜trace` |
| `REGION`, `APP_VERSION`, `PAIRING_TTL_MINUTES` | optional | shown in the app's server-health screen |

The server validates its environment with Zod on boot: a broken value produces a
readable error instead of a runtime crash.

---

## 3. Migrations, seed, start

```bash
cd duora/server
npm ci --include=dev      # devDependencies carry tsc + @types/node
npm run typecheck         # tsc --noEmit
npm run build             # → dist/index.js + dist/db/*.sql
npm run seed              # optional: demo couple (safe to re-run)
npm run dev               # locally: :4000, on Render: :10000
```

There is **no** `prisma migrate` step: `src/db/migrate.ts` applies the schema
(`src/db/schema.postgres.sql` for Postgres, `src/db/schema.sqlite.sql` for SQLite)
when the process starts, so a deploy is always schema-correct.

---

## 4. TypeScript on Render (TS 7)

The server compiles with **TypeScript 7** (`typescript: ^7.0.2`). TS 7 removed the
legacy `node10` module resolution, so `tsconfig.json` uses:

```jsonc
{
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "Node16",
    …
  }
}
```

`Node16` is valid in TypeScript 5.9 **and** 7.x, so the same file builds on your
laptop and on Render. If you ever see:

```
tsconfig.json(5,25): error TS5108: Option 'moduleResolution=node10' has been removed.
```

the compiler in use is older than the config — pull this branch, the fix is in
[`duora/server/tsconfig.json`](../duora/server/tsconfig.json).

---

## 5. Free-tier behaviour

- The service sleeps after 15 minutes idle; the first request wakes it in ~30 s.
- The app shows “Reconnecting”, retries every few seconds and flips to “Connected”
  as soon as the service answers — no error, no lost session.
- The server keeps one SQLite file **or** one PostgreSQL connection pool; both are
  sized for two people.

---

## 6. Troubleshooting a failed Render build

| Symptom in the build log | Cause | Fix |
|---|---|---|
| `error TS5108: Option 'moduleResolution=node10' has been removed` | The compiler is TypeScript 7 while the config still used the legacy resolution | `tsconfig.json` now sets `module`/`moduleResolution` to `Node16` — pull the latest `duora/server` |
| `error TS2688: Cannot find type definition file for 'node'` | Dependencies were never installed, or `npm ci` skipped devDependencies | Build with `npm ci --include=dev && npm run build` (the Dockerfile already does this) |
| `Cannot find module './dist/index.js'` at start | Build never ran | Check the build log; the build command must be `npm ci --include=dev && npm run build` |
| Build succeeds, the app cannot reach the server | `PUBLIC_BASE_URL` still the placeholder, or `CORS_ORIGINS` lists the wrong origin | Set `PUBLIC_BASE_URL` to the exact `https://<service>.onrender.com`; leave `CORS_ORIGINS=""` (mobile clients send no `Origin`) |
| `/health` returns 503 or the page says “Application loading” | The free instance is booting after a deploy or waking from sleep | Wait ~30 s and retry; the app's heartbeat does this for you |
| Login returns 401 for the demo account | `SEED_ON_BOOT` is off | Set `SEED_ON_BOOT=true` (or run `npm run seed` locally) |
| Photos/avatars 404 | `PUBLIC_BASE_URL` is wrong | Point it at the public URL of the deployment |

Local equivalents before you redeploy:

```bash
cd duora/server
npm ci --include=dev
npm run typecheck
npm run build
node dist/index.js        # → http://0.0.0.0:4000
curl http://127.0.0.1:4000/api/v1/health
```

---

## 7. Graceful shutdown

On `SIGTERM` (Render deploy/stop) the server closes Socket.IO, then HTTP, then the
database, with a 5 s hard ceiling. The next boot re-applies the schema idempotently.

---

## 8. Security checklist (personal)

- [x] HTTPS/WSS on Render (automatic TLS + HSTS via helmet)
- [x] bcrypt password hashing, JWT access tokens + rotating single-use refresh tokens
- [x] Every REST route and the Socket.IO handshake are authenticated — identity always
      comes from the token, never from the request body
- [x] Zod validation on every payload, 1 MB body cap, 10-minute pairing invites and
      opaque QR tokens
- [ ] Rotate the blueprint-generated JWT secrets if you ever expose the logs
- [ ] Don't commit `.env` (already in `.gitignore`)
