# Expo Go compatibility matrix

Every Duora feature is classified honestly into three buckets. The app
detects its runtime at startup (`src/features/calling/runtime.ts`) and never
pretends a native capability exists when it does not.

| Runtime | Meaning |
| --- | --- |
| `expo-go` | `Constants.executionEnvironment === StoreClient` — the Expo Go sandbox |
| `development-build` | A custom debug client built with `expo-dev-client` (native modules available) |
| `standalone` | A signed release/preview build |

## 1. Works in Expo Go

All UI, navigation, storage and networking features below run in Expo Go
today, against a reachable Duora server.

- Design system, dark/light theming, all reusable components
- Expo Router navigation, tabs, deep-link routing, back behavior
- Branded splash screen and animated onboarding (3 pages, persisted)
- Authentication screens (register, login, refresh handling, logout) backed by
  the real server — no simulated logins
- SecureStore-backed session persistence
- SQLite local cache, drafts, offline outbox and local memories
- Pairing overview, manual code entry/verification, invitation countdown,
  QR **generation** (`react-native-qrcode-svg`), copy/share
- QR **scanning** via `expo-camera` (camera permission flow included)
- Real-time chat over Socket.IO: send/receive, typing indicators, delivery and
  read receipts, date separators, pagination, reply, copy, delete-for-me,
  optimistic sends, offline queue with backoff, reconnect sync
- Partner dashboard, partner note card, connection/offline banners
- Settings, profile, server settings, developer info, about/legal screens
- Push **token** registration and local notification channels
  (`expo-notifications` runs in Expo Go for development projects)
- Update check against the documented `/app/version` contract
- Diagnostics and redacted export

## 2. Requires an Expo development / custom native build

These need `react-native-webrtc` and native Android APIs that Expo Go cannot
host. In Expo Go the call screens render an explicit **"Calls need a
development build"** panel instead of faking media — there is no WebView or
static-image substitute anywhere.

- Native WebRTC audio calls (`RTCPeerConnection`, Opus audio, real microphone)
- Native WebRTC video calls (`RTCView`, front/back camera, camera toggle,
  adaptive resolution, audio-only fallback)
- STUN/TURN negotiation with short-lived server credentials
- Foreground calling service
  (`FOREGROUND_SERVICE_MICROPHONE/CAMERA/CONNECTED_DEVICE`), declared by
  `plugins/withDuoraAndroid.ts`
- Full-screen incoming-call experience (`USE_FULL_SCREEN_INTENT`)
- Native incoming-call notification answer/decline actions, ringtone and
  vibration lifecycle while the app is backgrounded
- Native picture-in-picture
  (`android:supportsPictureInPicture`, config-change handling so the
  PeerConnection survives Activity recreation)
- Advanced audio routing (speakerphone, Bluetooth via
  `MODIFY_AUDIO_SETTINGS` / `BLUETOOTH_CONNECT`)
- Reliable background call session management beyond the JS app lifetime

Build path: see [android-build.md](./android-build.md).

## 3. Requires external infrastructure or credentials

These features are fully implemented but only function once you supply the
matching infrastructure. Nothing works with hardcoded placeholder credentials.

| Capability | What you must provide |
| --- | --- |
| Persistence, auth, chat, pairing, call history | A PostgreSQL database (`DATABASE_URL`) and the deployed Node server |
| Real-time transport | The server reachable over HTTPS/WSS (LAN IP for dev, public URL for devices) |
| FCM push notifications | A Firebase project, Expo project ID (`EXPO_PUBLIC_EAS_PROJECT_ID`), and Firebase Admin service account credentials on the server |
| WebRTC across restrictive NATs | A TURN server (e.g. coturn) with `TURN_SECRET`; STUN works without it |
| In-app update enforcement | Versioned release at the Play Store URL configured in `ANDROID_RELEASE_URL` |
| Avatar images | Hosted HTTPS image URLs (binary upload is not part of this build) |
| Password-reset emails | An SMTP/email provider integrated with the reset endpoint |

## Networking note for development

Inside an Android emulator `localhost` refers to the emulated device, not your
computer. The default `.env` therefore uses `http://10.0.2.2:4000`. A physical
device needs the computer's LAN IP (e.g. `http://192.168.1.20:4000`) or a
tunneled/deployed HTTPS URL. Plain HTTP is acceptable for local development;
production must use HTTPS and WSS.

## What is explicitly not claimed

- No end-to-end encryption: traffic is protected in transit by HTTPS/WSS and
  WebRTC DTLS/SRTP, but the server can read stored messages. At-rest encryption
  is an operator responsibility.
- No guarantee of ringing after force-stop, device shutdown, revoked
  permissions, disabled notifications or unavailable network/FCM.
- Expo Go is never presented as the runtime for background calling or PiP.
