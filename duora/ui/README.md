# Duora UI — premium front-end concept

A **front-end only**, mobile-first React recreation of the Duora app screens: soft violet
gradients, frosted glass, glossy 3D hearts, Plus Jakarta Sans + a script accent, and
native-Android-style motion. No backend calls, no auth, no WebRTC — everything is local
mock state so you can tap through the whole flow.

```bash
cd duora/ui
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/
```

## Screens

| Screen | Route | Notes |
| --- | --- | --- |
| Welcome / splash | `welcome` | Layered cloud + wave art, logo lockup, script tagline, CTA |
| Home | `home` | Greeting + daily line, partner hero card, 2×2 action tiles, quote card, moments rail, anniversary counter, love stats |
| Chat | `chat` | Conversation list (partner, shared memories, secret corner), search, empty state with CTA |
| Conversation | `conversation` | Bubbles with delivered/read ticks, quick replies, sticker + attachment sheets, live typing + auto-reply, offline strip |
| Calls | `calls` | Call-now hero, weekly stats, All / Voice / Video / Missed filters, search, direction glyphs, row options sheet |
| Notes | `notes` | Memory cards, category filter (All / Plans / Days), search, detail sheet, add-note composer with sticker moods |
| Settings | `settings` | Profile card, grouped rows, notification toggle, quick dark/love-theme switches, partner + about sheets |
| Appearance | `appearance` | Live preview, Light / Dark / System modes, 4 love themes, icon kit, love mode + glass + motion toggles |
| Server health | `server` | Live status ring, latency/uptime/region metrics, response-time sparkline, service rows, outage simulation, auto-reconnect |
| Pairing | `pairing` | Pairing code entry, request → accept → matched, QR code, scan, linked/unlinked states |
| Scanner | `scanner` | Camera-style QR scan view with laser sweep, torch, simulated scan |
| Sub-settings | `sub-settings` | Account, Chat settings, Notifications, Privacy & Security, Language, Help & Support |
| Audio call | `audio-call` | Pulsing avatar rings, live timer, waveform, floating hearts, 6 controls |
| Video call | `video-call` | Full-bleed remote video, self PiP, scrim, call controls |

Every control is interactive: tabs switch, calls connect (timer starts), messages send with
optimistic ticks and a reply, sheets open/close, toasts confirm actions.

### Theming

- **Modes** — Light, Dark and System (follows `prefers-color-scheme`).
- **Love themes** — Violet Love, Rose Love, Sunset Love, Mint Love. Each repaints the whole
  app (accent, gradients, bubbles, glow) instantly.
- **Love mode** — one switch that flips to the warm rose palette and adds a pink ambience.
- **Motion / glass** — floating hearts and frosted surfaces can be switched off.
- Settings persist to `localStorage` under `duora.ui.settings.v2`.

### Connection status

`state/app.tsx` simulates a server heartbeat: status (`online` / `connecting` / `offline`),
drifting latency, uptime, region and a rolling response-time history. The pill in the Home,
Chat, Calls and Notes headers links to the Server health screen, where you can force an
outage and watch auto-reconnect recover.

### Pairing

Two paths, both fully simulated:

1. **Pairing code** — type a 6-character code, send a request, the partner accepts and the
   space becomes *love connection matched* (celebration screen with rising hearts).
2. **QR code** — show your deterministic pairing QR (or scan your partner's) and the
   connection matches instantly.

Unlinking returns you to the pairing screen with a fresh code.

### Brand-owned graphics

Instead of relying on platform emoji (which render differently on Android, iOS and desktop),
romantic accents are hand-drawn SVG so they look identical everywhere:

- `components/RichText.tsx` — inline gradient hearts, sparkles, moons and stars used in
  messages, quick replies, quote card, toasts and empty states
- `components/Sticker.tsx` — 14 sticker designs (glossy heart faces + blushy emoji faces)
  shown in the chat sticker sheet and reused as mood pickers in Notes
- `components/Brand.tsx` — interlocking hearts logo, glossy 3D `HeartOrb`, welcome waves
- `components/QRCode.tsx` — deterministic pairing QR with finder patterns and a brand heart

## Stack

- **React 19 + TypeScript (strict)** with Vite
- **framer-motion** for screen transitions, bottom nav pill (`layoutId`), sheets, bubbles
- **lucide-react** icon set (consistent 1.9–2.4 stroke weights)
- **Fontsource** — Plus Jakarta Sans Variable (200–800) + Great Vibes for the script accent
- Plain CSS design tokens in `src/styles.css` (no UI framework), custom glossy SVG hearts

## Structure

```
src/
├── App.tsx              frame, simulated status bar, animated screen switching
├── nav/router.tsx       tiny stack + tab router (no router dependency)
├── state/app.tsx        theme, love theme, server health, pairing state + persistence
├── components/          Brand (logo, heart orb, waves), Avatar, BottomNav,
│                        StatusBar, Overlay (bottom sheet + toast), RichText,
│                        Sticker, QRCode, ConnectionPill
├── data/mock.ts         partner, messages, calls, notes
├── data/settingsSections.ts  account / chat / notifications / privacy / language / help
├── screens/             one file per screen
└── styles.css           design tokens + component styles
```

## Design tokens

| Token | Value | Use |
| --- | --- | --- |
| Primary | `#6D4BF6` | actions, active nav, outbound bubbles |
| Dark | `#4B2FD6` | emphasis, icon text |
| Light | `#EFEAFF` | soft fills, icon chips |
| Background | `#FCFAFF` | app surface |
| Bubble | `#F0EDFA` | inbound surface tint |
| Online | `#22C55E` | presence |
| Accent | `#F58BBF` | romantic accents |

Tokens are re-declared under `.frame[data-mode="dark"]` and `.frame[data-accent="rose|sunset|mint"]`,
so a theme switch repaints every surface, border and shadow in one frame.

Radii 10 → 36 px, three shadow tiers, and a `--sab` safe-area token so the layout sits
correctly under iOS gesture bars.

## Preview notes

- The device frame appears only on wider screens; on a phone the UI is full-bleed
  (`100dvh`, safe-area aware).
- Images live in `public/img` and are illustrative portraits/memories generated for the
  concept — swap them for real media when wiring the backend.
- This is a UI prototype only: no network requests. Only theme settings are persisted.
