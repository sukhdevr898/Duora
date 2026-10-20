# Duora HTTP API

Base path: `/api/v1` (health endpoints are at the root).

- All request/response bodies are JSON.
- Authenticated endpoints require `Authorization: Bearer <accessToken>`.
- Validation errors return `400` with a flattened Zod report in `error.details`.
- Standard error envelope:

```json
{ "error": { "code": "conflict", "message": "Human readable message", "details": {} } }
```

| Status | Codes |
| --- | --- |
| 400 | `bad_request` |
| 401 | `unauthorized`, `session_expired` |
| 403 | `forbidden` |
| 404 | `not_found` |
| 409 | `conflict` |
| 429 | `rate_limited` |
| 500 | `internal_error`, `database_error` |

## Infrastructure

### `GET /health`
Liveness. `200 { "status": "ok", "service": "duora-server", "time": "…" }`

### `GET /ready`
Readiness — runs `SELECT 1`. `200 { "status": "ready", "database": "up", "fcmConfigured": boolean }` or `503`.

### `GET /api/v1/app/version?platform=android&version=1.0.0`
In-app update contract. No client-side hardcoding of release URLs.

```json
{
  "platform": "android",
  "latestVersion": "1.0.0",
  "minSupportedVersion": "1.0.0",
  "updateAvailable": false,
  "updateRequired": false,
  "releaseUrl": "https://play.google.com/store/apps/details?id=com.duora.app",
  "checkedAt": "2026-10-19T18:00:00.000Z"
}
```

The client distinguishes **optional** (`updateAvailable`) and **required**
(`updateRequired`, below `minSupportedVersion`) updates, never blocks on
offline failure, and only opens the verified `releaseUrl`. It never downloads
APKs directly.

## Authentication

### `POST /auth/register` — rate limited (5/hour)
```json
{ "email": "alice@duora.dev", "password": "min-8-chars", "displayName": "Alice" }
```
`201` → `{ "user": { id, email, displayName, avatarUrl }, "tokens": { accessToken, refreshToken, expiresIn } }`

### `POST /auth/login` — rate limited (10/15 min)
```json
{ "email": "alice@duora.dev", "password": "…", "device": { "pushToken": "ExponentPushToken[...]", "platform": "android", "deviceId": "…" } }
```
Same response shape as register. Wrong email and wrong password return the same
generic `401` to prevent account enumeration.

### `POST /auth/refresh`
```json
{ "refreshToken": "…" }
```
Rotates the refresh session (the presented one is revoked) and returns
`{ "tokens": { accessToken, refreshToken, expiresIn } }`.

### `POST /auth/logout`
```json
{ "refreshToken": "…" }
```
`204`. Revokes the refresh session. The client also deletes its local session.

### `POST /auth/reset-password`
```json
{ "email": "…" }
```
Always `202 { "accepted": true }` whether or not the account exists. Email
delivery requires configuring an SMTP/email provider (see server README);
without one the request is validated and logged, never faked.

### `GET /auth/me`
`200 { "user": { id, email, displayName, avatarUrl } }`

## Users and settings

### `GET /users/me`
Profile plus persisted settings row.

### `PATCH /users/me`
Body: any of `displayName`, `avatarUrl` (https URL), `partnerNickname` (nullable).

### `GET /users/me/settings` · `PUT /users/me/settings`
Settings: `theme` (`system|light|dark`), `messageNotifications`,
`callNotifications`, `ringtone`, `vibration`, `hidePreview`, `lowData`.

### `DELETE /users/me`
Soft-deletes the account and revokes every refresh session (`204`).

## Pairing

All pairing endpoints require authentication.

### `GET /pairing/current`
`{ "pairing": { "status": "UNPAIRED" } }` or
```json
{
  "pairing": {
    "status": "ACTIVE",
    "pairingId": "…",
    "conversationId": "…",
    "since": "…",
    "partner": { "id": "…", "displayName": "…", "avatarUrl": null, "partnerNickname": null }
  }
}
```

### `POST /pairing/invitations` — rate limited (12/min)
Creates a short-lived invitation (TTL from `INVITATION_TTL_MINUTES`, default 10).
Any previous pending invitation from the caller is revoked.
```json
{ "invitation": { "id", "code": "DUO-482913", "token": "<opaque>", "status": "PENDING", "expiresAt": "…", "createdBy": { "id", "displayName", "avatarUrl" } } }
```
The QR code encodes `{ duora: 1, host, code, token, exp }`. It contains only
the opaque server token — never a password or refresh token.

### `GET /pairing/invitations/preview?code=DUO-482913` or `?token=…`
Previews an invitation without pairing. Used after QR scan and manual entry.

### `POST /pairing/verify` — rate limited (20/min)
```json
{ "code": "DUO-482913" }
```
Increments the invitation's attempt counter; after `INVITATION_MAX_ATTEMPTS`
(default 5) the invitation is revoked and verification returns `403`.

### `POST /pairing/accept`
```json
{ "code": "DUO-482913" }
```
or `{ "token": "…" }`. Server-authorized, transactional: creates the `Pairing`,
`Conversation`, both participant rows, marks the invitation `USED`, revokes
other pending invitations, and emits `pairing_update` to both users.
`201 { "pairing": { "pairingId", "conversationId", "partnerId" } }`

Rejected: own invitation, expired/used/revoked invitation (`409`), either side
already paired (`409`).

### `DELETE /pairing/current`
Body `{ "confirm": "UNPAIR" }`. Marks the pairing `UNLINKED`, revokes pending
invitations, emits `pairing_update` to both sides (`204`).

## Chat

### `GET /conversations`
`{ "conversations": [{ id, updatedAt, partner: {id, displayName, avatarUrl}, lastMessage: Message|null, unreadCount }] }`

### `POST /messages` — rate limited (60/min)
```json
{ "conversationId": "…", "clientMessageId": "uuid-v4", "text": "hello", "type": "TEXT", "replyToId": "optional" }
```
Idempotent on `(conversationId, clientMessageId)`: a retried send returns the
original durable message. The message is persisted before the response.
`201 { "message": Message }`.

### `GET /conversations/:id/messages?cursor=<ISO>&limit=40`
Cursor pagination (max 50). Returns newest-first internally, rendered
oldest-first within the page.
```json
{ "messages": [Message], "nextCursor": "2026-10-19T…Z|null" }
```
"Delete for me" records are filtered; "delete for everyone" rows return with
`deletedForAll: true` and empty text.

### `GET /conversations/:id/sync?since=<ISO>`
Reconnect reconciliation — messages and receipt changes after a watermark.
`{ "messages": [Message], "receipts": [...] }`

### `POST /conversations/:id/delivered`
Stamps un-stamped incoming receipts (`{ "delivered": n }`).

### `POST /messages/read`
`{ "conversationId": "…", "messageId"?: "…" }` — marks incoming messages read
(and delivered). Emits `message_read` to the partner.

### `POST /messages/delete-for-me`
`{ "messageId": "…" }` — hides the message for the caller only (`204`).

### `POST /messages/delete-for-all`
`{ "messageId": "…" }` — sender only; blanks content and stamps
`deletedForAllAt`. Returns `{ "id", "at" }` and fans out over the socket.

## Calls

### `POST /calls` — rate limited (20/min)
`{ "callType": "AUDIO" | "VIDEO" }` →
```json
{ "call": CallSession, "ice": { "iceServers": [...], "expiresAt": "…|null" }, "existing": false }
```
If a ringing/connecting/active call already involves the user, the existing
session is returned (`existing: true`) instead of creating a duplicate.

### `GET /calls/active`
Current open call or `{ "call": null }` — used after Activity recreation.

### `GET /calls/:callId/ice`
Fresh short-lived TURN credentials (coturn REST HMAC scheme). The permanent
`TURN_SECRET` never leaves the server.

### `POST /calls/:callId/accept` (callee) · `/decline` (callee) · `/cancel` (caller) · `/end` (either)
Each validates participation and the legal state transition, persists the new
`CallStatus`, and the corresponding socket event notifies the peer.

## Devices / push

### `POST /devices/push-token`
```json
{ "pushToken": "ExponentPushToken[...]|FCM token", "platform": "android", "deviceId": "optional" }
```
Tokens are globally unique (per app install); re-registering moves ownership to
the current account.

### `DELETE /devices/push-token`
`{ "pushToken": "…" }` (`204`).

## Payload and abuse limits

- JSON body limit: 1 MB; Socket.IO signaling payload cap: 1 MB.
- Message text: 1–4000 characters; invitation codes must match `DUO-\d{6}`.
- Rate limiters: register, login, invitations, verification, message send,
  call initiation, plus a 300 req/min global limiter.
- Passwords hashed with bcrypt (cost 12); refresh tokens stored only as
  SHA-256 hashes; secrets are read from environment variables and redacted in
  logs.
