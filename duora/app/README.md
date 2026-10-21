# Duora — Android app (Expo + React Native + TypeScript)

> Two hearts. One private space.

The premium, private two-person communication app — a 1:1 port of the React UI in
[`../ui`](../ui) (same layout, typography, icons, themes and motion) talking to the
Duora Node API. Every screen is filled with real database data; there are no mock
records anywhere.

## Stack

- Expo SDK 57 · React Native 0.86 · React 19 · TypeScript (strict)
- Expo Router (file-based routes)
- REST + Socket.IO against the Duora API (`/api/v1/*`)
- `expo-secure-store` for the refresh token, `expo-camera` for QR pairing,
  `react-native-svg` for the hand-drawn hearts, stickers and QR code
- `lucide-react-native` icons, Google Fonts (Plus Jakarta Sans + Great Vibes)

## Quick start

```bash
cd app
npm install
npx expo start                 # open in Expo Go on Android
```

The app is pre-configured for the live deployment at **https://duora.onrender.com**.
To point it somewhere else (a laptop on your LAN, a staging server) set
`EXPO_PUBLIC_API_URL` in `.env` — see [`.env.example`](./.env.example) — and restart
the bundler.

### Changing the server from inside the app

The bundled address is only the **default**. Open **Settings → Server health →
Server address** and you can:

* **Test** an address — the app talks to `/api/v1/health` and tells you the
  round-trip time, the server version and the database it uses.
* **Save & connect** — the address is stored on the device and used from then
  on. The old session is dropped (tokens belong to one server).

That is the quickest way out of a broken or sleeping Render deployment without
rebuilding the APK.

Start the backend first if you run against a local server
(see [`../server/README.md`](../server/README.md)):

```bash
cd ../server && npm install && npm run seed && npm run dev
```

Sign in with the seeded account **sukhdev@duora.app / love1234**
(partner: **ruhi@duora.app / love1234**). The sign-in sheet has a **Use it**
button that fills the demo details for you.

## Signing in and signing up

The auth sheet is deliberately loud about problems, because a silent failure
is the worst kind:

| Situation | What the user sees |
| --- | --- |
| Empty / invalid field | Inline message under the field, red border |
| Wrong email or password | *That did not match* — *Email or password is wrong* |
| Email already registered | *Already taken* with a **Sign in instead** button |
| Server asleep / booting | *Server is waking up* with **Wake it up** and **Change server** |
| No route to the server | *Cannot reach the server* with **Try again** and **Change server** |
| Server error (5xx) | *The server stumbled* — try again in a moment |

Every failure keeps the sheet open with the typed values intact, the button
turns into a spinner while the request is in flight, and the sheet shows a
live **Connected · host** / **Cannot reach host** pill so it is always obvious
whether the app can talk to the backend.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run android` | Open on Android |
| `npm run dev-client` | Start for a custom development build |
| `npm run prebuild` | Generate the native `android/` project |
| `npm run typecheck` | Strict TypeScript check |
| `npm run export:web` | Static web build (used for visual QA) |
| `npm run doctor` | Verify dependency alignment with the Expo SDK |
| `npm run eas:dev` | EAS development APK |

## Project map

```
app/
├── app/                 Expo Router routes (screens stay thin)
│   ├── (tabs)/          index · chat · notes · calls · settings
│   ├── appearance.tsx   theme + accent + love mode
│   ├── server.tsx       live server health
│   ├── pairing/         6-character code, QR show, QR scan
│   ├── conversation/    chat thread with stickers & reactions
│   ├── call/            audio + video call screens
│   └── settings/        sub-sections (account, chat, privacy, …)
├── src/
│   ├── api/             typed REST client (client.ts) + models (types.ts)
│   ├── state/           single store: session, chat, notes, calls, pairing
│   ├── components/      Duora design system (buttons, sheets, avatars, …)
│   │                    Feedback.tsx = error cards, status pills, inline notes
│   ├── theme/           tokens, fonts, ThemeProvider
│   └── data/            settings section catalogue
├── assets/              brand icons, fonts, sounds
└── app.json             Expo config (extra.apiUrl = production API)
```

## Configuration

All public runtime config uses `EXPO_PUBLIC_*` variables (see
[`.env.example`](./.env.example)). Only the API base URL is needed — the WebSocket
endpoint is derived from it. No secrets belong in the app bundle.
