# Testing

## Automated tests

### Server (`server/`)

Vitest with Prisma mocked — the suite needs no database and runs in CI.

```bash
cd server
npm test          # one-off run
npm run test:watch
npm run typecheck # strict tsc --noEmit
```

Coverage today (24 tests, 4 files):

| Suite | What it proves |
| --- | --- |
| `tests/auth.test.ts` | Registration hashing, login failure path, refresh-token rotation, revoked-session rejection, logout revocation |
| `tests/pairing.test.ts` | Invitation creation rules, attempt ceiling/lockout, atomic pairing + conversation creation, expired-invitation rejection, unpair guard |
| `tests/chat.test.ts` | Client-message idempotency, receipt creation, conversation authorization, cursor pagination shape, read receipts |
| `tests/http.test.ts` | Health/readiness, update contract semantics, validation errors, bearer-token auth, JSON 404s |

Run against a real database in a staging environment with
`NODE_ENV=test` and a dedicated `DATABASE_URL` to additionally verify
migrations and transactional behavior end-to-end.

### App (`app/`)

```bash
cd app
npx tsc --noEmit                      # strict type check
npx expo install --check              # SDK 57 dependency alignment
npx expo export --platform android    # production Metro/Hermes bundle
npx expo prebuild --platform android  # native project + manifest generation
```

The production bundle and prebuild are part of the definition of done: a
screen that typechecks but fails to bundle is not complete.

## Manual test plan — Expo Go (bucket 1 features)

1. Launch `npx expo start`, open in Expo Go on Android.
2. Onboarding: swipe all three pages, skip, verify it does not reappear after
   relaunch; reset by clearing app data.
3. Register two accounts (two devices or two profiles); login validation,
   wrong-password error, session persistence across restart.
4. Pairing: create invitation, verify countdown, enter code with typo
   (validation), correct code (confirmation dialog), pairing status updates on
   both devices via `pairing_update`. Unpair with confirmation.
5. QR: scan an invalid QR, an expired invitation, then a valid one; confirm
   pairing only completes after the confirmation dialog.
6. Chat: send/receive, typing indicator, pending → sent → delivered → read
   icons, date separators, reply, copy, delete-for-me, delete-for-everyone
   (sender only).
7. Offline: enable airplane mode, send two messages (queued, pending state),
   reconnect — messages drain once, no duplicates, history reconciles.
8. Pagination: load a conversation with >40 messages and scroll up.
9. Theme switching (system/light/dark) persists; all settings toggles persist
   and sync to the server when reachable.
10. Update check: point at a server returning `updateRequired` and verify the
    non-blocking required banner opens the release URL.

## Manual test plan — development build (bucket 2 features)

Requires the custom build from [android-build.md](./android-build.md) and two
physical Android devices.

- [ ] Audio call end-to-end: caller sees Calling → Ringing → Connecting →
      Connected only after the peer connection establishes
- [ ] Decline and cancel paths; missed-call notification when unreachable
- [ ] Mute, speaker, Bluetooth routing, accurate call duration, end call
- [ ] Video call: real remote stream, local preview, flip camera, camera off,
      aspect ratio preserved
- [ ] Foreground service keeps the call alive when the app is backgrounded
- [ ] Full-screen incoming call while locked; answer/decline notification
      actions; notification dismissed on completion
- [ ] PiP: background during video → native PiP with the real remote stream,
      restore keeps state, no duplicate PeerConnection
- [ ] Wi-Fi → mobile-data switch: reconnecting phase, ICE restart, audio
      continuity prioritized; low-data mode reduces video constraints
- [ ] Kill the app mid-call, relaunch: `GET /calls/active` restores or
      correctly reports no open call
- [ ] Force-stop / revoked notification permission: document observed
      behavior; ringing is not guaranteed

## Regression expectations per change

- Server: `typecheck` + full Vitest suite green.
- App: `tsc --noEmit` green and `expo export` succeeds; manually smoke-test any
  touched flow in Expo Go, and any calling change on a development build.

## Honest status

Automated checks in this repository have been executed and pass (server unit
tests, strict type checks on both projects, Android production bundle and
native prebuild). Real two-device WebRTC, FCM and PiP tests cannot be executed
inside the build environment and must be run on hardware before a release;
they are listed above rather than claimed as passing.
