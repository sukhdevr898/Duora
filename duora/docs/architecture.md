# Duora architecture

Duora is a monorepo with two deployables plus shared documentation:

```
duora/
├── app/      React Native + Expo (SDK 57) Android client, TypeScript, Expo Router
├── server/   Node.js + TypeScript API and real-time service (Express, Socket.IO, Prisma)
└── docs/     Architecture, API and operational documentation
```

## High-level topology

```
┌──────────────────────┐        HTTPS / WSS (TLS in production)
│  Duora Android app   │ ───────────────────────────────────────┐
│  (Expo Router, RN)   │                                        │
│                     │  REST /api/v1/*      Socket.IO           │
│  SQLite local cache │ ───────────────────► ┌───────────────────▼──────────────┐
│  SecureStore secrets│                      │ Node.js service (server/)        │
│  react-native-webrtc│ ◄──── signaling ──── │ Express + Socket.IO              │
└─────────────────────┘                      │ Prisma ─► PostgreSQL             │
        │                                    │ Firebase Admin ─► FCM (optional)  │
        │  STUN/TURN (media never transits   │ coturn REST creds (short-lived)   │
        └──────────────► peer WebRTC ◄───────└───────────────────────────────────┘
                 (direct media; TURN relay only when required)
```

**Media never flows through Node.js.** The server only exchanges SDP/ICE signaling
and mints short-lived TURN credentials. Audio/video travels peer-to-peer via
WebRTC, relayed through TURN only when NAT traversal demands it.

## Client (`app/`)

### Layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| Routes | `app/app/**` | Expo Router file-based routes, screens only |
| Components | `app/src/components` | Reusable Duora design-system components |
| Feature modules | `app/src/features/*` | API clients, socket logic, call/WebRTC coordinator, sync engine |
| State | `app/src/state` | Zustand stores (auth, pairing, chat, call, network, settings) |
| Persistence | `app/src/database`, `repositories` | SQLite (messages, outbox, drafts, memories), SecureStore (secrets) |
| Services | `app/src/services` | HTTP client, authenticated socket, diagnostics, secure storage |
| Theme | `app/src/theme` | Centralized tokens, light/dark ThemeProvider |

### Data flow — chat

1. Outgoing messages are rendered optimistically with a client-generated UUID.
2. The socket emits `message_send` with an acknowledgement; the server persists
   to PostgreSQL **before** acknowledging, enforcing idempotency on
   `(conversationId, clientMessageId)`.
3. Acknowledged messages replace the optimistic row and are cached in SQLite.
4. Offline sends land in the SQLite outbox and are retried with bounded
   exponential backoff + jitter after reconnect, then de-duplicated by id.
5. Reconnect reconciliation uses a timestamp watermark (`/sync?since=`) instead
   of re-downloading the conversation. First page is 40 messages; older pages
   load on demand via cursor pagination.

### Data flow — calls

1. A durable `CallSession` row is created through REST (`POST /calls`).
2. Signaling (`call_invite`, SDP offer/answer, ICE) traverses the authenticated
   socket; every relay is authorized against the call's participants.
3. `CallCoordinator` (`features/calling/CallCoordinator.ts`) is the single
   source of truth for the `RTCPeerConnection`, tracks and call phase. Screens
   render `useCallStore`; navigation never duplicates a session.
4. The phase (`calling → ringing → connecting → connected → reconnecting/ended`)
   only becomes `connected` when the WebRTC `connectionState` is `connected`.
5. ICE restarts handle network changes; after 3 failed restarts the call fails.

### Runtime classification

`features/calling/runtime.ts` detects Expo Go (`ExecutionEnvironment.StoreClient`)
and lazy-requires `react-native-webrtc` only outside Expo Go, so the same JS
bundle runs in Expo Go for all supported features and shows an honest upgrade
panel for calling. See [expo-go-limitations.md](./expo-go-limitations.md).

## Server (`server/`)

### Modules

```
src/
├── app.ts, server.ts        Express factory + bootstrap/graceful shutdown
├── config/                  Validated environment (zod), structured logger
├── middleware/              JWT auth, zod validation, errors, rate limiters
├── modules/
│   ├── auth/                register/login/refresh/logout/reset, bcrypt + JWT
│   ├── users/               profile, settings, soft account deletion
│   ├── pairing/             invitations, verify/accept, unpair
│   ├── chat/                messages, pagination, receipts, deletes, sync
│   ├── calls/               call state machine, TURN credential minting
│   ├── presence/            online + durable last-seen
│   ├── push/                FCM via Firebase Admin (optional, fail-open)
│   └── devices/             push token registration
├── websocket/               Authenticated Socket.IO gateway + event handlers
├── database/                Prisma client singleton
├── services/                Shared domain logic (pairing/conversation authz)
└── jobs/                    Stale invitation / missed-call / session cleanup
```

### Identity and sessions

- Access JWTs are short-lived (default 15 minutes); refresh tokens are opaque,
  stored only as SHA-256 hashes in `RefreshSession`, rotated on every refresh
  and revocable on logout/account deletion.
- Every protected HTTP request and the Socket.IO handshake derive the user
  identity from the verified token — never from a request body.

### Why PostgreSQL (not in-memory maps)

Users, pairings, messages, receipts, call sessions, devices and settings are
durable Prisma models with foreign keys, unique constraints and indexes.
Socket connection registry is process-local by design (ephemeral transport
state); multi-instance deployments swap in the Socket.IO Redis adapter without
changing the domain model.

## Failure and honesty principles

- "Online" for the partner comes from presence events, never from the local
  socket being connected.
- Update checks, push and pairing fetches fail open — they never block startup.
- No feature claims E2EE: transport is HTTPS/WSS; at-rest database encryption
  is an operator responsibility documented in [deployment.md](./deployment.md).
