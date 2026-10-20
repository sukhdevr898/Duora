# Environment & secrets setup

Duora has **two** `.env` files (both are gitignored — only `.env.example` is
committed):

```
duora/
├── server/.env    # secrets, database URL, Firebase, TURN
└── app/.env       # public client config (EXPO_PUBLIC_* only — never put secrets here)
```

The server validates its environment with Zod on boot: a missing required
variable produces a readable error instead of a runtime crash.

---

## 1. Server `.env`

```bash
cd server
cp .env.example .env
```

### What is actually required?

Only **three** values are mandatory. Everything else has a working default or
degrades gracefully (push is skipped, TURN falls back to STUN-only).

| Variable | Required? | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ | min 16 chars, use 64+ random hex |
| `JWT_REFRESH_SECRET` | ✅ | a **different** random value |
| `FIREBASE_*` | optional | needed only for background push |
| `TURN_SECRET` / `TURN_URLS` | optional | needed for calls across restrictive NATs |
| all others | optional | sensible defaults in `.env.example` |

### 1a. Generate the JWT secrets

Run twice (once per secret — they must differ):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the two outputs into `.env`:

```env
JWT_ACCESS_SECRET="a1b2…first-output…"
JWT_REFRESH_SECRET="c3d4…second-output…"
```

### 1b. Get a `DATABASE_URL`

The format is always:

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

Pick **one** of the three options below.

#### Option A — Docker (fastest local setup)

```bash
docker run --name duora-postgres \
  -e POSTGRES_USER=duora \
  -e POSTGRES_PASSWORD=duora \
  -e POSTGRES_DB=duora \
  -p 5432:5432 -d postgres:16
```

Then:

```env
DATABASE_URL="postgresql://duora:duora@localhost:5432/duora?schema=public"
```

#### Option B — PostgreSQL installed natively

```bash
# macOS
brew install postgresql@16 && brew services start postgresql@16
createdb duora
```

```bash
# Ubuntu/Debian
sudo apt install postgresql
sudo -u postgres createuser --pwprompt duora   # prompts for a password
sudo -u postgres createdb -O duora duora
```

```env
DATABASE_URL="postgresql://duora:YOUR_PASSWORD@localhost:5432/duora?schema=public"
```

#### Option C — free cloud database (no local install)

Sign up, create a Postgres project, and copy the connection string:

- **Neon** (neon.tech) → New project → "Connection string" tab. Append
  `?sslmode=require` if not present. Use the **direct** (non-pooled) string
  for `prisma migrate`.
- **Supabase** → Project → Settings → Database → Connection string → URI,
  replace `[YOUR-PASSWORD]` with the DB password you set at creation.
- **Railway / Render** → add a PostgreSQL service → copy the provided
  `DATABASE_URL` variable verbatim.

```env
DATABASE_URL="postgresql://duora:password@ep-cool-name-12345.us-east-2.aws.neon.tech/duora?sslmode=require"
```

### 1c. Apply the schema

Once `DATABASE_URL` is set:

```bash
cd server
npm install
npx prisma migrate deploy     # applies prisma/migrations/20261019000000_init
npm run db:seed               # optional demo couple (alice/bob, Password123!)
npm run dev
```

Success looks like:

```
Database connection established
Duora server listening on :4000 (development)
```

Verify: `curl http://localhost:4000/health` → `{"status":"ok",…}` and
`curl http://localhost:4000/ready` → database `up`.

### 1d. Firebase credentials (only for push notifications)

1. Go to <https://console.firebase.google.com> → create (or open) a project.
2. Add an Android app with package name **`com.duora.app`**.
3. Gear icon → **Project settings** → **Service accounts** tab →
   **Generate new private key** → a JSON file downloads. Keep it out of git.

Then choose **one** of two ways to configure it:

**Way 1 — point at the JSON file (recommended for local dev):**

```env
FIREBASE_SERVICE_ACCOUNT_PATH="/absolute/path/to/duora-firebase-adminsdk.json"
```

**Way 2 — split the JSON into env vars (needed for most cloud hosts):**

Open the JSON and copy three fields. The private key is multiline; inside
`.env` keep it on one line with literal `\n` sequences (the server converts
them automatically):

```env
FIREBASE_PROJECT_ID="duora-1a2b3"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xyz@duora-1a2b3.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv…\n…\n-----END PRIVATE KEY-----\n"
```

Without any Firebase config the server logs a warning once and simply skips
push sends — sockets, auth and chat all keep working.

### 1e. TURN secret (only for calls across strict NATs)

STUN (Google's default in `.env.example`) needs no account and works for most
home Wi-Fi. Add TURN when testing between mobile networks/carrier-grade NAT.
See [android-build.md](./android-build.md) for installing coturn, then:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```env
TURN_SECRET="paste-the-random-hex-here"
TURN_URLS="turn:turn.yourdomain.com:3478,turns:turn.yourdomain.com:5349"
```

The server turns this into short-lived per-user credentials; the permanent
secret is never sent to the app.

### Minimal working local `server/.env`

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://duora:duora@localhost:5432/duora?schema=public"
PUBLIC_BASE_URL="http://10.0.2.2:4000"
CORS_ORIGINS=""
JWT_ACCESS_SECRET="run-node-command-above-paste-here"
JWT_REFRESH_SECRET="run-node-command-again-paste-different-value-here"
LOG_LEVEL=info
```

---

## 2. App `.env`

```bash
cd app
cp .env.example .env
```

Only variables prefixed `EXPO_PUBLIC_` are exposed to the app, and they are
**inlined into the bundle at build time** — after changing them you must
restart `npx expo start`. Never put server secrets here; anything in this file
ships inside the APK.

### The networking rule (the important part)

`localhost` on an Android device means *the device itself*, not your computer.

| Where the app runs | `EXPO_PUBLIC_API_BASE_URL` / `WS_URL` host |
| --- | --- |
| Android emulator on your computer | `10.0.2.2` (Android's alias for the host machine) |
| Physical phone, same Wi-Fi as your computer | your computer's **LAN IP**, e.g. `192.168.1.20` |
| Deployed server | your public `https://` domain |

Find your LAN IP:

```bash
# macOS / Linux
ip addr show | grep "inet " | grep -v 127.0.0.1
# Windows
ipconfig        # look for "IPv4 Address"
```

Also allow port 4002 through your OS firewall (the server already listens on
all interfaces via `httpServer.listen(PORT)`).

### Configurations

**Emulator (defaults work as-is):**

```env
EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:4000/api/v1"
EXPO_PUBLIC_WS_URL="http://10.0.2.2:4000"
EXPO_PUBLIC_ENV="development"
```

**Physical device over LAN:**

```env
EXPO_PUBLIC_API_BASE_URL="http://192.168.1.20:4000/api/v1"
EXPO_PUBLIC_WS_URL="http://192.168.1.20:4000"
EXPO_PUBLIC_ENV="development"
```

**Production (HTTPS is mandatory — Socket.IO upgrades to WSS automatically):**

```env
EXPO_PUBLIC_API_BASE_URL="https://api.yourdomain.com/api/v1"
EXPO_PUBLIC_WS_URL="https://api.yourdomain.com"
EXPO_PUBLIC_ENV="production"
EXPO_PUBLIC_EAS_PROJECT_ID="your-expo-project-id"
```

Get the EAS project id from <https://expo.dev> (create a project, then
`eas init`), or run `eas init` inside `app/`. It enables Expo push tokens;
for standalone FCM delivery also upload the FCM key under your Expo project's
credentials page.

`EXPO_PUBLIC_VERSION_ENDPOINT` can stay empty — the app then calls the
server's built-in `/api/v1/app/version` contract.

---

## 3. Verify the whole chain

1. Server: `curl http://localhost:4000/ready` → `{"status":"ready","database":"up"}`.
2. App: open **Settings → Server settings → Test connection** — reachability,
   socket state and auth status are shown separately.
3. Register a user in the app, then check the row landed in Postgres:

```bash
# Docker example
docker exec -it duora-postgres psql -U duora -d duora -c "SELECT email, \"displayName\" FROM users;"
```

4. **Developer info → Run diagnostics / Export redacted report** for a
   shareable, secret-free snapshot when troubleshooting.

## 4. Rules of thumb

- Never commit `.env`, `*-serviceAccount*.json`, or `google-services.json`
  (all already in `.gitignore`).
- On cloud hosts (Railway, Render, Fly, EAS Build) set the same server
  variables in the dashboard's *environment variables* screen instead of a
  file; for EAS use `eas secret:create`.
- Rotate a leaked secret immediately: replace it in `.env`, restart the
  server (JWTs re-sign; refresh sessions can be revoked by deleting the
  `refresh_sessions` table contents).
- A reachable server does not prove auth/chat/push work individually — use the
  in-app Server Settings and Developer Info screens, which report each
  subsystem separately.
