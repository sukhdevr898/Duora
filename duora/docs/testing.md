# Testing

Duora is verified with **type checks**, a **live API end-to-end run** and a
**web-export UI walkthrough** that drives the real app in a headless browser against
a running server. Everything below has actually been executed.

## 1. Static checks

```bash
cd duora/server && npm run typecheck    # tsc --noEmit (TypeScript 7)
cd duora/app    && npx tsc --noEmit     # strict type check of the app
cd duora/server && npm run build        # → dist/index.js + dist/db/*.sql
```

Both projects must be clean before anything else is considered.

## 2. API end-to-end

The server runs against a real database (SQLite locally, PostgreSQL on Render) and
the script exercises every REST route:

```bash
cd duora/server && npm run seed && npm run dev      # :4000
node api_e2e.mjs http://127.0.0.1:4000               # 49 assertions
```

| Area | What it proves |
| --- | --- |
| health | service + database + services list |
| auth | wrong password rejected, login, **two logins in the same second**, refresh rotation, reuse of a used token rejected, protected route needs a token |
| pairing | invitation + QR payload, QR resolve, unknown code rejected, accept by code, both sides matched, double accept blocked |
| chat | conversation list, history, send + persist, partner sees it, reaction, hide, quick replies, read receipts, partner profile |
| notes | list, create, update, delete |
| calls | history, start, end |
| settings | read, patch, persistence, restore |
| devices | push-token registration |
| profile | `PATCH /users/me` |
| home | partner, streak, anniversary, moments |

## 3. UI walkthrough (web export of the RN app)

The Expo app is exported for the browser and driven with a headless Chromium — the
same React Native code that ships in the APK:

```bash
cd duora/app
EXPO_PUBLIC_API_URL=http://127.0.0.1:4000 npx expo export --platform web
# serve app/dist on :8099, then run the walkthrough script
```

The script signs in, then walks: **Home → Chat → conversation (send a real message)
→ Notes (create a real note) → Calls → Settings → Appearance (light/dark) →
Pairing → Server health → Home**, taking a screenshot at every step and failing if
the message or the note does not appear in the DOM.

Expected result: every step passes, the server screen reports *Connected* with the
live endpoint, and the only console entry is a single `401` from a stale session in
the browser's storage.

## 4. Production-configured build

```bash
cd duora/app && npx expo export --platform web --output-dir dist-prod
grep -o "duora.onrender.com" dist-prod/_expo/static/js/web/*.js
```

The bundle must contain the live URL — the app ships pointing at the deployed API.
With the server unreachable the app shows *"Cannot reach the Duora server"* and
retries on its own; it must never crash or clear the stored session.

## 5. Manual test plan — Android device

1. `npx expo start` → open in Expo Go (or a development build).
2. Sign in with the seeded account; the home screen must show the partner, the
   streak, the anniversary and the moments from the database.
3. Chat: send a message, see it on the partner's device, react, read receipts.
4. Notes: create a memory, it appears in the grid and on the home carousel.
5. Pairing: generate the 6-character code, scan the QR, confirm the matched state.
6. Appearance: light / dark / system + the four love accents, persisted across a
   restart and synced to the server.
7. Server health: the pill shows *Connected · xx ms*; force the server offline and
   confirm the app switches to *Reconnecting* and recovers on its own.

## Regression expectations per change

- Server: `typecheck` + `npm run build` green, and the API end-to-end run passes.
- App: `tsc --noEmit` green and `npx expo export --platform web` succeeds; walk the
  touched screen in the web export before shipping.
- Docs: keep [deployment.md](./deployment.md), [configuration.md](./configuration.md)
  and [api.md](./api.md) in sync with the code.

## Honest status

Type checks, the production build, the 49-assertion API run and the full UI
walkthrough have been executed against the real server and pass. Two-device
WebRTC, FCM push and PiP behaviour cannot be executed in this environment and are
listed in [android-build.md](./android-build.md) as hardware checks rather than
claimed as passing.
