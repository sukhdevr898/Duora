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
| Home | `home` | Time-aware greeting, partner presence card, 2×2 action tiles, quote card |
| Chat (empty) | `chat` | Glossy heart empty state, sparkle field, CTA into the conversation |
| Conversation | `conversation` | Bubbles with delivered/read ticks, quick replies, emoji + attachment sheets, live typing + auto-reply |
| Calls | `calls` | All / Voice / Video / Missed filters, direction glyphs, row options sheet |
| Notes | `notes` | Memory cards with photo thumbnails, detail sheet, add-note composer |
| Settings | `settings` | Profile card, grouped rows, notification toggle, partner sheet, about |
| Appearance | `appearance` | Premium icon kit grid + colour palette swatches |
| Audio call | `audio-call` | Pulsing avatar rings, live timer, waveform, 6 controls, end call |
| Video call | `video-call` | Full-bleed remote video, self PiP, scrim, call controls |

Every control is interactive: tabs switch, calls connect (timer starts), messages send with
optimistic ticks and a reply, sheets open/close, toasts confirm actions.

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
├── components/          Brand (logo, heart orb, waves), Avatar, BottomNav,
│                        StatusBar, Overlay (bottom sheet + toast)
├── data/mock.ts         partner, messages, calls, notes, palettes
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

Radii 10 → 36 px, three shadow tiers, and a `--sab` safe-area token so the layout sits
correctly under iOS gesture bars.

## Preview notes

- The device frame appears only on wider screens; on a phone the UI is full-bleed
  (`100dvh`, safe-area aware).
- Images live in `public/img` and are illustrative portraits/memories generated for the
  concept — swap them for real media when wiring the backend.
- This is a UI prototype only: no network requests, no persistence.
