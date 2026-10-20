# Duora

**Two hearts. One private space.**

A complete, private two-person communication platform: a React Native + Expo
Android client and a Node.js + PostgreSQL backend, built as one organized
monorepo.

- **Frontend:** Expo SDK 57, React Native 0.86, TypeScript (strict), Expo Router
- **Backend:** Node.js 20, Express, Socket.IO, Prisma + PostgreSQL, Firebase Admin (FCM)
- **Calling:** real WebRTC via `react-native-webrtc` (development builds), short-lived TURN credentials
- **Local data:** SQLite cache/offline outbox, SecureStore for session secrets

## Repository layout

```
duora/
├── app/      Expo Android application (routes in app/app, logic in app/src)
├── server/   Express + Socket.IO API, Prisma schema, migrations, tests
├── docs/     architecture, API, WebSocket protocol, Expo Go limits, builds, deployment, testing
└── package.json   workspace scripts
```

## Start in under five minutes

```bash
# 1. Backend
cd server
cp .env.example .env            # set DATABASE_URL + JWT secrets
npm install
npx prisma migrate dev
npm run db:seed                 # optional: alice@duora.dev / bob@duora.dev (Password123!)
npm run dev                     # http://localhost:4000

# 2. App (separate terminal)
cd app
cp .env.example .env            # 10.0.2.2 works inside the Android emulator
npm install
npx expo start                   # open in Expo Go
```

Physical device? Replace `10.0.2.2` with your computer's LAN IP
(e.g. `http://192.168.1.20:4000`) or a deployed HTTPS URL. Native calling needs
a development build — see [`docs/android-build.md`](docs/android-build.md).

## What works where

### Runs in Expo Go (verified by production bundle)

Onboarding (3 pages, persisted) · register/login/refresh/logout/reset
request · SecureStore sessions · pairing overview, short-lived invitation
codes with countdown, QR generation and QR scanning with confirmation ·
real-time one-to-one chat (optimistic send, pending/sent/delivered/read
states, typing, reply, copy, delete-for-me/everyone, date separators, cursor
pagination) · SQLite offline outbox with bounded jittered backoff and
deduplicated reconnect sync · partner dashboard with real presence/last-seen ·
partner note card from real messages · memories · full settings (theme,
notifications, privacy, low-data) · profile · server settings and diagnostics ·
about/legal · non-blocking update check · notification channels and
permissions.

### Requires a development build (implemented, verified at bundle/manifest level)

Genuine WebRTC audio and video calls · `RTCView` remote/local video ·
mute/speaker/Bluetooth routing · camera flip/toggle · call state machine
(calling → ringing → connecting → connected → reconnecting/ended) · ICE
restart on network change · foreground calling service with typed
`microphone|camera|connectedDevice` permissions · full-screen incoming call
intent · native picture-in-picture with config-change survival · FCM
high-priority incoming-call push.

### Requires your infrastructure/credentials

PostgreSQL · hosting over HTTPS/WSS · Firebase service account for FCM ·
coturn for TURN relay · Play release URL for update enforcement · SMTP
provider for password-reset emails · hosted URLs for avatars.

## Security posture

- bcrypt (cost 12) password hashing; short-lived access JWTs; opaque refresh
  tokens stored only as SHA-256 hashes, rotated and revocable
- Authenticated REST and authenticated Socket.IO handshake; identity always
  derived from the token, never request bodies
- Zod validation on every endpoint and socket event; 1 MB payload caps
- Rate limiters on login, registration, invitations, verification, message
  send and call initiation
- Pairing invitations are single-use, short-lived, attempt-capped and
  completed transactionally server-side; QR codes carry opaque tokens only
- Idempotent message delivery keyed on client UUIDs
- Redacted structured logging; secrets only via environment variables
- **No E2EE is claimed** — transport is HTTPS/WSS + DTLS/SRTP; at-rest
  encryption is an operator responsibility

## Verification results (executed in this environment)

| Check | Command | Result |
| --- | --- | --- |
| Server strict types | `npm --prefix server run typecheck` | ✅ clean |
| Server unit tests | `npm --prefix server test` | ✅ 24/24 passing (4 suites, mocked Prisma) |
| Prisma schema | `npx prisma validate` | ✅ valid |
| App strict types | `npm --prefix app run typecheck` | ✅ clean |
| Expo SDK alignment | `npx expo install --check` | ✅ dependencies up to date |
| Android bundle | `npx expo export --platform android` | ✅ Hermes bundle produced |
| Native prebuild | `npx expo prebuild --platform android` | ✅ manifest includes PiP flags, foreground service, all permissions |

Real two-device WebRTC/FCM/PiP testing cannot run in this environment and is
not claimed as passing — the device checklist lives in
[`docs/testing.md`](docs/testing.md).

## Known limitations

1. Calling, background call services and PiP are implemented for custom
   development builds only; Expo Go intentionally shows an upgrade panel. The
   manifest, config plugin, `RTCView` call screens and the full TypeScript
   `CallCoordinator` are in place; the foreground-service class and the
   `enterPictureInPictureMode` bridge are two thin, explicitly documented
   Kotlin seams inside the generated native project (see
   [docs/android-build.md](docs/android-build.md#native-module-boundary-required-development-build-work)).
2. Push is fully wired but inert until Firebase credentials are configured on
   the server and an EAS/FCM project id is set on the client.
3. Password reset validates and logs server-side; actual email delivery needs
   an SMTP provider (no email service is bundled).
4. Avatar editing accepts hosted image URLs; binary image upload is not part
   of this build (attachment upload scaffolding exists in env/config).
5. Single-service deployment: the socket registry is process-local. Horizontal
   scaling adds the Socket.IO Redis adapter and a Redis rate-limit store
   (documented in [`docs/deployment.md`](docs/deployment.md)).
6. No end-to-end encryption; see the security section above.
7. Ringing after force-stop, revoked permissions or unavailable FCM cannot be
   guaranteed on modern Android versions.

## Documentation

- [Architecture](docs/architecture.md)
- [HTTP API reference](docs/api.md)
- [WebSocket events](docs/websocket-events.md)
- [Expo Go limitations & feature classification](docs/expo-go-limitations.md)
- [Android development builds, FCM & TURN](docs/android-build.md)
- [Deployment](docs/deployment.md)
- [Testing strategy & results](docs/testing.md)

## Note on the pre-existing AmorCall project

No AmorCall repository was present in the provided workspace at project start
(verified by filesystem inspection). Duora was therefore built fresh; if the
AmorCall codebase becomes available, its reusable assets/logic can be migrated
module-by-module against the boundaries documented in
[`docs/architecture.md`](docs/architecture.md).
