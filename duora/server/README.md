# Duora Server — lightweight personal edition

Node.js + TypeScript for Duora: Express REST + authenticated Socket.IO, Prisma/PostgreSQL, optional FCM push, optional TURN. Built for **2-person personal use** on Render free tier.

## Requirements (local)

- Node.js 22 (pinned via `.node-version` + `engines`)
- PostgreSQL ≥ 14 (or Neon/Supabase/Render Postgres — see `docs/configuration.md`)
- Firebase / TURN: **optional** — without them chat + calls still work while both apps are open

## One-click Render deploy (personal use)

1. Push repo to GitHub
2. Render → New → Blueprint → pick repo → Apply (reads `render.yaml`)
3. Set `PUBLIC_BASE_URL` to the URL Render gives you → save → redeploy
4. Point app: `EXPO_PUBLIC_API_BASE_URL="https://<your-service>.onrender.com/api/v1"`

Full guide: [`docs/deployment.md`](../docs/deployment.md#0-quickest-path-render-blueprint-recommended)

Free tier sleeps after 15 min idle (~30s wake); app shows “Reconnecting” — normal.

## Local setup (5 min)

```bash
cd server
cp .env.example .env        # only DATABASE_URL + 2 JWT secrets required
npm install
npx prisma migrate dev      # creates schema
npm run db:seed             # optional: alice@duora.dev / bob@duora.dev Password123!
npm run dev                 # http://localhost:4000
curl http://localhost:4000/health && curl http://localhost:4000/ready
```

## Lightweight tuning (personal use)

- Cleanup: every 5 min (was 60s) — saves DB wakeups on free tier
- Socket heartbeat: 25s/30s — fewer packets for 2 users
- Attachments: OFF by default — no disk / bandwidth
- TURN: OFF by default — STUN handles most Wi-Fi
- Logging: `LOG_LEVEL=warn` on Render — less I/O

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | tsx watch |
| `npm run build` | `prisma generate` + tsc → `dist/server.js` |
| `npm test` | Vitest (mocked Prisma, no DB) |
| `npm run typecheck` | strict tsc over src + tests + seed (`tsconfig.test.json`) |
| `npm run prisma:migrate` | dev migration |
| `npm run prisma:deploy` | prod migration (runs on Render start) |
| `npm run db:seed` | demo couple |

## Networking note

Emulator: `http://10.0.2.2:4000` → host. Physical device: your LAN IP (`192.168.1.x`). Render: `https://...onrender.com`.

See `../docs/` for API, WebSocket, and deployment docs.
