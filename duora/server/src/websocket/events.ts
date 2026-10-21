/** Socket.IO event names shared with the mobile client. */
export const EVENTS = {
  // client → server
  PRESENCE_PING: 'presence:ping',
  MESSAGE_SEND: 'message:send',
  MESSAGE_READ: 'message:read',
  TYPING: 'typing:start',
  PAIR_ACCEPT: 'pairing:accept',
  CALL_INVITE: 'call:invite',
  CALL_END: 'call:end',

  // server → client
  PRESENCE_UPDATE: 'presence:update',
  MESSAGE_NEW: 'message:new',
  MESSAGE_STATUS: 'message:status',
  TYPING_UPDATE: 'typing:update',
  PAIR_REQUEST: 'pairing:request',
  PAIR_MATCHED: 'pairing:matched',
  CALL_INCOMING: 'call:incoming',
  CALL_ENDED: 'call:ended',
  SERVER_HELLO: 'server:hello',
} as const;

export type ServerToClientEvents = {
  [EVENTS.PRESENCE_UPDATE]: (payload: { userId: string; online: boolean; lastSeenAt: string }) => void;
  [EVENTS.MESSAGE_NEW]: (payload: unknown) => void;
  [EVENTS.MESSAGE_STATUS]: (payload: { messageId: string; status: string }) => void;
  [EVENTS.TYPING_UPDATE]: (payload: { conversationId: string; userId: string; typing: boolean }) => void;
  [EVENTS.PAIR_REQUEST]: (payload: { fromUserId: string; code: string }) => void;
  [EVENTS.PAIR_MATCHED]: (payload: { partnerId: string; conversationId: string | null }) => void;
  [EVENTS.CALL_INCOMING]: (payload: { callId: string; fromUserId: string; kind: 'voice' | 'video' }) => void;
  [EVENTS.CALL_ENDED]: (payload: { callId: string; reason: string }) => void;
  [EVENTS.SERVER_HELLO]: (payload: { userId: string; serverTime: string; version: string }) => void;
};

export type ClientToServerEvents = {
  [EVENTS.PRESENCE_PING]: () => void;
  [EVENTS.MESSAGE_SEND]: (payload: { conversationId: string; clientMessageId: string; text: string; sticker?: string | null }) => void;
  [EVENTS.MESSAGE_READ]: (payload: { conversationId: string }) => void;
  [EVENTS.TYPING]: (payload: { conversationId: string; typing: boolean }) => void;
  [EVENTS.PAIR_ACCEPT]: (payload: { code: string }) => void;
  [EVENTS.CALL_INVITE]: (payload: { kind: 'voice' | 'video' }) => void;
  [EVENTS.CALL_END]: (payload: { callId: string; reason?: string }) => void;
};
