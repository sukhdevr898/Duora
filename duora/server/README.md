# Duora API

Node.js + TypeScript backend for Duora: **Express 4 REST** + **Socket.IO realtime**, JWT auth,
Zod validation, and a small portable database layer that runs on **SQLite** locally and
**PostgreSQL** on Render. Written for two people, not for a data centre.

```
src/
├── app.ts             Express app (cors, helmet, compression, static /img)
├── index.ts           boot: migrate → optional seed → http + socket.io
├── config/            env (zod) + pino logger
├── db/                portable Db layer + schema.{sqlite,postgres}.sql
├── modules/           auth · users · pairing · chat · calls · notes · settings · home · health · devices
├── websocket/         socket.io server + typed events
├── seed.ts            demo couple, conversation, notes, calls
└── utils/ ids, time helpers
```

## Run it

```bash
cp .env.example .env
npm install
npm run seed      # optional demo data
npm run dev       # http://localhost:4000
```

| Script | What it does |
|---|---|
| `npm run dev` | watch mode (tsx) |
| `npm run build` | `tsc` + copy the SQL schema into `dist/` |
| `npm start` | run the compiled server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run migrate` | apply the schema only |
| `npm run seed` | insert the demo couple / conversation / notes / calls |
| `npm run db:reset` | drop the SQLite file, migrate, seed |

### Database

`DATABASE_URL` decides the driver:

- `file:./data/duora.db` → embedded **SQLite** (`node:sqlite`, no native deps, no install)
- `postgres://…` → **PostgreSQL** via `pg`

Both dialects share the same 16-table schema; the only difference is the SQL file
(`src/db/schema.sqlite.sql` vs `src/db/schema.postgres.sql`). Migrations are idempotent
and run automatically on boot, so a fresh Render deploy is ready immediately.

### Seeded demo couple

| Account | Password | Role |
|---|---|---|
| `sukhdev@duora.app` | `love1234` | you |
| `ruhi@duora.app` | `love1234` | partner |

They are matched (`pr_seed`), share a conversation with history and read receipts,
four memory notes, six call sessions, settings and presence.

## API surface

Base path `/api/v1` — every route except `auth/register`, `auth/login`, `auth/refresh`
and `health` needs `Authorization: Bearer <accessToken>`.

| Group | Endpoints |
|---|---|
| Health | `GET /health`, `GET /api/v1/health` |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| Users | `GET /users/me`, `PATCH /users/me` |
| Pairing | `GET /pairing/status`, `POST /pairing/invitation`, `POST /pairing/accept`, `POST /pairing/scan`, `POST /pairing/resolve`, `DELETE /pairing` |
| Chat | `GET /chat/conversations`, `GET|POST /chat/conversations/:id/messages`, `POST /chat/conversations/:id/read`, `POST /chat/messages/:id/reactions`, `DELETE /chat/messages/:id`, `GET /chat/quick-replies`, `GET /chat/partner` |
| Calls | `GET|POST /calls`, `POST /calls/:callId/end` |
| Notes | `GET|POST /notes`, `DELETE /notes/:id` |
| Settings | `GET|PATCH /settings` |
| Devices | `POST|DELETE /devices` |
| Home | `GET /home` (partner, streak, anniversary, moments, love stats) |
| Media | `GET /img/:file` (avatars + memory photos) |

## Realtime

Socket.IO on the same port, authenticated with the access token.

| Event | Direction | Payload |
|---|---|---|
| `presence:ping` / `presence:update` | ⇄ | online state + last seen |
| `message:send` / `message:new` / `message:status` | ⇄ | chat messages + delivered/read receipts |
| `typing:set` | ⇄ | typing indicator |
| `pairing:accepted` / `pairing:matched` | → | pairing lifecycle |
| `call:invite` / `call:incoming` / `call:ended` | ⇄ | call lifecycle |

## Deploy to Render

1. Push the repo.
2. Render → **New → Blueprint** → pick the repo → **Apply** (reads [`../render.yaml`](../render.yaml)).
   The blueprint builds the [Dockerfile](./Dockerfile), creates a managed PostgreSQL and
   wires `DATABASE_URL` for you.
3. `PUBLIC_BASE_URL` is set from the service URL, so avatars/photos resolve correctly.
4. Point the app: `EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com`.

Manual Docker build:

```bash
docker build -t duora-server .
docker run -p 4000:4000 -e DATABASE_URL=file:./data/duora.db duora-server
```

The free tier sleeps after 15 minutes of inactivity; the first request after that takes
roughly 30 seconds to wake the service (the app shows “Reconnecting” meanwhile).
