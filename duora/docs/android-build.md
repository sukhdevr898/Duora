# Android development build guide

Expo Go covers everything in bucket 1 of
[expo-go-limitations.md](./expo-go-limitations.md). Native calling, foreground
services and picture-in-picture require a custom development build.

## 1. Prerequisites

- Node.js ≥ 20
- An Expo account and `eas-cli`: `npm install -g eas-cli` (or use `npx eas …`)
- For local builds: Android Studio, JDK 17, Android SDK (the Expo guide
  `npx expo install --check` validates JS dependency versions first)

## 2. Native dependencies already configured

The app pins SDK-compatible versions and wires the required config plugins:

| Package | Purpose |
| --- | --- |
| `react-native-webrtc` | WebRTC peer connections, media tracks, `RTCView` |
| `@config-plugins/react-native-webrtc` | Camera/microphone permissions and manifest setup |
| `expo-dev-client` | The development launcher replacing Expo Go |
| `expo-camera` | QR pairing scanner |
| `expo-notifications` | Channels, FCM-backed notifications |
| `./plugins/withDuoraAndroid` | PiP flags, config-change handling, foreground service declaration |

Runtime guard: `src/features/calling/runtime.ts` lazy-requires
`react-native-webrtc` only when not in Expo Go, so the same bundle works in
both runtimes.

## 3. Option A — EAS development build (recommended)

```bash
cd app
npm install
eas login
eas build:profile-sync project            # one-time, if prompted
eas build --profile development --platform android
```

`eas.json` defines three profiles:

- `development` — internal APK with `expo-dev-client`, for daily development
- `preview` — internal release-like APK for device testing
- `production` — Android App Bundle for Play submission

Install the returned APK on two physical devices. Then start the bundler:

```bash
npx expo start --dev-client
# scan the QR with the development build (not Expo Go)
```

Environment variables for the build are set in `eas.json` / EAS environment
secrets. Never commit `.env` or `google-services.json`.

## 4. Option B — Local prebuild

```bash
cd app
npx expo prebuild --platform android     # generates android/ (gitignored)
npx expo run:android --variant debug     # builds, installs and starts
```

Regenerate after changing `app.json`, plugins or native dependencies:

```bash
rm -rf android && npx expo prebuild --platform android
```

## 5. Permissions and manifest

`app.json` declares, and the generated manifest verifies:

| Permission / flag | Why Duora needs it |
| --- | --- |
| `CAMERA`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` | Video/audio calls and QR scan |
| `FOREGROUND_SERVICE` + `…_MICROPHONE` / `…_CAMERA` / `…_CONNECTED_DEVICE` | Keep an active call alive while backgrounded (Android 14+ typed services) |
| `USE_FULL_SCREEN_INTENT` | Full-screen incoming-call experience |
| `POST_NOTIFICATIONS` | Android 13+ runtime notification permission |
| `BLUETOOTH_CONNECT` | Bluetooth headset routing |
| `VIBRATE`, `WAKE_LOCK` | Ringing feedback and keeping the call awake |
| `ACCESS_NETWORK_STATE` | Honest online/offline detection |

The custom plugin additionally sets on `MainActivity`:

```xml
android:resizeableActivity="true"
android:supportsPictureInPicture="true"
android:configChanges="keyboard|keyboardHidden|orientation|screenSize|screenLayout|uiMode|smallestScreenSize|assetsPaths"
```

and declares `com.duora.app.calling.CallForegroundService` with
`foregroundServiceType="microphone|camera|connectedDevice"`. The config-change
list prevents Activity recreation (and PeerConnection teardown) during PiP and
rotation.

## 6. Picture-in-picture behavior

PiP is native Android PiP entered from the video call screen — never a floating
React Native view:

1. The user backgrounds the app during an active video call.
2. The native module calls `Activity.enterPictureInPictureMode(PictureInPictureParams)`.
3. The same `RTCView` renders the real remote stream inside the PiP window.
4. Mute/camera state and the call duration are preserved; returning expands the
   existing call without recreating the `RTCPeerConnection`.
5. Ending the call disables PiP and removes the foreground service.

PiP is unavailable/hidden when no call is active and on devices without PiP
support.

### Native-module boundary (required development-build work)

The config plugin in this repository provides the complete manifest
configuration (`supportsPictureInPicture`, `resizeableActivity`, config-change
survival, foreground service declaration) and the JS side renders the real
remote `RTCView` inside the call screens. Two thin native (Kotlin) entry points
must be added inside the generated `android/` project of the development build;
they cannot run in Expo Go and are not JavaScript APIs:

1. A `CallForegroundService` (service class name already declared by the
   plugin) started with `startForeground(…, Notification)` using the
   `microphone|camera|connectedDevice` types while a call is active.
2. An `Activity.enterPictureInPictureMode(PictureInPictureParams)` bridge
   invoked from the video call screen's background handler, wired through a
   small Expo module.

Both are deliberately isolated native seams; all call state, signaling and
media remain in the shared TypeScript `CallCoordinator`, so the JS bundle is
identical in Expo Go and in the development build.

## 7. Firebase Cloud Messaging setup

1. Create a Firebase project and an Android app with package `com.duora.app`.
2. Download `google-services.json`; place it outside version control or wire it
   through EAS credentials. `expo-notifications` uses the Expo push service in
   development and FCM credentials in standalone builds.
3. Set `EXPO_PUBLIC_EAS_PROJECT_ID` (see `.env.example`) and run
   `eas credential` / follow the Expo notifications FCM setup guide.
4. On the server, provide either `FIREBASE_SERVICE_ACCOUNT_PATH` or the
   `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`
   triple. Without credentials the server logs and skips push instead of
   failing — socket delivery still works while the app is open.

Notification channels created on device: `duora_messages` (default
importance), `duora_incoming_calls` (max importance, ringtone),
`duora_missed_calls` (high). IDs are stable so notifications replace rather
than stack.

## 8. TURN setup (coturn)

```bash
# /etc/turnserver.conf
use-auth-secret
static-auth-secret=<long-random-secret-matching-TURN_SECRET>
realm=turn.example.com
cert=/etc/letsencrypt/live/turn.example.com/fullchain.pem
pkey=/etc/letsencrypt/live/turn.example.com/privkey.pem
```

Set on the server:

```
TURN_SECRET=<same-secret>
TURN_URLS=turn:turn.example.com:3478,turns:turn.example.com:5349
STUN_URLS=stun:stun.l.google.com:19302
```

The server mints per-user HMAC credentials (`<expiry>:<userId>`) with
`TURN_TTL_SECONDS` (default 1h). The permanent secret is never embedded in the
app; clients fetch fresh credentials from `GET /calls/:id/ice`. TURN relay
bandwidth is a metered cost — document it for whoever hosts the deployment.

## 9. Real-device test checklist

Use **two** Android devices with accounts paired to each other:

- [ ] QR pairing both directions; expired/used/invalid QR handling
- [ ] Audio call: accept/decline, mute, speaker, Bluetooth, duration, end
- [ ] Video call: remote + local video, flip camera, camera off, aspect ratio
- [ ] Incoming call while backgrounded and while the screen is locked
- [ ] Answer/decline from the notification; notification cancels on completion
- [ ] PiP entry and restore; mute/camera state preserved
- [ ] Wi-Fi → mobile-data transition mid-call (ICE restart, reconnecting state)
- [ ] Airplane mode: chat queues offline, drains on reconnect, no duplicates
- [ ] Kill and relaunch: call session recovery via `GET /calls/active`
- [ ] Message sync after being offline for an extended period

Do not mark any item passed unless it was actually executed on hardware.
