# Duora API — the backend

A small Node.js server (Express + Socket.IO) that stores everything in
**Supabase Postgres** and runs on the **Render free tier**.

The whole server is 21 files. Each route file holds its own SQL, so you can
find any endpoint by opening one file.

```
src/
├── index.ts        boot: wait for the database → migrate → seed → listen
├── app.ts          the Express app and the route table
├── env.ts          environment configuration (validated once at boot)
├── db.ts           the data layer (Postgres / SQLite) + migrations
├── auth.ts         JWT tokens and the `requireAuth` guard
├── http.ts         request validation, error and not-found handlers
├── realtime.ts     Socket.IO: presence, live messages, typing, calls
├── seed.ts         the demo couple (sukhdev@duora.app / love1234)
├── schema.sql      the Postgres schema (Supabase)
├── schema.sqlite.sql  the same schema for local SQLite
├── util.ts         shared helpers: errors, ids, timestamps
└── routes/         one file per feature
    ├── auth.ts  users.ts  pairing.ts  chat.ts  notes.ts
    ├── calls.ts  settings.ts  devices.ts  system.ts
```

---

## 1. Set up the database (Supabase) — 2 minutes

Your Supabase project is **sukhdevr898's Project**
(ref `prgumgksuhinnyjlyzli`, region `ap-south-1`).

1. Open [supabase.com/dashboard](https://supabase.com/dashboard) and pick the
   project. If it shows **Paused / Restore project**, restore it first —
   Render cannot reach a paused database.
2. Go to **Project Settings → Database**.
3. If you have never seen the password, click **Reset database password** and
   copy it (it is shown only once).
4. Under **Connection string → URI**, copy the **Session pooler** string
   (port `5432`). It looks like:

   ```
   postgresql://postgres.prgumgksuhinnyjlyzli:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
   ```

   > Use the **pooler** host. The plain `db.<ref>.supabase.co` host is IPv6-only
   > and Render cannot reach it. The **Transaction pooler** (port `6543`) also
   > works.

That one string is the only thing you need from Supabase.

---

## 2. Deploy to Render — one click

1. Push this branch to GitHub.
2. In Render: **New → Blueprint** → connect the repository → **Apply**.
3. Render asks for one value: **DATABASE_URL**. Paste the Supabase connection
   string from step 1 and continue.

That is it. The blueprint (`render.yaml`) creates a free web service, generates
both JWT secrets for you, and the server creates the schema and seeds the demo
couple on the first boot.

Your API lives at `https://duora.onrender.com` (health check: `/health`).

<details>
<summary>Deploying without the blueprint (manual)</summary>

| Setting | Value |
| --- | --- |
| Environment | Node | 
| Root directory | `duora/server` |
| Build command | `npm ci --include=dev && npm run build` |
| Start command | `node dist/index.js` |
| Health check path | `/health` |

Environment variables: `NODE_ENV=production`, `DATABASE_URL` (Supabase),
`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (`openssl rand -hex 32`),
`PUBLIC_BASE_URL=https://duora.onrender.com`, `SEED_ON_BOOT=true`.

</details>

---

## 3. Run it locally

```bash
cd duora/server
cp .env.example .env      # SQLite by default — no database needed
npm install
npm run setup             # checks the environment and creates the schema
npm run dev               # http://127.0.0.1:4000
```

To use the real Supabase database locally, put the connection string in `.env`:

```bash
DATABASE_URL=postgresql://postgres.prgumgksuhinnyjlyzli:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
```

---

## Environment variables

| Variable | Required | Default | What it does |
| --- | --- | --- | --- |
| `DATABASE_URL` | in production | `file:./data/duora.db` | Supabase connection string (`postgresql://…`) or a SQLite file (`file:…`) |
| `JWT_ACCESS_SECRET` | in production | dev value | Signs the access tokens |
| `JWT_REFRESH_SECRET` | in production | dev value | Signs the refresh tokens |
| `NODE_ENV` | no | `development` | `production` on Render |
| `PORT` | no | `4000` | Render injects `10000` |
| `HOST` | no | `0.0.0.0` | Bind address |
| `PUBLIC_BASE_URL` | no | – | Used to build absolute image URLs |
| `CORS_ORIGINS` | no | any | Comma separated allow-list |
| `ACCESS_TTL` | no | `30d` | Access-token lifetime |
| `REFRESH_TTL_DAYS` | no | `30` | Refresh-token lifetime |
| `SEED_ON_BOOT` | no | `false` | Creates the demo couple on boot |
| `PAIRING_TTL_MINUTES` | no | `10` | How long a pairing code lives |
| `DB_CONNECT_ATTEMPTS` | no | `12` | Retries while the database wakes up |
| `DB_CONNECT_DELAY_MS` | no | `5000` | Delay between retries |
| `DB_FALLBACK` | no | `none` | `sqlite` boots with a local file if Postgres is down |
| `LOG_LEVEL` | no | `info` | pino log level |
| `APP_VERSION` | no | `3.0.0` | Shown on the health screen |
| `REGION` | no | `Singapore · ap-southeast` | Shown on the health screen |

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript and copy the SQL schema into `dist/` |
| `npm start` | Run the compiled server |
| `npm run setup` | Check the environment, print what to paste into Render, create the schema |
| `npm run migrate` | Create the schema (safe to run again) |
| `npm run seed` | Create the schema and insert the demo couple |
| `npm run db:reset` | Delete the local SQLite file and start over |
| `npm run typecheck` | `tsc --noEmit` |

---

## The API

Full reference: [`../docs/api.md`](../docs/api.md) · realtime events:
[`../docs/websocket-events.md`](../docs/websocket-events.md).

Base path `/api/v1`, everything except `register`, `login` and `refresh` needs
`Authorization: Bearer <accessToken>`.

```
/health                      GET   service + database status
/api/v1/health               GET   the same, with latencies (app's Server screen)
/api/v1/auth/register        POST  { email, password, displayName }
/api/v1/auth/login           POST  { email, password }
/api/v1/auth/refresh         POST  { refreshToken }   (single use)
/api/v1/auth/logout          POST  { refreshToken }
/api/v1/auth/me              GET
/api/v1/users/me             GET   PATCH { displayName, avatarUrl, partnerNickname }
/api/v1/pairing/status       GET
/api/v1/pairing/invitation   POST  → { code, token, qrPayload, expiresAt }
/api/v1/pairing/accept       POST  { code }
/api/v1/pairing/scan         POST  { token }
/api/v1/pairing/resolve      POST  { data }
/api/v1/pairing              DELETE
/api/v1/chat/conversations           GET
/api/v1/chat/conversations/:id/messages   GET  POST
/api/v1/chat/conversations/:id/read        POST
/api/v1/chat/messages/:id/reactions        POST
/api/v1/chat/messages/:id                  DELETE
/api/v1/chat/quick-replies                 GET
/api/v1/chat/partner                       GET
/api/v1/calls                    GET   POST { kind }
/api/v1/calls/:callId/end        POST
/api/v1/notes                    GET   POST { title, body, category }
/api/v1/notes/:id                PATCH DELETE
/api/v1/settings                 GET   PATCH
/api/v1/devices                  POST  DELETE /:deviceId
/api/v1/home                     GET   everything the home screen needs
/img/me.jpg …                    GET   avatars and memory photos
```

---

## If something goes wrong

| Symptom | Fix |
| --- | --- |
| `Could not reach the database at …` | The Supabase project is paused → restore it. The password is wrong → reset it in *Settings → Database*. The host is `db.<ref>.supabase.co` → switch to the **pooler** host, Render has no IPv6. |
| `relation "users" does not exist` | The schema was not created → run `npm run migrate` locally against the same database. |
| The app shows "Cannot reach the Duora server" | The service is still starting (first boot takes ~1 minute) or `duora.onrender.com` still serves the "Application loading" splash → check the Render logs. |
| Login works but the app stays signed out | `JWT_ACCESS_SECRET` changed between restarts → keep the value stable in Render (the blueprint generates it once). |
