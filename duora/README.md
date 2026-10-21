# Duora — _Two hearts. One private space._

A private, two-person space: an **Expo (React Native) app** talking to a **Node.js API** —
no dummy data anywhere. The mobile app is a 1:1 port of the premium React UI that lives in
[`ui/`](./ui) (same layout, typography, icons, themes and motion), and every screen is
backed by the real database.

> Deploy the backend with one click: [`render.yaml`](../render.yaml) → Render **New → Blueprint → Apply**.

## Repository layout

```
duora/
├── app/      Expo SDK 57 · RN 0.86 · expo-router · TypeScript strict  ← the mobile app
├── server/   Express 4 + Socket.IO + JWT + zod + SQLite/Postgres        ← the API
├── ui/       Premium React UI (Vite) — the design reference the app mirrors
├── docs/     architecture, API, WebSocket, deployment notes
└── render.yaml   Blueprint: web service (Docker) + managed PostgreSQL
```

## Start locally (under 5 minutes)

### 1. Backend

```bash
cd duora/server
cp .env.example .env          # DATABASE_URL + 2 JWT secrets are enough
npm install
npm run seed                  # demo couple: sukhdev@duora.app / love1234
npm run dev                   # http://localhost:4000  (health: /health)
```

The server runs on **SQLite** by default (`file:./data/duora.db`) and switches to
**Postgres** automatically when `DATABASE_URL` starts with `postgres://`.
The schema is applied on boot, so there is no separate migration command.

### 2. App

```bash
cd duora/app
npm install
npx expo start                   # → https://duora.onrender.com (production API)
```

The app ships pointing at the live deployment **`https://duora.onrender.com`** — no
environment variable needed. To run against your own server, set
`EXPO_PUBLIC_API_URL` (see [`app/.env.example`](./app/.env.example)):

- Android emulator → `http://10.0.2.2:4000`
- Physical device → your LAN IP (`http://192.168.x.x:4000`)

Sign in with the seeded account **sukhdev@duora.app / love1234** (partner: **ruhi@duora.app / love1234**).

## Deploy to Render (personal use, free)

1. Push to GitHub → Render **New → Blueprint → Apply** (reads [`render.yaml`](../render.yaml)).
2. The blueprint builds [`duora/server/Dockerfile`](./server/Dockerfile), creates a managed
   PostgreSQL and wires `DATABASE_URL` automatically.
3. Point the app at it: `EXPO_PUBLIC_API_URL=https://duora.onrender.com`.

The free tier sleeps after 15 minutes idle (~30 s wake-up). The app shows
“Reconnecting” while the server wakes — the `ConnectionPill` and the Server-health
screen reflect the live state, and a background heartbeat retries every few seconds
until the service answers again.

### Production API

| | |
|---|---|
| Base URL | `https://duora.onrender.com` |
| Health | `https://duora.onrender.com/health` · `/api/v1/health` |
| Realtime | `wss://duora.onrender.com/socket.io` |
| Accounts | `sukhdev@duora.app / love1234` · `ruhi@duora.app / love1234` |

The service is built from [`server/Dockerfile`](./server/Dockerfile) with
**TypeScript 7** (`module`/`moduleResolution: Node16`), so the image compiles on
Render's builder.

## What the app does

| Area | Screen | Backed by |
|---|---|---|
| Home | partner hero, streak, action tiles, quote, moments, anniversary, love stats | `GET /api/v1/home` |
| Chat | conversations, search, specials, full conversation with stickers, reactions, receipts | `/api/v1/chat/*` + Socket.IO |
| Notes | memory grid, filters, create/detail sheets | `/api/v1/notes` |
| Calls | call hero, weekly stats, filters, call history, start/end calls | `/api/v1/calls` |
| Settings | profile, sections, appearance, server health, pairing, sign out | `/api/v1/settings`, `/api/v1/users/me` |
| Pairing | 6-character code, QR show, camera scan, matched celebration | `/api/v1/pairing/*` |

Themes follow the system or an explicit choice (light / dark / system), with the four
love accents (violet, rose, sunset, mint) and the rose **love mode** — exactly like the
web UI, persisted locally and synced to the server so both devices agree.

## Scripts

```bash
npm run dev:server      # API with watch mode
npm run build:server    # tsc + copy the SQL schema into dist/
npm run seed:server     # reseed the demo couple
npm run dev:app         # Expo dev server
npm run export:web      # static web build of the app (used for visual QA)
npm run typecheck:app   # tsc --noEmit for the app
npm run typecheck:server
```

## Security notes

- bcrypt password hashing, JWT access tokens + rotating refresh tokens.
- Every REST route and the Socket.IO handshake are authenticated — identity always
  comes from the token, never from the request body.
- Zod validation on every payload, 1 MB body cap, single-use pairing invites
  (10-minute TTL) and opaque QR tokens.
- Avatars and memory photos are served by the API itself (`/img/…`), so the client
  never depends on a third-party CDN.

## Documentation

- [Server & API](server/README.md) · [Architecture](docs/architecture.md) ·
  [API reference](docs/api.md) · [WebSocket events](docs/websocket-events.md) ·
  [Deployment](docs/deployment.md) · [Android build](docs/android-build.md)
