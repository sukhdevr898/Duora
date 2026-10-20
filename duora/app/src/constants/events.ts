/** Mirror of the server's canonical socket event names (server/src/websocket/events.ts). */
export const SocketEvents = {
  MESSAGE_SEND: 'message_send',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  MESSAGE_READ: 'message_read',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_ACK: 'message_ack',
  MESSAGE_NEW: 'message_new',
  PAIRING_UPDATE: 'pairing_update',
  CALL_INVITE: 'call_invite',
  CALL_RINGING: 'call_ringing',
  CALL_ACCEPT: 'call_accept',
  CALL_DECLINE: 'call_decline',
  CALL_CANCEL: 'call_cancel',
  CALL_END: 'call_end',
  CALL_STATE: 'call_state',
  WEBRTC_OFFER: 'webrtc_offer',
  WEBRTC_ANSWER: 'webrtc_answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc_ice_candidate',
  CALL_ERROR: 'call_error',
  PRESENCE_UPDATE: 'presence_update',
} as const;

export type SocketEventName = (typeof SocketEvents)[keyof typeof SocketEvents];
