/**
 * Realtime channel (Socket.IO).
 *
 * One socket per session: it carries live messages, typing, presence and
 * the call signalling. It reconnects on its own with a back-off, and it is
 * torn down when the app goes to the background so the phone does not keep
 * a socket open for nothing.
 */
import { io, type Socket } from 'socket.io-client';

import { getAccessToken, getApiBaseUrl } from './client';
import type { ChatMessage } from './types';

export const REALTIME_EVENTS = {
  PRESENCE_PING: 'presence:ping',
  MESSAGE_SEND: 'message:send',
  MESSAGE_READ: 'message:read',
  TYPING: 'typing:start',
  PAIR_ACCEPT: 'pairing:accept',
  CALL_INVITE: 'call:invite',
  CALL_ANSWER: 'call:answer',
  CALL_REJECT: 'call:reject',
  CALL_END: 'call:end',

  PRESENCE_UPDATE: 'presence:update',
  MESSAGE_NEW: 'message:new',
  MESSAGE_STATUS: 'message:status',
  TYPING_UPDATE: 'typing:update',
  PAIR_REQUEST: 'pairing:request',
  PAIR_MATCHED: 'pairing:matched',
  CALL_INCOMING: 'call:incoming',
  CALL_ANSWERED: 'call:answered',
  CALL_DECLINED: 'call:declined',
  CALL_ENDED: 'call:ended',
  SERVER_HELLO: 'server:hello',
} as const;

export type RealtimeHandlers = {
  onConnected?: (connected: boolean) => void;
  onMessage?: (message: ChatMessage) => void;
  onMessageStatus?: (payload: { messageId: string; status: string }) => void;
  onTyping?: (payload: { conversationId: string; userId: string; typing: boolean }) => void;
  onPresence?: (payload: { userId: string; online: boolean; lastSeenAt: string }) => void;
  onPairMatched?: (payload: { partnerId: string; conversationId: string | null }) => void;
  onCallIncoming?: (payload: {
    callId: string;
    fromUserId: string;
    fromName: string;
    kind: 'voice' | 'video';
  }) => void;
  onCallAnswered?: (payload: { callId: string; startedAt: string }) => void;
  onCallDeclined?: (payload: { callId: string; reason: string }) => void;
  onCallEnded?: (payload: { callId: string; reason: string }) => void;
};

class RealtimeClient {
  private socket: Socket | null = null;
  private handlers: RealtimeHandlers = {};

  /** Starts (or restarts) the realtime channel. */
  connect(handlers: RealtimeHandlers = {}): void {
    this.handlers = handlers;
    if (this.socket) {
      this.socket.connect();
      return;
    }
    const token = getAccessToken();
    if (!token) return;

    const base = getApiBaseUrl();
    this.socket = io(base || undefined, {
      path: '/socket.io',
      // Polling first works behind every proxy; the client upgrades to a
      // websocket as soon as the server allows it.
      transports: ['polling', 'websocket'],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 700,
      reconnectionDelayMax: 6000,
      timeout: 12_000,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      this.handlers.onConnected?.(true);
      this.emit(REALTIME_EVENTS.PRESENCE_PING);
    });
    this.socket.on('disconnect', () => this.handlers.onConnected?.(false));
    this.socket.on('connect_error', () => this.handlers.onConnected?.(false));

    this.socket.on(REALTIME_EVENTS.MESSAGE_NEW, (payload: { message?: ChatMessage }) => {
      if (payload?.message) this.handlers.onMessage?.(payload.message);
    });
    this.socket.on(
      REALTIME_EVENTS.MESSAGE_STATUS,
      (payload: { messageId: string; status: string }) =>
        this.handlers.onMessageStatus?.(payload),
    );
    this.socket.on(
      REALTIME_EVENTS.TYPING_UPDATE,
      (payload: { conversationId: string; userId: string; typing: boolean }) =>
        this.handlers.onTyping?.(payload),
    );
    this.socket.on(
      REALTIME_EVENTS.PRESENCE_UPDATE,
      (payload: { userId: string; online: boolean; lastSeenAt: string }) =>
        this.handlers.onPresence?.(payload),
    );
    this.socket.on(
      REALTIME_EVENTS.PAIR_MATCHED,
      (payload: { partnerId: string; conversationId: string | null }) =>
        this.handlers.onPairMatched?.(payload),
    );
    this.socket.on(
      REALTIME_EVENTS.CALL_INCOMING,
      (payload: { callId: string; fromUserId: string; fromName: string; kind: 'voice' | 'video' }) =>
        this.handlers.onCallIncoming?.(payload),
    );
    this.socket.on(REALTIME_EVENTS.CALL_ANSWERED, (payload: { callId: string; startedAt: string }) =>
      this.handlers.onCallAnswered?.(payload),
    );
    this.socket.on(REALTIME_EVENTS.CALL_DECLINED, (payload: { callId: string; reason: string }) =>
      this.handlers.onCallDeclined?.(payload),
    );
    this.socket.on(REALTIME_EVENTS.CALL_ENDED, (payload: { callId: string; reason: string }) =>
      this.handlers.onCallEnded?.(payload),
    );
  }

  /** Closes the channel (backgrounded app, signed out, server switched). */
  disconnect(): void {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
  }

  /** True while the socket is live. */
  get connected(): boolean {
    return Boolean(this.socket?.connected);
  }

  private emit(event: string, payload?: unknown): void {
    if (!this.socket?.connected) return;
    if (payload === undefined) this.socket.emit(event);
    else this.socket.emit(event, payload);
  }

  sendMessage(conversationId: string, clientMessageId: string, text: string, sticker?: string | null): void {
    this.emit(REALTIME_EVENTS.MESSAGE_SEND, { conversationId, clientMessageId, text, sticker });
  }

  markRead(conversationId: string): void {
    this.emit(REALTIME_EVENTS.MESSAGE_READ, { conversationId });
  }

  setTyping(conversationId: string, typing: boolean): void {
    this.emit(REALTIME_EVENTS.TYPING, { conversationId, typing });
  }

  inviteCall(kind: 'voice' | 'video', callId?: string): void {
    this.emit(REALTIME_EVENTS.CALL_INVITE, { kind, callId });
  }

  answerCall(callId: string): void {
    this.emit(REALTIME_EVENTS.CALL_ANSWER, { callId });
  }

  rejectCall(callId: string): void {
    this.emit(REALTIME_EVENTS.CALL_REJECT, { callId });
  }

  endCall(callId: string, reason = 'ended'): void {
    this.emit(REALTIME_EVENTS.CALL_END, { callId, reason });
  }
}

export const realtime = new RealtimeClient();
