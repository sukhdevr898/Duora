# Duora — Android app (Expo + React Native + TypeScript)

> Two hearts. One private space.

A premium, private two-person communication app: pairing by code/QR,
persistent real-time chat, and genuine WebRTC audio/video calling.

## Stack

- Expo SDK 57 · React Native 0.86 · React 19 · TypeScript (strict)
- Expo Router (file-based, typed routes)
- Zustand state · expo-sqlite local cache/outbox · expo-secure-store secrets
- Socket.IO client · react-native-webrtc (development builds)
- expo-camera (QR scan) · expo-notifications (FCM) · react-native-qrcode-svg

## Quick start (Expo Go — supported features)

```bash
cd app
cp .env.example .env          # defaults target the Android emulator host
npm install
npx expo start                 # open in Expo Go on Android
```

Start the backend first (see `../server/README.md`). On a physical device,
replace `10.0.2.2` with your computer's LAN IP or a deployed HTTPS URL in
`.env`, then restart the bundler.

Everything except native calling runs in Expo Go: theming, onboarding, auth,
pairing (code + QR), full chat with offline queue, settings, diagnostics.
Opening a call in Expo Go shows an honest development-build notice — there is
no simulated video.

## Development build (native calling, foreground service, PiP)

```bash
# Cloud build
npx eas build --profile development --platform android
# or locally
npx expo prebuild --platform android
npx expo run:android --variant debug
npx expo start --dev-client
```

Full instructions, permissions, FCM and TURN setup:
[`../docs/android-build.md`](../docs/android-build.md) and
[`../docs/expo-go-limitations.md`](../docs/expo-go-limitations.md).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run android` | Open on Android |
| `npm run dev-client` | Start for a custom development build |
| `npm run prebuild` | Generate the native `android/` project |
| `npm run typecheck` | Strict TypeScript check |
| `npm run doctor` | Verify dependency alignment with the Expo SDK |
| `npm run eas:dev` | EAS development APK |

## Project map

```
app/
├── app/                 Expo Router routes (screens stay thin)
├── src/
│   ├── components/      Duora design system
│   ├── features/        auth, pairing, chat, calling, notifications…
│   ├── state/           Zustand stores
│   ├── database/        SQLite migrations
│   ├── repositories/    SQLite-backed cache, outbox, memories
│   ├── services/        HTTP client, socket, secure storage, diagnostics
│   ├── theme/           tokens + ThemeProvider
│   ├── hooks/           bootstrap, update check, app-state, call timer
│   └── types/           shared model types + WebRTC shim
├── plugins/             withDuoraAndroid (PiP + foreground service)
└── assets/              Brand icons, fonts, sounds, images
```

## Configuration

All public runtime config uses `EXPO_PUBLIC_*` variables (see
`.env.example`): API base URL, WebSocket URL, environment label, optional
version endpoint and EAS project id. No secrets belong in the app bundle.
