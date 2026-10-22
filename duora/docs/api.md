# Duora REST API

Base path: `/api/v1`. Health endpoints live at the root.
Production base URL: **`https://duora.onrender.com`**.

Every protected route expects `Authorization: Bearer <accessToken>`.
Errors are JSON: `{ "error": { "code": "…", "message": "…" } }` with a matching
HTTP status (`400` validation, `401` unauthorized, `404` not found, `409` conflict,
`500` internal).

---

## Infrastructure

### `GET /health`

```json
{"status":"operational","version":"3.0.0","region":"Singapore · ap-southeast",
 "database":{"driver":"postgres","status":"operational"},"services":[…]}
```

### `GET /api/v1/health`

The same payload plus `startedAt`, `uptimeSeconds`, `latencyMs` and the per-service
latency the app renders on the Server-health screen.

---

## Authentication

### `POST /api/v1/auth/register` → `201`

```json
{ "email": "you@duora.app", "password": "love1234", "displayName": "Sukhdev" }
```

→ `{ "user": {…}, "accessToken": "…", "refreshToken": "…", "expiresIn": "30d" }`

### `POST /api/v1/auth/login` → `200`

```json
{ "email": "sukhdev@duora.app", "password": "love1234" }
```

→ the same envelope as `register`. A wrong password returns `401`.

### `POST /api/v1/auth/refresh` → `200`

```json
{ "refreshToken": "…" }
```

→ a fresh envelope. **Refresh tokens are single use**: the old one is revoked and
the new one must be stored. Using a revoked token returns `401`.

### `POST /api/v1/auth/logout` → `204`

```json
{ "refreshToken": "…" }
```

### `GET /api/v1/auth/me` → `200` 🔒

→ `{ "user": { id, email, displayName, avatarUrl, partnerNickname, createdAt } }`

---

## Users & settings

### `GET /api/v1/users/me` → `200` 🔒 → `{ "user": {…} }`
### `PATCH /api/v1/users/me` → `200` 🔒

```json
{ "displayName": "Sukhdev", "avatarUrl": "https://…", "partnerNickname": "Ruhi" }
```

### `GET /api/v1/settings` → `200` 🔒

```json
{ "settings": { "theme": "system", "accent": "violet", "loveMode": false,
  "heartMotion": true, "glass": true, "messageNotifications": true,
  "callNotifications": true, "ringtone": "default", "vibration": true,
  "hidePreview": false, "lowData": false, "updatedAt": "…" } }
```

### `PATCH /api/v1/settings` → `200` 🔒

Same fields, all optional — the app sends `theme`, `accent`, `loveMode`,
`heartMotion` and `glass` whenever they change.

---

## Pairing

### `GET /api/v1/pairing/status` → `200` 🔒

```json
{ "phase": "matched", "code": "TH4XFS", "qrPayload": null, "expiresAt": null,
  "matchedAt": "2026-10-21T10:04:04.255Z",
  "partner": { "id": "usr_ruhi", "displayName": "Ruhi", "nickname": "Ruhi",
               "avatarUrl": "https://…" },
  "conversationId": "cv_…" }
```

`phase` is `idle` → `outgoing` (a code is waiting) → `matched`.

### `POST /api/v1/pairing/invitation` → `201` 🔒

→ `{ "code": "TH4XFS", "token": "…", "qrPayload": "duora://pair?token=…", "expiresAt": "…" }`

The code lives for 10 minutes (`PAIRING_TTL_MINUTES`) and can be used once.

### `POST /api/v1/pairing/accept` → `200` 🔒

```json
{ "code": "TH4XFS" }
```

→ the new pairing status. `404` = unknown code, `409` = already paired.

### `POST /api/v1/pairing/scan` → `200` 🔒

```json
{ "token": "…" }
```

→ the new pairing status (QR path).

### `POST /api/v1/pairing/resolve` → `200` 🔒

```json
{ "data": "duora://pair?token=…" }
```

→ `{ "token": "…" }` — accepts a raw QR payload or a bare token.

### `DELETE /api/v1/pairing` → `200` 🔒

Unlinks the pair. The conversation disappears from the chat list; memories stay.

---

## Chat

### `GET /api/v1/chat/conversations` → `200` 🔒

```json
{ "conversations": [ { "id": "cv_…",
  "partner": { "id": "usr_ruhi", "displayName": "Ruhi", "nickname": "Ruhi",
               "avatarUrl": "https://…", "online": true, "lastSeenAt": "…" },
  "lastMessage": { "text": "…", "sticker": null, "createdAt": "…", "from": "me" },
  "unreadCount": 0, "updatedAt": "…" } ] }
```

### `GET /api/v1/chat/conversations/:id/messages?limit=80` → `200` 🔒

→ `{ "messages": [ { "id": "msg_…", "conversationId": "cv_…", "senderId": "…",
  "text": "…", "sticker": null, "createdAt": "…", "reactions": [], "status": "read" } ] }`

### `POST /api/v1/chat/conversations/:id/messages` → `201` 🔒

```json
{ "clientMessageId": "uuid", "text": "Love you 💜", "sticker": null }
```

→ `{ "message": {…} }`. `clientMessageId` makes the send idempotent. Every message
carries `senderId`, so the app can tell "me" from "partner" no matter which
device receives it. Messages sent here are broadcast to the conversation room as
well — the partner sees them live.

### `POST /api/v1/chat/conversations/:id/read` → `200` 🔒 → `{ "marked": 3 }`

### `POST /api/v1/chat/messages/:id/reactions` → `200` 🔒

```json
{ "emoji": "heart" }
```

→ `{ "reactions": ["heart"] }` (toggles).

### `DELETE /api/v1/chat/messages/:id` → `204` 🔒

### `GET /api/v1/chat/quick-replies` → `200` 🔒 → `{ "replies": ["Miss you ✨", …] }`

### `GET /api/v1/chat/partner` → `200` 🔒

→ `{ "conversationId": "cv_…", "partnerName": "Ruhi" }`

---

## Calls

### `GET /api/v1/calls` → `200` 🔒 → `{ "calls": [ … ] }`
### `POST /api/v1/calls` → `201` 🔒 — `{ "kind": "voice" | "video" }` → `{ "call": {…} }`
### `POST /api/v1/calls/:callId/answer` → `200` 🔒 → `{ "call": {…} }`
### `POST /api/v1/calls/:callId/reject` → `200` 🔒

```json
{ "outcome": "DECLINED" }
```

→ `{ "call": {…} }`. `outcome` is `DECLINED` (default) or `MISSED`.

### `POST /api/v1/calls/:callId/end` → `200` 🔒

```json
{ "call": { "id": "call_…", "type": "Outgoing Call", "kind": "voice", "missed": false,
             "time": "10:04 pm", "day": "Today", "duration": "1m 12s", "clock": "22:04" } }
```

The body is optional — `{"outcome":"ENDED"}` (default), `DECLINED`, `CANCELLED`,
`MISSED` or `FAILED`.

---

## Notes (memories)

### `GET /api/v1/notes` → `200` 🔒 → `{ "notes": [ … ] }`
### `POST /api/v1/notes` → `201` 🔒

```json
{ "title": "Our first call", "body": "That moment…", "category": "PLAN",
  "imageUrl": null, "mood": "heart-pink" }
```

`category` is one of `ALL`, `PLAN`, `DAYS`.

### `PATCH /api/v1/notes/:id` → `200` 🔒 → `{ "note": {…} }`
### `DELETE /api/v1/notes/:id` → `204` 🔒

---

## Devices

### `POST /api/v1/devices` → `201` 🔒

```json
{ "pushToken": "ExponentPushToken[…]", "platform": "android", "deviceId": "…" }
```

→ `{ "deviceId": "dev_…" }`

### `DELETE /api/v1/devices/:deviceId` → `204` 🔒

---

## Home

### `GET /api/v1/home` → `200` 🔒

Everything the home screen needs in one call:

```json
{ "partner": { "id": "usr_ruhi", "displayName": "Ruhi", "nickname": "Ruhi",
               "avatarUrl": "https://…", "online": true, "lastSeenAt": "…" },
  "linked": true, "streakDays": 1, "daysTogether": 1,
  "pairedAt": "2026-10-21T10:04:04.255Z",
  "anniversary": { "title": "Our anniversary", "date": "14 Feb",
                   "daysUntil": 116, "daysTogether": 1 },
  "loveStats": { "daysTogether": "1", "messages": "12", "callsThisWeek": "1h 10m" },
  "moments": [ … ], "latestMessage": { … } }
```

---

## Media

Avatars and memory photos are served straight from the API:

```
GET /img/me.jpg
GET /img/partner.jpg
GET /img/note-1.jpg … /img/note-4.jpg
```

The URLs are absolute (`PUBLIC_BASE_URL` + path), so the client never has to guess
the host.
