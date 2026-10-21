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
  that user disconnects.
- The server answers with `server:hello` (`userId`, `serverTime`, `version`).
- Heartbeats: `pingInterval` 25 s, `pingTimeout` 30 s. Socket.IO handles
  reconnection with capped exponential backoff.

All events are authorized server-side. The sender identity always comes from the
authenticated socket, never from the payload.

## Event catalogue

Canonical names live in [`server/src/websocket/events.ts`](../server/src/websocket/events.ts).

### Client → server

| Event | Payload | Notes |
| --- | --- | --- |
| `presence:ping` | — | keeps the user "online" |
| `message:send` | `{ conversationId, clientMessageId, text, sticker? }` | persisted before the broadcast |
| `message:read` | `{ conversationId }` | marks the partner's messages read |
| `typing:start` | `{ conversationId, typing }` | drives the typing indicator |
| `pairing:accept` | `{ code }` | accepts a 6-character pairing code |
| `call:invite` | `{ kind: 'voice' \| 'video' }` | starts a call and rings the partner |
| `call:end` | `{ reason? }` | ends the active call |

### Server → client

| Event | Payload | Notes |
| --- | --- | --- |
| `server:hello` | `{ userId, serverTime, version }` | sent right after the handshake |
| `presence:update` | `{ userId, online, lastSeenAt }` | online/offline transitions |
| `message:new` | `{ message }` | every new message in the conversation room |
| `message:status` | `{ messageId, status }` | `sent` / `delivered` / `read` |
| `typing:update` | `{ conversationId, userId, typing }` | partner is typing |
| `pairing:request` | `{ fromUserId, code }` | somebody entered your code |
| `pairing:matched` | `{ partnerId, conversationId }` | you are paired — both apps switch to the matched state |
| `call:incoming` | `{ callId, fromUserId, kind }` | the partner is calling |
| `call:ended` | `{ callId, reason }` | the call finished |

## REST vs. socket

| Action | REST | Socket |
| --- | --- | --- |
| Send a message | `POST /api/v1/chat/conversations/:id/messages` | `message:send` |
| Mark read | `POST /api/v1/chat/conversations/:id/read` | `message:read` |
| React | `POST /api/v1/chat/messages/:id/reactions` | — |
| Pair | `POST /api/v1/pairing/accept` | `pairing:accept` |
| Start a call | `POST /api/v1/calls` | `call:invite` |
| End a call | `POST /api/v1/calls/:callId/end` | `call:end` |

The app uses REST for everything it must persist and the socket for live updates, so
a dropped connection never loses a message — the history is re-read from the API.
