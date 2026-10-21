# Deployment guide — Render (free tier) + Supabase Postgres

The Duora backend is a **single-process** Node service (Express 4 + Socket.IO + JWT)
whose data lives in **Supabase Postgres**. No microservices, no Redis, no separate
migration step — the schema is applied on every boot.

> Live deployment: **https://duora.onrender.com** · health: `/health` · `/api/v1/health`

---

## 0. Quickest path: one click (recommended)

Render's free tier is perfect for Duora personal use: it sleeps after 15 min idle and
wakes on the next request (~30 s).

### Step 1 — the Supabase connection string (2 minutes)

Your project: **sukhdevr898's Project**, ref `prgumgksuhinnyjlyzli`, region `ap-south-1`.

1. [supabase.com/dashboard](https://supabase.com/dashboard) → open the project.
   *If it says **Paused**, click **Restore project** first — Render cannot reach a
   paused database.*
2. **Project Settings → Database**.
3. **Reset database password** if you have never seen it (it is shown only once).
4. **Connection string → URI** → copy the **Session pooler** (port `5432`):

   ```
   postgresql://postgres.prgumgksuhinnyjlyzli:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
   ```

> **Use the pooler host.** The plain `db.<ref>.supabase.co` host is IPv6-only and
> Render has no IPv6 — the connection would fail with `ENOTFOUND`/`ETIMEDOUT`.
> The **Transaction pooler** (port `6543`) works too.

### Step 2 — the Render blueprint

1. Push the branch to GitHub.
2. Render → **New → Blueprint** → connect the repository.
3. Render reads [`render.yaml`](../render.yaml) and shows one service:
   `duora` — a free Docker web service (region Singapore, Node 22) → `https://duora.onrender.com`.
4. Render asks for the one value you have not provided: **DATABASE_URL** — paste the
   Supabase string from step 1.
5. **Apply**. Render generates `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` for you.
6. The first boot creates the schema and seeds the demo couple
   (**sukhdev@duora.app / love1234**, **ruhi@duora.app / love1234**).
7. Check `https://duora.onrender.com/health`:

```json
{"status":"operational","version":"3.0.0","region":"Singapore · ap-southeast",
 "database":{"driver":"postgres","status":"operational"},"services":[...]}
```

`PUBLIC_BASE_URL` is wired to the service URL, so avatars and memory photos resolve
automatically. The app already points at `https://duora.onrender.com` — nothing to
configure there.

### Manual Render (without the blueprint)

**New → Web Service** → connect the repo, then set:

| Field | Value |
|---|---|
| Runtime | Docker |
| Dockerfile Path | `./duora/server/Dockerfile` |
| Docker Context | `./duora/server` |
| Health Check Path | `/health` |

Environment:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | the Supabase connection string (step 1) |
| `JWT_ACCESS_SECRET` | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 32` (a different value) |
| `PUBLIC_BASE_URL` | `https://duora.onrender.com` |
| `SEED_ON_BOOT` | `true` |
| `LOG_LEVEL` | `info` |

`PORT` is injected by Render — never hardcode it.

> The image builds with `npm ci --include=dev` inside the builder stage, so the
> TypeScript compiler is always present. `NODE_ENV=production` at *runtime* only
> affects the slim runtime stage.

---

## 1. Docker build (what Render runs)

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
COPY public ./public
EXPOSE 10000
CMD ["node", "dist/index.js"]
```

`npm run build` compiles the TypeScript **and copies `src/*.sql` into `dist/`** — the
migration reads the schema from disk next to the compiled module.

### Native build (if you do not want Docker)

| Field | Value |
|---|---|
| Root directory | `duora/server` |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `node dist/index.js` |
| Health check path | `/health` |

---

## 2. The database

The schema (`duora/server/src/schema.sql`) has 16 tables and is applied on **every
boot** — every statement is `IF NOT EXISTS`, so restarting is always safe.

```
users · settings · pairings · conversations · conversation_participants
messages · message_receipts · reactions · hidden_messages · notes
devices · refresh_tokens · presence · call_sessions · anniversaries · quick_replies
```

### Applying the schema by hand

```bash
cd duora/server
DATABASE_URL="postgresql://…" npm run migrate
```

### Supabase dashboard

| Task | Where |
|---|---|
| Reset the password | Settings → Database → Reset database password |
| See the tables | Table Editor |
| See the data | SQL Editor |
| Check the API is up | Settings → API → the project URL + anon key |
| Check the connection | Settings → Database → Connection string |

The app talks to the API through Node's `pg` driver, so the **anon key is not needed**
anywhere. The database password is the only secret involved.

### Pool sizing

The server opens at most **3** Postgres connections (`max: 3` in `src/db.ts`) — well
inside the Supabase free tier. Each Render instance gets its own pool.

---

## 3. Keeping it awake / free-tier behaviour

- The free web service **sleeps after 15 minutes** of inactivity and wakes on the next
  request. The first request after a sleep takes 20–50 s.
- The app shows **"Cannot reach the Duora server"** while the service wakes and retries
  automatically (`withRetry` in `src/api/client.ts`).
- The mobile app's **Server** screen (`app/server.tsx`) pings `/api/v1/health` and
  reports *Live / Offline* with the measured latency.

---

## 4. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Could not reach the database at aws-0-…pooler.supabase.com:5432/postgres` | Wrong password, or the project is paused | Restore the project, reset the password, update `DATABASE_URL` |
| `ENOTFOUND db.<ref>.supabase.co` | The direct (IPv6) host was used | Switch to the **pooler** host |
| `relation "users" does not exist` | The schema was never applied | `npm run migrate` with the same `DATABASE_URL` |
| The service shows "Application loading" | Still building or migrating | Watch the Render logs — the boot takes ~30 s |
| `password authentication failed for user "postgres"` | Password mismatch | Reset the password in Supabase and update the env var |
| Avatars are broken | `PUBLIC_BASE_URL` unset | Set it to the service URL |

---

## 5. The mobile app

```bash
cd duora/app
EXPO_PUBLIC_API_URL=https://duora.onrender.com npx expo start
```

`https://duora.onrender.com` is already the default in
`duora/app/src/api/client.ts`, `duora/app/app.json` (`expo.extra.apiUrl`) and
`duora/app/src/state/store.ts`.
