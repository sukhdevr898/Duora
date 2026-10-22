# Duora — Android app (Expo + React Native + TypeScript)

Duora is a paired messaging app built with Expo Router and React Native. The current interface uses the blush/rose visual system and sends account, pairing, chat, notes, and call-signalling requests to the Duora Node API. User-facing content is loaded from the API; the client does not ship fallback conversations or demo accounts.

## Stack

- Expo SDK 57 · React Native 0.86 · React 19 · TypeScript (strict)
- Expo Router (file-based routes)
- REST + Socket.IO against the Duora API (`/api/v1/*`)
- `expo-secure-store` for refresh tokens, `expo-camera` for QR pairing
- `react-native-svg` for hand-drawn hearts, stickers, and QR codes
- Lucide icons, Plus Jakarta Sans, and Great Vibes

## Quick start

```bash
cd duora/app
npm ci
npx expo start
```

Open the project in Expo Go on Android, or use an Android development build for native modules. The default API is **https://duora.onrender.com**. To use a different server, copy `.env.example` to `.env`, set `EXPO_PUBLIC_API_URL`, then restart Expo. Never put server secrets in the app bundle.

When a reverse proxy serves the API on the same origin, set `EXPO_PUBLIC_API_URL=relative`; the app then uses `/api/v1/*` on that origin.

### Change the server in the app

Open **Settings → Server health → Server address**. Test an address before saving it. Saving a new server drops the old session because refresh tokens belong to one server.

## Feature status

- **Available:** account sign-in/sign-up, one-to-one pairing, QR/code exchange, server-backed chat and notes, realtime typing/presence, delivery/read status, and call signalling.
- **Not configured:** push notifications, an audio/video media engine, end-to-end encryption, and an in-app lock.
- **Icon selector:** changes the in-app splash/brand treatment only; it does not change the Android launcher icon in this build.
- Call screens can send or receive real signalling requests, but they do **not** transmit microphone or camera media.

## Useful scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start Expo |
| `npm run android` | Run the Android app |
| `npm run prebuild` | Generate the Android native project |
| `npm run typecheck` | Strict TypeScript check |
| `npm run export:web` | Export the web build for UI QA |
| `npm run doctor` | Check Expo dependency alignment |
| `npm run eas:dev` | Build an EAS development APK |

## Project map

```
app/
├── app/                 Expo Router routes
│   ├── (tabs)/          Home · chat · notes · calls · settings
│   ├── pairing/         Pairing code and QR scanner
│   ├── conversation/    Realtime thread with stickers and reactions
│   ├── call/            Signalling-only call request screens
│   └── settings/        Account, notification, privacy, and help details
├── src/api/             Typed REST client and API models
├── src/state/           Session, chat, notes, calls, and pairing state
├── src/components/      Reusable UI, feedback, and illustration components
├── src/theme/           Color tokens and theme provider
└── assets/              Brand art and fonts
```
