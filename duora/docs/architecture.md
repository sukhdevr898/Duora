# Duora architecture

Duora is a small monorepo with two deployables plus shared documentation:

```
duora/
├── app/      React Native + Expo (SDK 57) Android client, TypeScript, Expo Router
├── server/   Node.js + TypeScript API and real-time service (Express, Socket.IO)
├── ui/       Premium React UI (Vite) — the design reference the app mirrors
└── docs/     Architecture, API and operational documentation
```

## High-level topology

```
┌──────────────────────┐        HTTPS / WSS (TLS in production)
│  Duora Android app   │ ───────────────────────────────────────┐
│  (Expo Router, RN)   │                                        │
│                     │  REST /api/v1/*      Socket.IO           │
│  SecureStore secrets│ ───────────────────► ┌───────────────────▼──────────────┐
│  design system      │                      │ Node.js service (server/)        │
└─────────────────────┘                      │ Express + Socket.IO              │
                                             │ node:sqlite  |  Supabase Postgres│
                                             │ media served from /img/…         │
                                             └───────────────────────────────────┘
```

The server is the single source of truth: every screen in the app renders data that
came from the database through this API. Avatars and memory photos are served by the
API itself (`/img/…`), so the client never depends on a third-party CDN.

## Client (`app/`)

### Layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| Routes | `app/app/**` | Expo Router file-based routes, screens stay thin |
| Components | `app/src/components` | Duora design system (buttons, sheets, avatars, stickers, QR, brand) |
| API | `app/src/api` | typed REST client (`client.ts`) + models (`types.ts`) |
| State | `app/src/state/store.ts` | one store: session, home, chat, notes, calls, pairing, settings, server health |
| Theme | `app/src/theme` | tokens, fonts, `ThemeProvider` (light/dark/system + 4 love accents + love mode) |
| Data | `app/src/data` | settings section catalogue |

### Data flow — chat

1. The composer calls `api.sendMessage(conversationId, clientMessageId, text, sticker?)`.
2. The server validates the payload (zod), persists it and broadcasts `message:new`
   over Socket.IO — the optimistic bubble is replaced by the stored row.
3. History is read with `GET /api/v1/chat/conversations/:id/messages?limit=80`;
   receipts and reactions ride along with each message.
4. Presence (`Active now`) comes from the Socket.IO presence events, never from a
   local timer.

### Data flow — pairing

1. `POST /api/v1/pairing/invitation` creates a 6-character code (10-minute TTL) and
   an opaque QR token; both are stored server-side.
2. The partner enters the code (`POST /api/v1/pairing/accept`) or scans the QR
   (`POST /api/v1/pairing/scan`); both are single use.
3. On success the server links the two users, creates the conversation and emits
   `pairing:matched` — both apps flip to the matched state.

### Connection handling

- Every request carries a 30 s budget (`AbortController`); a Render instance that is
  asleep answers with a loading page, which the client reports as *“the server is
  waking up”* instead of crashing.
- A background heartbeat pings `/api/v1/health` every 8 s while the server is down
  and every 30 s when it is healthy — the `ConnectionPill` and the Server-health
  screen always reflect reality.
- A 401 triggers exactly one refresh + replay (single-flight); a transport failure
  never clears the stored session.

## Server (`server/`)

### Modules

```
src/
├── index.ts        bootstrap: wait for the database → migrate → seed → listen
├── app.ts          the Express app, middleware and the route table
├── env.ts          validated environment (zod) + the pino logger
├── db.ts           the data layer (Postgres | SQLite), the retry loop, migrations
├── auth.ts         JWT helpers + the `requireAuth` guard
├── http.ts         zod request validation, error and not-found handlers
├── realtime.ts     authenticated Socket.IO gateway + event catalogue
├── seed.ts         demo couple, conversation, notes, pairing code
├── util.ts         ApiError, asyncHandler, ids, timestamps
├── schema.sql      the Postgres schema (Supabase)
├── schema.sqlite.sql  the same schema for local SQLite
└── routes/         one file per feature — routes, validation and SQL together
    ├── auth.ts     register/login/refresh/logout/me (bcrypt + JWT)
    ├── users.ts    profile and the public user shape
    ├── pairing.ts  invitations, accept by code / QR token, unlink
    ├── chat.ts     conversations, messages, receipts, reactions, quick replies
    ├── calls.ts    call log, start/end calls
    ├── notes.ts    memories (CRUD)
    ├── settings.ts user settings (theme, accent, notifications…)
    ├── devices.ts  push token registration
    └── system.ts   health payload, the home payload and the bootstrap route
```

One file per feature keeps the server easy to follow: the route, its validation
and its SQL sit next to each other, and there is no service/schema/route
trio to jump between.

### Identity and sessions

- Access JWTs carry the user id, email and display name; refresh tokens are
  **single use** — every refresh rotates the token, revokes the old session row and
  stores only its SHA-256 hash. Every token carries a random `jti`, so two sessions
  created in the same second never collide.
- Every protected HTTP request and the Socket.IO handshake derive the identity from
  the verified token — never from a request body.

### Database portability

`src/db.ts` exposes one tiny interface (`one`, `all`, `run`, `exec`, `transaction`,
`ping`) implemented twice: `node:sqlite` for local development and `pg` for
**Supabase Postgres** in production. Placeholders are translated (`?` → `$n`).
The 16-table schema exists twice — `src/schema.sqlite.sql` and `src/schema.sql` —
and is applied on boot by `migrate()`, so a deploy is always schema-correct.

The driver is chosen by the URL scheme: anything starting with `postgresql://`
uses Supabase, anything else is a local SQLite file. On boot the server pings the
database and retries for up to a minute (`DB_CONNECT_ATTEMPTS` ×
`DB_CONNECT_DELAY_MS`) before failing with a checklist of what to check — this
covers the moment when Render starts the service before Supabase has woken up.

### Failure and honesty principles

- “Online” for the partner comes from presence events, never from a local timer.
- Update checks, health pings and pairing fetches fail open — they never block the
  UI.
- No feature claims E2EE: transport is HTTPS/WSS; at-rest database encryption is an
  operator responsibility documented in [deployment.md](./deployment.md).
