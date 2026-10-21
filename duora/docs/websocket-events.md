# Duora WebSocket protocol

Transport: [Socket.IO v4](https://socket.io/) mounted at `/socket.io`
(`wss://duora.onrender.com/socket.io`), namespace `/`.

## Connection and authentication

```ts
import { io } from 'socket.io-client';

const socket = io('https://duora.onrender.com', {
  auth: { token: accessToken },
  path: '/socket.io',
});
```

- The handshake is rejected (`connect_error`, reason `unauthorized`) when the bearer
  token is missing, malformed or expired. The client refreshes the access token over
  REST and reconnects — tokens are never sent in event bodies.
- On connect the server joins the socket to the rooms `user:<userId>` and
  `conversation:<conversationId>`; every device of a user receives the events.
- Presence flips to online on connect and to offline only when the last socket of
  that user disconnects. Both transitions are broadcast to the user and to the
  partner (`presence:update`).
- The server answers with `server:hello` (`userId`, `serverTime`, `version`).
- Heartbeats: `pingInterval` 25 s, `pingTimeout` 30 s. Socket.IO handles
  reconnection with capped exponential backoff.

All events are authorized server-side. The sender identity always comes from the
authenticated socket, never from the payload.

## Event catalogue

Canonical names live in [`server/src/realtime.ts`](../server/src/realtime.ts).

### Client → server

| Event | Payload | Notes |
| --- | --- | --- |
| `presence:ping` | — | keeps the user "online" |
| `message:send` | `{ conversationId, clientMessageId, text, sticker? }` | persisted before the broadcast |
| `message:read` | `{ conversationId }` | marks the partner's messages read |
| `typing:start` | `{ conversationId, typing }` | drives the typing indicator |
| `pairing:accept` | `{ code }` | accepts a 6-character pairing code |
| `call:invite` | `{ kind: 'voice' \| 'video', callId? }` | rings the partner; with `callId` it uses the call that was already created over REST |
| `call:answer` | `{ callId }` | the callee picked up — the call becomes `ACTIVE` |
| `call:reject` | `{ callId }` | the callee declined — the call becomes `DECLINED` |
| `call:end` | `{ callId, reason? }` | ends the active call |

### Server → client

| Event | Payload | Notes |
| --- | --- | --- |
| `server:hello` | `{ userId, serverTime, version }` | sent right after the handshake |
| `presence:update` | `{ userId, online, lastSeenAt }` | online/offline transitions (own user and partner) |
| `message:new` | `{ message }` | every new message in the conversation room |
| `message:status` | `{ messageId, status }` | `sent` / `delivered` / `read` |
| `typing:update` | `{ conversationId, userId, typing }` | partner is typing |
| `pairing:request` | `{ fromUserId, code }` | somebody entered your code |
| `pairing:matched` | `{ partnerId, conversationId }` | you are paired — both apps switch to the matched state |
| `call:incoming` | `{ callId, fromUserId, fromName, kind }` | the partner is calling |
| `call:answered` | `{ callId, startedAt }` | the call is live on both phones |
| `call:declined` | `{ callId, reason }` | the partner declined |
| `call:ended` | `{ callId, reason }` | the call finished |

## Rooms

| Room | Who is in it | Used for |
| --- | --- | --- |
| `user:<userId>` | every device of that user | presence, incoming calls, pairing |
| `conversation:<conversationId>` | both partners | messages, typing, read receipts |
| `call:<callId>` | the caller, and the callee once it answers | answer / decline / end |

## The call flow

1. The caller creates the call over REST — `POST /api/v1/calls` with `{ kind }` —
   so the call log has exactly one row per call.
2. The caller rings the partner over the socket — `call:invite` with that
   `callId`. The partner's phone gets `call:incoming`.
3. The partner answers — `call:answer` (socket) or
   `POST /api/v1/calls/:callId/answer` (REST). The call becomes `ACTIVE`,
   `started_at` / `connected_at` are stamped and both phones get `call:answered`.
4. Declining — `call:reject` or `POST /api/v1/calls/:callId/reject` with
   `{ outcome: 'DECLINED' | 'MISSED' }` — sends `call:declined` to the caller.
5. Hanging up — `call:end` or `POST /api/v1/calls/:callId/end` — sends
   `call:ended` to both phones.

Nothing about the call is simulated: the timer on the phone starts when the
server says the call is connected, and the call log is written by the server.

## REST vs. socket

| Action | REST | Socket |
| --- | --- | --- |
| Send a message | `POST /api/v1/chat/conversations/:id/messages` | `message:send` |
| Mark read | `POST /api/v1/chat/conversations/:id/read` | `message:read` |
| React | `POST /api/v1/chat/messages/:id/reactions` | — |
| Pair | `POST /api/v1/pairing/accept` | `pairing:accept` |
| Start a call | `POST /api/v1/calls` | `call:invite` |
| Answer a call | `POST /api/v1/calls/:callId/answer` | `call:answer` |
| Decline a call | `POST /api/v1/calls/:callId/reject` | `call:reject` |
| End a call | `POST /api/v1/calls/:callId/end` | `call:end` |

The app uses REST for everything it must persist and the socket for live updates, so
a dropped connection never loses a message — the history is re-read from the API.
Messages sent over REST are broadcast to the conversation room as well, so the
partner sees them live either way. A message carries `senderId`, and the app
decides whether it is "me" or "partner" from its own user id.
