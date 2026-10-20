# Duora WebSocket protocol

Transport: [Socket.IO v4](https://socket.io/) over WebSocket transport, mounted
at the server root (e.g. `wss://api.example.com`). Namespace: `/`.

## Connection and authentication

```ts
import { io } from 'socket.io-client';

const socket = io('https://api.example.com', {
  auth: { token: accessToken },
  transports: ['websocket'],
});
```

- The handshake is rejected (`connect_error`, reason `unauthorized`) when the
  bearer token is missing, malformed or expired. The client refreshes the
  access token via REST and reconnects — tokens are never sent in event bodies.
- On connect the server joins the socket to room `user:<userId>`; every device
  of a user receives events. Presence flips to online; on disconnect it flips
  offline only when the user has no remaining sockets.
- Heartbeats: `pingInterval` 20s, `pingTimeout` 30s. Socket.IO handles
  reconnection with capped exponential backoff (client config 1s–15s).
- Max signaling payload: 1 MB.

All events are validated with Zod and authorized server-side. The sender
identity always comes from the authenticated socket, never the payload.

## Event catalogue

Canonical names are mirrored in
`server/src/websocket/events.ts` and `app/src/constants/events.ts`.

### Chat

| Direction | Event | Payload | Notes |
| --- | --- | --- | --- |
| client → server | `message_send` | `{ conversationId, clientMessageId (uuid), text, type?, attachmentUrl?, replyToId? }` | Supports an acknowledgement callback |
| server → client | `message_ack` | `{ ok, clientMessageId, message }` or `{ ok:false, error }` | Durable acceptance; client replaces its optimistic row |
| server → client | `message_new` | `{ message }` | Delivered to the partner's devices; triggers FCM when offline |
| client → server | `typing_start` / `typing_stop` | `{ conversationId }` | Server-throttled to one start per 2.5s |
| client → server | `message_delivered` | `{ conversationId }` | Fan-out `message_delivered` to partner |
| client → server | `message_read` | `{ conversationId, messageId? }` | Fan-out `message_read` to partner |
| server → client | `message_delivered` / `message_read` | `{ conversationId, at, ... }` | Drives bubble status icons |

#### Acknowledgement contract

```ts
socket.timeout(10000).emit('message_send', payload, (err, response) => {
  // err set on timeout; response: { ok: true, clientMessageId, message }
  // or { ok: false, error: { code, message } }
});
```

A timeout or `ok:false` moves the message to the SQLite outbox for retry; it is
never shown as sent without a durable acknowledgement.

### Pairing

| Direction | Event | Payload |
| --- | --- | --- |
| server → client | `pairing_update` | `{ status: "ACTIVE", pairingId, conversationId, at }` or `{ status: "UNLINKED", at }` |

Fired after `accept` and `unpair` so both devices update without polling.

### Calls

Signaling only — SDP/ICE are relayed, never persisted; media stays peer-to-peer.

| Direction | Event | Payload |
| --- | --- | --- |
| client → server | `call_invite` | `{ callId }` (the durable call row already exists via `POST /calls`) |
| server → client | `call_invite` | `{ callId, callerId, callType, at }` — plus FCM high-priority push if the callee is offline |
| client → server | `call_ringing` | `{ callId }` |
| server → client | `call_ringing` | `{ callId, at }` — caller UI moves to "Ringing…" |
| client → server | `call_accept` | `{ callId }` — server transitions RINGING → CONNECTING |
| server → client | `call_accept` | `{ callId, at }` |
| client → server | `call_decline` / `call_cancel` / `call_end` | `{ callId }` — role and state-transition checked server-side |
| server → client | `call_decline` / `call_cancel` / `call_end` | `{ callId, at }` |
| client → server | `call_state` | `{ callId, state: "CONNECTING"|"ACTIVE"|"RECONNECTING" }` |
| server → client | `call_state` | same, relayed to the peer |
| client → server | `webrtc_offer` | `{ callId, sdp }` |
| client → server | `webrtc_answer` | `{ callId, sdp }` |
| client → server | `webrtc_ice_candidate` | `{ callId, candidate }` |
| server → client | `webrtc_offer` / `webrtc_answer` / `webrtc_ice_candidate` | same shapes, relayed only to the other participant |
| server → client | `call_error` | `{ callId, message }` |

Authorization rule: every call/webrtc event verifies the socket user is the
caller or callee of `callId`; any other recipient gets `call_error` and the
event is dropped. ICE candidates arriving before the remote description are
buffered client-side and flushed afterwards.

### Presence

| Direction | Event | Payload |
| --- | --- | --- |
| server → client | `presence_update` | `{ userId, online: boolean, at }` |

Emitted to the user's partner on connect/disconnect. The client only treats it
as partner presence when `userId` matches the paired partner.

## Reconnection behavior

1. Socket.IO reconnects automatically; the access token is re-read from secure
   storage on each connection attempt.
2. On `connect`, the client drains the offline outbox (idempotent sends) and
   runs `/conversations/:id/sync?since=<watermark>` for any open conversation.
3. No full history download occurs — the watermark plus cursor pagination
   bounds reconciliation.
4. During an active call, the WebRTC peer survives short socket outages;
   `disconnected` peer state triggers an ICE restart and a `reconnecting` UI
   phase rather than ending the call.

## Push fallback

When the recipient has no live socket, the server sends FCM messages with
stable identifiers and explicit channels (`duora_messages`,
`duora_incoming_calls`, `duora_missed_calls`). Notification `data.kind`
(`message`, `incoming_call`, `missed_call`) drives tap routing on the client.
