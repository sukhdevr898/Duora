# Environment & secrets setup

Duora has **two** environment files (both gitignored — only `.env.example` is
committed):

```
duora/
├── server/.env    # secrets, database URL, deployment metadata
└── app/.env       # public client config (EXPO_PUBLIC_* only — never put secrets here)
```

The server validates its environment with Zod on boot: an invalid value produces a
readable error instead of a runtime crash.

---

## 1. Server `.env`

```bash
cd duora/server
cp .env.example .env
```

### What is required?

Only **three** values are mandatory. Everything else has a working default.

| Variable | Required? | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | `file:./data/duora.db` (SQLite) or the Supabase connection string (Postgres) |
| `JWT_ACCESS_SECRET` | ✅ | min 16 chars — use 64+ random hex |
| `JWT_REFRESH_SECRET` | ✅ | a **different** random value |
| `NODE_ENV` | optional | `development` (default) / `production` / `test` |
| `PORT` / `HOST` | optional | `4000` / `0.0.0.0` — Render injects `PORT` |
| `ACCESS_TTL` | optional | access-token lifetime, default `30d` |
| `REFRESH_TTL_DAYS` | optional | refresh-token lifetime in days, default `30` |
| `PUBLIC_BASE_URL` | optional | public URL of the deployment — used to build avatar/photo links |
| `CORS_ORIGINS` | optional | comma separated; empty = allow any origin (mobile sends no `Origin`) |
| `SEED_ON_BOOT` | optional | `true` seeds the demo couple on boot (used on Render) |
| `LOG_LEVEL` | optional | `fatal｜error｜warn｜info｜debug｜trace` |
| `REGION` | optional | label shown in the app's server-health screen |
| `APP_VERSION` | optional | version shown in the app |
| `PAIRING_TTL_MINUTES` | optional | lifetime of a 6-character pairing code, default `10` |
| `DB_CONNECT_ATTEMPTS` | optional | retries while the database wakes up, default `12` |
| `DB_CONNECT_DELAY_MS` | optional | delay between retries, default `5000` |
| `DB_FALLBACK` | optional | `none` (default) or `sqlite` to boot with a local file |
| `SUPABASE_URL` | optional | Supabase project URL — enables Supabase Auth |
| `SUPABASE_PUBLISHABLE_KEY` | optional | public key for the auth endpoints |
| `SUPABASE_SECRET_KEY` | optional | server-only key (mirrors new accounts into Supabase Auth) |
| `SUPABASE_JWKS_URL` | optional | derived from `SUPABASE_URL` when empty |

### 1a. Generate the JWT secrets

Run twice — they must differ:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```env
JWT_ACCESS_SECRET="a1b2…first-output…"
JWT_REFRESH_SECRET="c7d8…second-output…"
```

### 1b. Pick the database

**SQLite (default — zero setup, local development)**

```env
DATABASE_URL="file:./data/duora.db"
```

The file lives in `duora/server/data/`. The schema is applied on boot, so there is
nothing else to run.

**Supabase Postgres (production)**

Copy the connection string from
**Supabase → Project Settings → Database → Connection string → URI**:

```env
DATABASE_URL="postgresql://postgres.jfttevfwqonxasoahiby:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

- Use the **pooler** host (`…pooler.supabase.com`). The direct host
  `db.<ref>.supabase.co` is IPv6-only and Render cannot reach it.
- Port `5432` = session pooler (recommended), port `6543` = transaction pooler.
- The database password is the only secret — no anon key or service key is needed,
  because the server talks to Postgres directly with `pg`.

The same schema is applied automatically — `src/db.ts` picks `schema.sql`
(Postgres) or `schema.sqlite.sql` (SQLite) based on the URL scheme.

**Waiting for the database**

On boot the server pings the database and retries (`DB_CONNECT_ATTEMPTS` ×
`DB_CONNECT_DELAY_MS`, default 12 × 5 s) before giving up with a checklist:
wrong password, paused project, missing pooler host. Set `DB_FALLBACK=sqlite`
if the server should boot with a local file when Postgres is unreachable.

### 1c. Supabase Auth (optional)

```env
SUPABASE_URL="https://jfttevfwqonxasoahiby.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_…"
SUPABASE_SECRET_KEY="sb_secret_…"          # server only — never in the app
SUPABASE_JWKS_URL="https://jfttevfwqonxasoahiby.supabase.co/auth/v1/.well-known/jwks.json"
```

- The API accepts a **Supabase access token** on every protected route (RS256,
  verified with the JWKS, issuer `…/auth/v1`, audience `authenticated`).
- `POST /api/v1/auth/login` falls back to Supabase Auth when the local password
  does not match — the account is then created locally.
- `POST /api/v1/auth/register` mirrors the account into Supabase Auth.

Without these variables the server keeps its own email + password auth.

### 1d. Seed the demo couple (optional)

```bash
cd duora/server
npm install
npm run setup       # checks the env, prints what to paste into Render, creates the schema
npm run seed        # sukhdev@duora.app / love1234 · ruhi@duora.app / love1234
npm run dev
```

Success looks like:

```
database connection ready (driver: postgres, target: aws-0-ap-south-1.pooler.supabase.com:5432/postgres)
schema ready (28 statements)
Duora server ready → http://0.0.0.0:4000
```

Verify:

```bash
curl http://127.0.0.1:4000/api/v1/health
curl -X POST http://127.0.0.1:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"sukhdev@duora.app","password":"love1234"}'
```

---

## 2. App `.env`

```bash
cd duora/app
cp .env.example .env
```

| Variable | Required? | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | optional | overrides the API base URL — everything else is derived from it |

Resolution order in `src/api/client.ts`:

1. `EXPO_PUBLIC_API_URL` (dev/build env) — wins, handy for a laptop on your LAN.
2. `expo.extra.apiUrl` in `app.json` — baked into a published build.
3. `https://duora.onrender.com` — the live deployment (the default).

The WebSocket endpoint is derived from the same base URL, so there is nothing else
to configure.

```env
# production (default — you can simply leave this unset)
EXPO_PUBLIC_API_URL="https://duora.onrender.com"

# local server, Android emulator
EXPO_PUBLIC_API_URL="http://10.0.2.2:4000"

# local server, physical device on the same Wi-Fi
EXPO_PUBLIC_API_URL="http://192.168.1.20:4000"
```

> Never put a secret in the app bundle: everything prefixed with `EXPO_PUBLIC_` is
> inlined into the JS bundle and is readable by anyone who has the app.

---

## 3. Production deployment

| | |
| --- | --- |
| API base URL | `https://duora.onrender.com` |
| Health | `https://duora.onrender.com/health` · `/api/v1/health` |
| Realtime | `wss://duora.onrender.com/socket.io` |
| Accounts | `sukhdev@duora.app / love1234` · `ruhi@duora.app / love1234` |

Environment for the Render web service (see [`render.yaml`](../render.yaml)):

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres.…@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
JWT_ACCESS_SECRET=…                    # generated by Render
JWT_REFRESH_SECRET=…                   # generated by Render
PUBLIC_BASE_URL=https://duora.onrender.com
ACCESS_TTL=1h
REFRESH_TTL_DAYS=30
SEED_ON_BOOT=true
LOG_LEVEL=info
REGION=Singapore · ap-southeast
DB_CONNECT_ATTEMPTS=12
DB_CONNECT_DELAY_MS=5000
```

`DATABASE_URL` is the **only** value you paste in — the blueprint
([`render.yaml`](../render.yaml)) marks it `sync: false`, so Render prompts for it
while creating the blueprint. Everything else is either fixed or generated.

The free tier sleeps after 15 minutes idle; the first request wakes it in ~30 s.
The app shows “Reconnecting”, retries in the background and switches to
“Connected” on its own.

---

## 4. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Server exits with “Invalid environment configuration” | a variable failed Zod validation | the error lists the offending keys — fix them in `.env` |
| App says “Cannot reach the Duora server” | `EXPO_PUBLIC_API_URL` points at a host your device cannot see | use the LAN IP for phones, `10.0.2.2` for the Android emulator |
| App says “The server is waking up — try again in a moment” | Render answered with its loading page while the instance boots | wait a few seconds; the heartbeat retries automatically |
| Login returns “Email or password is wrong” | the demo couple was never seeded | run `npm run seed`, or set `SEED_ON_BOOT=true` on Render |
| Avatars / photos 404 | `PUBLIC_BASE_URL` is wrong | set it to the public URL of the deployment |
| `tsconfig.json(5,25): error TS5108` | a TypeScript 7 compiler with the legacy `node10` resolution | `duora/server/tsconfig.json` uses `module`/`moduleResolution: Node16` — pull the latest |
| `Could not reach the database at …` | wrong password, paused Supabase project, or the IPv6-only direct host | restore the project, reset the password, switch to the pooler host |
| `relation "users" does not exist` | the schema was never applied to that database | `DATABASE_URL=… npm run migrate` |
| `password authentication failed for user "postgres"` | the password in `DATABASE_URL` is not the current one | reset it in Supabase → Settings → Database and update the env var |
