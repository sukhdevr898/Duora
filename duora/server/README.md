# Duora Server

Node.js + TypeScript backend for Duora: Express REST API, authenticated
Socket.IO real-time layer, Prisma/PostgreSQL persistence, FCM push, and
short-lived TURN credentials for WebRTC.

## Requirements

- Node.js ≥ 20
- PostgreSQL ≥ 14
- (Optional) Firebase service account for FCM
- (Optional) coturn TURN server

## Setup

```bash
cd server
cp .env.example .env        # fill DATABASE_URL and JWT secrets
npm install
npx prisma migrate dev      # creates the schema (first migration)
npm run db:seed             # optional demo users: alice@duora.dev / bob@duora.dev
npm run dev                 # http://localhost:4000
```

Health checks: `GET /health` (liveness), `GET /ready` (DB readiness).

## Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | tsx watch development server |
| `npm run build` | TypeScript build to `dist/` |
| `npm test` | Vitest suite (mocked Prisma — no database needed) |
| `npm run typecheck` | Strict `tsc --noEmit` |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:deploy` | Apply migrations in production |
| `npm run db:seed` | Demo data |

## Android emulator networking

Inside the Android emulator `localhost` is the emulated device. Use
`http://10.0.2.2:4000` to reach this server. A physical device needs the
computer's LAN IP (e.g. `http://192.168.1.20:4000`) or a deployed HTTPS/WSS URL.

See `../docs/` for the API reference, WebSocket protocol, deployment and
security documentation.
