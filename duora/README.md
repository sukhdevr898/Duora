# Duora — _Two hearts. One private space._

Private 2-person communication: Expo Android app + lightweight Node server. Built for **personal use** — minimal server load, runs happily on **Render free tier**.

> ✅ One-click deploy: [`render.yaml`](../render.yaml) (server + Postgres, free tier) → see [Deployment guide](docs/deployment.md#0-quickest-path-render-blueprint-recommended).

## Repository layout

```
duora/
├── app/      Expo SDK 57 · RN 0.86 · TypeScript strict · Expo Router
├── server/   Express + Socket.IO + Prisma/PostgreSQL (lightweight, ~120MB Alpine image)
├── docs/     architecture, API, WebSocket, deployment (incl. Render)
└── render.yaml  Blueprint for one-click Render deploy
```

## Start locally (under 5 minutes)

```bash
# 1. Backend
cd duora/server
cp .env.example .env            # only DATABASE_URL + 2 JWT secrets needed
npm install
npx prisma migrate dev
npm run db:seed                 # optional: alice@duora.dev / bob@duora.dev Password123!
npm run dev                     # http://localhost:4000  (health: /health, ready: /ready)

# 2. App (second terminal)
cd duora/app
cp .env.example .env            # 10.0.2.2 → emulator host
npm install
npx expo start                  # Expo Go — all except native calls works
```

Physical device → LAN IP (`192.168.1.x`), Render → `https://*.onrender.com`. Native calling needs a development build — see [`docs/android-build.md`](docs/android-build.md).

### Deploy to Render (personal use, free)

1. Push to GitHub → Render **New → Blueprint → Apply** (reads `render.yaml`)
2. Set `PUBLIC_BASE_URL` to your Render URL in Dashboard → save → redeploy
3. App: `EXPO_PUBLIC_API_BASE_URL="https://<your-service>.onrender.com/api/v1"` → restart expo

Free tier sleeps after 15 min idle (~30s wake); app shows “Reconnecting”.

Full guide: [`docs/deployment.md`](docs/deployment.md).

## What works where

### Expo Go (personal features, lightweight)

Onboarding · auth (register/login/refresh/logout) · SecureStore · pairing (code invite with countdown + QR gen/scan with confirmation) · real-time chat (optimistic send, delivered/read, typing, reply/copy/delete, cursor pagination 40) · SQLite offline outbox with jittered backoff · partner dashboard with real presence · partner note · memories · settings (theme/notifications/privacy) · server settings/diagnostics · update check.

All tuned for low server load: pagination + watermark sync, throttled typing (2.5s), no polling loops, 5-min cleanup job.

### Development build (native calling)

WebRTC audio/video (`RTCView`), mute/speaker/Bluetooth, camera flip/toggle, call state machine (calling→ringing→connecting→connected→reconnecting/ended), ICE restart, foreground service (`microphone|camera|connectedDevice`), full-screen incoming intent, PiP with config-change survival, FCM high-priority push.

See [`docs/expo-go-limitations.md`](docs/expo-go-limitations.md) for honest classification — Expo Go shows an upgrade panel, never fake media.

### Requires infrastructure (optional for personal use)

| Need | When |
|---|---|
| PostgreSQL | Always (local Docker or Render free DB via blueprint) |
| HTTPS/WSS | On Render automatic; locally HTTP OK |
| FCM | **Optional** — without it chat/calls work while apps open; only background alerts need it |
| TURN | **Optional** — STUN default handles home Wi-Fi; enable only for strict mobile NATs |
| SMTP | Optional for password-reset email |

## Lightweight personal tuning

- **Server:** Alpine image (~120MB), 5-min cleanup, 25s socket heartbeat, `LOG_LEVEL=warn` on Render, attachments/TURN off by default, no Redis, single Prisma client.
- **App:** 40-msg pages, watermark reconcile, exponential backoff with jitter, no aggressive polling, SecureStore for secrets, SQLite for offline.
- **Cost:** free tier fits 2-person chat easily; TURN bandwidth is the only variable cost if you add coturn.

## Security (personal)

- bcrypt cost 12, short-lived JWT (15m) + rotated opaque refresh (SHA-256, revocable)
- Auth on every REST + Socket.IO handshake — identity from token, never client body
- Zod on every endpoint/event, 1MB caps, rate limits (gentle for 2 users)
- Single-use short-lived pairing invites (10 min TTL, 5 attempt cap, transactional)
- QR opaque tokens only, idempotent messages (client UUID), redacted logs
- **No E2EE claimed** — HTTPS/WSS + DTLS/SRTP in transit; at-rest is your host's responsibility

## Documentation

- [Architecture](docs/architecture.md) · [API](docs/api.md) · [WebSocket](docs/websocket-events.md) · [Expo Go limits](docs/expo-go-limitations.md) · [Android build](docs/android-build.md) · [Deployment (incl. Render)](docs/deployment.md) · [Configuration](docs/configuration.md) · [Testing](docs/testing.md)
