/**
 * Global app store (zustand).
 *
 * Everything the UI shows comes from the Node server; the store keeps the
 * session, the appearance preferences, the live server health and the cached
 * domain data in one place.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  api,
  ApiError,
  describeError,
  getApiBaseUrl,
  loadRefreshToken,
  normalizeBaseUrl,
  pingServer,
  probeServer,
  setAccessToken,
  setApiBaseUrl,
  setUnauthorizedHandler,
  storeRefreshToken,
  withRetry,
  type ErrorInfo,
} from '../api/client';
import type {
  CallLogItem,
  ChatMessage,
  ConversationSummary,
  HomePayload,
  NoteItem,
  PairingStatus,
  PublicUser,
  ServerInfo,
  UserSettings,
} from '../api/types';
import { realtime } from '../api/socket';
import type { AccentKey, ThemeMode } from '../theme/tokens';

const THEME_KEY = 'duora.theme.v1';
const SERVER_URL_KEY = 'duora.apiUrl.v1';

type PersistedTheme = {
  themePreference: ThemeMode;
  accent: AccentKey;
  loveMode: boolean;
  heartMotion: boolean;
  glass: boolean;
};

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

/** A call that is ringing on this device. */
export type IncomingCall = {
  callId: string;
  fromUserId: string;
  fromName: string;
  kind: 'voice' | 'video';
  at: number;
};

/** The call this device is in (outgoing or accepted). */
export type ActiveCall = {
  callId: string;
  kind: 'voice' | 'video';
  state: 'ringing' | 'active' | 'ended';
  startedAt: number | null;
};

type Store = {
  /* ---------------- auth ---------------- */
  authStatus: AuthStatus;
  user: PublicUser | null;
  /** The last sign-in / sign-up failure, already written for humans. */
  authError: ErrorInfo | null;
  authBusy: boolean;
  clearAuthError: () => void;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => Promise<void>;

  /* ---------------- which server ---------------- */
  /** The address the app talks to (persisted, editable in Settings → Server). */
  serverUrl: string;
  serverUrlSaved: boolean;
  loadServerUrl: () => Promise<void>;
  setServerUrl: (url: string) => Promise<boolean>;
  testServerUrl: (url: string) => Promise<{ ok: boolean; message: string }>;

  /* ---------------- appearance ---------------- */
  themePreference: ThemeMode;
  accent: AccentKey;
  loveMode: boolean;
  heartMotion: boolean;
  glass: boolean;
  setThemePreference: (mode: ThemeMode) => void;
  setAccent: (accent: AccentKey) => void;
  setLoveMode: (value: boolean) => void;
  setHeartMotion: (value: boolean) => void;
  setGlass: (value: boolean) => void;
  hydrateTheme: () => Promise<void>;
  pushSettings: () => Promise<void>;
  settings: UserSettings | null;
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;

  /* ---------------- server health ---------------- */
  server: ServerInfo;
  checkServer: () => Promise<void>;
  setAutoReconnect: (value: boolean) => void;
  simulateOutage: () => void;
  health: { status: string; latencyMs: number; uptimeSeconds: number; services: { name: string; label: string; status: string; latencyMs: number; detail: string }[]; database: { driver: string; status: string; latencyMs: number }; version: string; region: string; checks: { name: string; ok: boolean; detail: string }[] } | null;
  loadHealth: () => Promise<void>;

  /* ---------------- pairing ---------------- */
  pairing: PairingStatus | null;
  pairingBusy: boolean;
  pairingError: string | null;
  loadPairing: () => Promise<void>;
  createCode: () => Promise<string | null>;
  acceptCode: (code: string) => Promise<boolean>;
  acceptToken: (token: string) => Promise<boolean>;
  unlink: () => Promise<void>;

  /* ---------------- realtime ---------------- */
  realtimeConnected: boolean;
  partnerOnline: boolean;
  partnerTyping: boolean;
  incomingCall: IncomingCall | null;
  activeCall: ActiveCall | null;
  connectRealtime: () => void;
  disconnectRealtime: () => void;
  answerIncomingCall: () => Promise<void>;
  declineIncomingCall: () => Promise<void>;
  setTyping: (conversationId: string, typing: boolean) => void;

  /* ---------------- domain data ---------------- */
  home: HomePayload | null;
  conversations: ConversationSummary[];
  messages: ChatMessage[];
  /** The shortcuts the server suggests for this couple. */
  quickReplies: string[];
  /** Which conversation the loaded messages belong to. */
  messagesFor: string | null;
  notes: NoteItem[];
  calls: CallLogItem[];
  dataLoading: boolean;
  loadHome: () => Promise<void>;
  loadConversations: () => Promise<void>;
  loadQuickReplies: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  loadNotes: () => Promise<void>;
  createNote: (input: { title: string; body?: string; category?: string; mood?: string | null }) => Promise<void>;
  loadCalls: () => Promise<void>;
  startCall: (kind: 'voice' | 'video') => Promise<string | null>;
  endCall: (callId: string) => Promise<void>;
  sendMessage: (conversationId: string, text: string, sticker?: string | null) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  refreshAll: () => Promise<void>;
};

const defaultServer: ServerInfo = {
  status: 'connecting',
  latency: 0,
  history: [],
  uptimeSeconds: 0,
  region: 'Singapore · ap-southeast',
  apiBase: getApiBaseUrl(),
  version: 'v3.0.0',
  lastChecked: 0,
  autoReconnect: true,
  error: null,
};

export const useStore = create<Store>((set, get) => ({
  /* ---------------- auth ---------------- */
  authStatus: 'loading',
  user: null,
  authError: null,
  authBusy: false,

  clearAuthError: () => set({ authError: null }),

  bootstrap: async () => {
    set({ authStatus: 'loading' });
    // The saved server address wins over the bundled default, so a broken
    // deployment can be replaced without rebuilding the app.
    await get().loadServerUrl();
    await get().hydrateTheme();
    const refreshToken = await loadRefreshToken();
    if (!refreshToken) {
      set({ authStatus: 'anonymous' });
      return;
    }
    try {
      // The free Render instance may still be booting — retry a few times
      // before giving up on the stored session.
      const user = await withRetry(() => api.me(), 3, 3000);
      set({ user, authStatus: 'authenticated' });
      get().connectRealtime();
      await get().loadPairing();
      await get().refreshAll();
    } catch (err) {
      // Only a rejected session clears the token; a network blip keeps it so
      // the next launch signs the user straight back in.
      if (err instanceof ApiError && err.status === 401) {
        await storeRefreshToken(null);
        setAccessToken(null);
      }
      set({ authStatus: 'anonymous', user: null });
    }
  },

  login: async (email, password) => {
    set({ authBusy: true, authError: null });
    try {
      // A sleeping Render instance answers with its loading page — retry a
      // few times before telling the user something went wrong.
      const result = await withRetry(() => api.login(email, password), 3, 3000);
      set({ user: result.user, authStatus: 'authenticated', authBusy: false, authError: null });
      get().connectRealtime();
      await get().hydrateTheme();
      await get().pushSettings();
      await get().loadPairing();
      await get().refreshAll();
      return true;
    } catch (err) {
      set({ authBusy: false, authError: describeError(err) });
      return false;
    }
  },

  register: async (email, password, displayName) => {
    set({ authBusy: true, authError: null });
    try {
      const result = await withRetry(() => api.register(email, password, displayName), 2, 3000);
      set({ user: result.user, authStatus: 'authenticated', authBusy: false, authError: null });
      get().connectRealtime();
      await get().hydrateTheme();
      await get().pushSettings();
      await get().loadPairing();
      await get().refreshAll();
      return true;
    } catch (err) {
      set({ authBusy: false, authError: describeError(err) });
      return false;
    }
  },

  logout: async () => {
    await api.logout();
    get().disconnectRealtime();
    set({
      user: null,
      authStatus: 'anonymous',
      pairing: null,
      home: null,
      conversations: [],
      messages: [],
      notes: [],
      calls: [],
    });
  },

  /* ---------------- which server ---------------- */
  serverUrl: getApiBaseUrl(),
  serverUrlSaved: false,

  loadServerUrl: async () => {
    try {
      const raw = await AsyncStorage.getItem(SERVER_URL_KEY);
      if (raw) {
        const url = normalizeBaseUrl(raw);
        setApiBaseUrl(url);
        set((prev) => ({
          serverUrl: url,
          serverUrlSaved: true,
          server: { ...prev.server, apiBase: url },
        }));
      }
    } catch {
      /* storage unavailable — keep the bundled default */
    }
  },

  setServerUrl: async (url) => {
    const trimmed = (url ?? '').trim();
    if (!trimmed) return false;
    const normalized = normalizeBaseUrl(trimmed);
    setApiBaseUrl(normalized);
    try {
      await AsyncStorage.setItem(SERVER_URL_KEY, normalized);
    } catch {
      /* storage unavailable — the address still applies for this session */
    }
    // The session belongs to the old server — start clean.
    await storeRefreshToken(null);
    setAccessToken(null);
    get().disconnectRealtime();
    set((prev) => ({
      serverUrl: normalized,
      serverUrlSaved: true,
      user: null,
      authStatus: 'anonymous',
      authError: null,
      home: null,
      conversations: [],
      messages: [],
      notes: [],
      calls: [],
      server: { ...prev.server, apiBase: normalized, status: 'connecting', latency: 0 },
    }));
    await get().checkServer();
    return true;
  },

  testServerUrl: async (url) => probeServer(url),

  /* ---------------- appearance ---------------- */
  themePreference: 'light',
  accent: 'violet',
  loveMode: false,
  heartMotion: true,
  glass: true,
  settings: null,

  loadSettings: async () => {
    try {
      const { settings } = await api.settings();
      set({ settings });
    } catch {
      /* keep the last known settings */
    }
  },

  updateSettings: async (patch) => {
    try {
      const { settings } = await api.updateSettings(patch);
      set({ settings });
    } catch {
      /* keep local state; it syncs on the next successful call */
    }
  },

  hydrateTheme: async () => {
    try {
      const raw = await AsyncStorage.getItem(THEME_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedTheme;
        set({
          themePreference: parsed.themePreference ?? 'light',
          accent: parsed.accent ?? 'violet',
          loveMode: parsed.loveMode ?? false,
          heartMotion: parsed.heartMotion ?? true,
          glass: parsed.glass ?? true,
        });
      }
    } catch {
      /* keep defaults */
    }
    // The server is the source of truth for preferences across devices.
    try {
      const { settings } = await api.settings();
      set({
        settings,
        themePreference: settings.theme,
        accent: settings.accent,
        loveMode: settings.loveMode,
        heartMotion: settings.heartMotion,
        glass: settings.glass,
      });
      await persistTheme(get());
    } catch {
      /* offline — local preferences still apply */
    }
  },

  setThemePreference: (mode) => {
    set({ themePreference: mode });
    void persistTheme(get());
    void get().pushSettings();
  },

  setAccent: (accent) => {
    set({ accent, loveMode: accent === 'rose' ? get().loveMode : false });
    void persistTheme(get());
    void get().pushSettings();
  },

  setLoveMode: (loveMode) => {
    set({ loveMode, accent: loveMode ? 'rose' : get().accent });
    void persistTheme(get());
    void get().pushSettings();
  },

  setHeartMotion: (heartMotion) => {
    set({ heartMotion });
    void persistTheme(get());
    void get().pushSettings();
  },

  setGlass: (glass) => {
    set({ glass });
    void persistTheme(get());
    void get().pushSettings();
  },

  pushSettings: async () => {
    const s = get();
    const patch: Partial<UserSettings> = {
      theme: s.themePreference,
      accent: s.accent,
      loveMode: s.loveMode,
      heartMotion: s.heartMotion,
      glass: s.glass,
    };
    try {
      await api.updateSettings(patch);
    } catch {
      /* keep local state; it will sync on the next successful call */
    }
  },

  /* ---------------- server health ---------------- */
  server: defaultServer,

  checkServer: async () => {
    set((prev) => ({ server: { ...prev.server, status: 'connecting' } }));
    const result = await pingServer();
    set((prev) => ({
      server: {
        ...prev.server,
        status: result.ok ? 'online' : 'offline',
        latency: result.latencyMs,
        history: [...prev.server.history.slice(-23), result.latencyMs],
        lastChecked: Date.now(),
        apiBase: getApiBaseUrl(),
        error: result.error ?? null,
      },
    }));
    if (result.ok) {
      const health = await get().health;
      if (health) {
        set((prev) => ({
          server: {
            ...prev.server,
            uptimeSeconds: health.uptimeSeconds,
            region: health.region,
            version: `v${health.version}`,
            apiBase: health.region ? prev.server.apiBase : prev.server.apiBase,
          },
        }));
      }
    }
  },

  setAutoReconnect: (value) => {
    set((prev) => ({ server: { ...prev.server, autoReconnect: value } }));
  },

  /** Mirrors the web build's "Simulate outage" — the heartbeat reconnects. */
  simulateOutage: () => {
    set((prev) => ({
      server: { ...prev.server, status: 'offline', latency: 0, error: 'Simulated outage' },
    }));
  },

  health: null,

  loadHealth: async () => {
    try {
      const payload = await api.health();
      set({
        health: {
          status: payload.status,
          latencyMs: payload.latencyMs,
          uptimeSeconds: payload.uptimeSeconds,
          services: payload.services,
          database: {
            driver: payload.database.driver,
            status: payload.database.status,
            latencyMs: payload.database.latencyMs,
          },
          version: payload.version,
          region: payload.region,
          checks: payload.checks,
        },
      });
      set((prev) => ({
        server: {
          ...prev.server,
          status: payload.status === 'down' ? 'offline' : 'online',
          latency: payload.latencyMs,
          uptimeSeconds: payload.uptimeSeconds,
          region: payload.region,
          version: `v${payload.version}`,
          lastChecked: Date.now(),
          history: [...prev.server.history.slice(-23), payload.latencyMs],
        },
      }));
    } catch {
      set((prev) => ({
        server: { ...prev.server, status: 'offline', lastChecked: Date.now() },
      }));
    }
  },

  /* ---------------- pairing ---------------- */
  pairing: null,
  pairingBusy: false,
  pairingError: null,

  loadPairing: async () => {
    try {
      const status = await api.pairingStatus();
      set({ pairing: status, pairingError: null });
    } catch (err) {
      set({ pairingError: err instanceof ApiError ? err.message : 'Could not load pairing state' });
    }
  },

  createCode: async () => {
    set({ pairingBusy: true, pairingError: null });
    try {
      const invitation = await api.createInvitation();
      set((prev) => ({
        pairing: prev.pairing
          ? {
              ...prev.pairing,
              phase: 'outgoing',
              code: invitation.code,
              qrPayload: invitation.qrPayload,
              expiresAt: invitation.expiresAt,
            }
          : prev.pairing,
      }));
      await get().loadPairing();
      return invitation.code;
    } catch (err) {
      set({ pairingBusy: false, pairingError: err instanceof Error ? err.message : 'Failed' });
      return null;
    } finally {
      set({ pairingBusy: false });
    }
  },

  acceptCode: async (code) => {
    set({ pairingBusy: true, pairingError: null });
    try {
      const status = await api.acceptByCode(code);
      set({ pairing: status, pairingBusy: false });
      await get().refreshAll();
      return true;
    } catch (err) {
      set({
        pairingBusy: false,
        pairingError: err instanceof ApiError ? err.message : 'That code did not work',
      });
      return false;
    }
  },

  acceptToken: async (token) => {
    set({ pairingBusy: true, pairingError: null });
    try {
      const status = await api.acceptByToken(token);
      set({ pairing: status, pairingBusy: false });
      await get().refreshAll();
      return true;
    } catch (err) {
      set({
        pairingBusy: false,
        pairingError: err instanceof ApiError ? err.message : 'That QR code did not work',
      });
      return false;
    }
  },

  unlink: async () => {
    try {
      const status = await api.unlink();
      set({ pairing: status });
      await get().refreshAll();
    } catch {
      /* keep current state */
    }
  },

  /* ---------------- realtime ---------------- */
  realtimeConnected: false,
  partnerOnline: false,
  partnerTyping: false,
  incomingCall: null,
  activeCall: null,

  connectRealtime: () => {
    realtime.connect({
      onConnected: (connected) => set({ realtimeConnected: connected }),
      onMessage: (raw) => {
        const current = get().messagesFor;
        if (current && raw.conversationId !== current) {
          // The thread is not open — refresh the list so the unread badge is right.
          void get().loadConversations();
          return;
        }
        // The server sends one message to the whole room, so "me" depends on
        // who is reading it.
        const me = get().user?.id;
        const message: ChatMessage = raw.senderId && me
          ? { ...raw, from: raw.senderId === me ? 'me' : 'partner' }
          : raw;
        set((prev) => {
          if (!current) return prev;
          const known = prev.messages.findIndex(
            (m) => m.id === message.id || m.clientMessageId === message.clientMessageId,
          );
          if (known === -1) return { messages: [...prev.messages, message] };
          const messages = [...prev.messages];
          messages[known] = { ...messages[known], ...message };
          return { messages };
        });
      },
      onMessageStatus: ({ messageId, status }) => {
        set((prev) => ({
          messages: prev.messages.map((m) =>
            m.id === messageId || m.clientMessageId === messageId
              ? { ...m, status: status as ChatMessage['status'] }
              : m,
          ),
        }));
      },
      onTyping: ({ conversationId, typing }) => {
        if (conversationId !== get().messagesFor) return;
        set({ partnerTyping: typing });
      },
      onPresence: ({ userId, online }) => {
        set((prev) => ({
          partnerOnline: prev.user && userId !== prev.user.id ? online : prev.partnerOnline,
        }));
      },
      onPairMatched: () => {
        void get().loadPairing();
        void get().refreshAll();
      },
      onCallIncoming: (payload) => {
        set({
          incomingCall: { ...payload, at: Date.now() },
        });
      },
      onCallAnswered: ({ callId }) => {
        set((prev) => ({
          activeCall:
            prev.activeCall?.callId === callId
              ? { ...prev.activeCall, state: 'active', startedAt: Date.now() }
              : prev.activeCall,
        }));
      },
      onCallDeclined: ({ callId }) => {
        set((prev) => ({
          activeCall:
            prev.activeCall?.callId === callId ? { ...prev.activeCall, state: 'ended' } : prev.activeCall,
          incomingCall: prev.incomingCall?.callId === callId ? null : prev.incomingCall,
        }));
      },
      onCallEnded: ({ callId }) => {
        set((prev) => ({
          activeCall:
            prev.activeCall?.callId === callId ? { ...prev.activeCall, state: 'ended' } : prev.activeCall,
          incomingCall: prev.incomingCall?.callId === callId ? null : prev.incomingCall,
        }));
        void get().loadCalls();
      },
    });
  },

  disconnectRealtime: () => {
    realtime.disconnect();
    set({ realtimeConnected: false, partnerTyping: false });
  },

  answerIncomingCall: async () => {
    const call = get().incomingCall;
    if (!call) return;
    set({
      incomingCall: null,
      activeCall: { callId: call.callId, kind: call.kind, state: 'active', startedAt: Date.now() },
    });
    realtime.answerCall(call.callId);
    try {
      await api.answerCall(call.callId);
    } catch {
      /* the socket already told the partner */
    }
  },

  declineIncomingCall: async () => {
    const call = get().incomingCall;
    if (!call) return;
    set({ incomingCall: null });
    realtime.rejectCall(call.callId);
    try {
      await api.rejectCall(call.callId);
    } catch {
      /* the socket already told the caller */
    }
  },

  setTyping: (conversationId, typing) => {
    realtime.setTyping(conversationId, typing);
  },

  /* ---------------- domain data ---------------- */
  home: null,
  conversations: [],
  messages: [],
  messagesFor: null,
  quickReplies: [],
  notes: [],
  calls: [],
  dataLoading: false,

  loadHome: async () => {
    try {
      set({ home: await api.home() });
    } catch {
      /* keep last known payload */
    }
  },

  loadConversations: async () => {
    try {
      const { conversations } = await api.conversations();
      set({ conversations });
    } catch {
      /* keep last known list */
    }
  },

  loadQuickReplies: async () => {
    try {
      const { replies } = await api.quickReplies();
      if (Array.isArray(replies) && replies.length) set({ quickReplies: replies });
    } catch {
      /* the composer still works without them */
    }
  },

  loadMessages: async (conversationId) => {
    try {
      const { messages } = await api.messages(conversationId);
      set({ messages, messagesFor: conversationId });
      realtime.markRead(conversationId);
    } catch {
      /* keep last known list */
    }
  },

  loadNotes: async () => {
    try {
      const { notes } = await api.notes();
      set({ notes });
    } catch {
      /* keep last known list */
    }
  },

  createNote: async (input) => {
    try {
      const { note } = await api.createNote(input);
      set((prev) => ({ notes: [note, ...prev.notes] }));
    } catch {
      /* the sheet stays open so the text is not lost */
    }
  },

  loadCalls: async () => {
    try {
      const { calls } = await api.calls();
      set({ calls });
    } catch {
      /* keep last known list */
    }
  },

  startCall: async (kind) => {
    try {
      const { call } = await api.startCall(kind);
      set((prev) => ({
        calls: [call, ...prev.calls],
        activeCall: { callId: call.id, kind, state: 'ringing', startedAt: null },
      }));
      // Ring the partner on the realtime channel.
      realtime.inviteCall(kind, call.id);
      return call.id;
    } catch {
      return null;
    }
  },

  endCall: async (callId) => {
    try {
      const { call } = await api.endCall(callId);
      set((prev) => ({
        calls: prev.calls.map((c) => (c.id === call.id ? call : c)),
        activeCall: prev.activeCall?.callId === callId ? { ...prev.activeCall, state: 'ended' } : prev.activeCall,
      }));
    } catch {
      /* keep the local copy */
    }
    realtime.endCall(callId);
  },

  sendMessage: async (conversationId, text, sticker) => {
    const clientMessageId = `rn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: ChatMessage = {
      id: clientMessageId,
      clientMessageId,
      conversationId,
      senderId: get().user?.id ?? '',
      from: 'me',
      text,
      sticker: sticker ?? null,
      type: sticker ? 'STICKER' : 'TEXT',
      createdAt: new Date().toISOString(),
      time: new Date()
        .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        .toLowerCase()
        .replace(/\s/g, ' ')
        .replace(/^0/, ''),
      status: 'sent',
      reactions: [],
    };
    set((prev) => ({ messages: [...prev.messages, optimistic] }));
    try {
      const { message } = await api.sendMessage(conversationId, clientMessageId, text, sticker);
      set((prev) => ({
        messages: prev.messages.map((m) => (m.clientMessageId === clientMessageId ? message : m)),
      }));
    } catch {
      set((prev) => ({
        messages: prev.messages.map((m) =>
          m.clientMessageId === clientMessageId ? { ...m, status: 'sent' } : m,
        ),
      }));
    }
  },

  toggleReaction: async (messageId, emoji) => {
    try {
      const { reactions } = await api.react(messageId, emoji);
      set((prev) => ({
        messages: prev.messages.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
      }));
    } catch {
      /* ignore — reaction stays local-only */
    }
  },

  refreshAll: async () => {
    set({ dataLoading: true });
    await Promise.all([
      get().loadHome(),
      get().loadConversations(),
      get().loadQuickReplies(),
      get().loadNotes(),
      get().loadCalls(),
      get().checkServer(),
    ]);
    set({ dataLoading: false });
  },
}));

async function persistTheme(state: Store): Promise<void> {
  const payload: PersistedTheme = {
    themePreference: state.themePreference,
    accent: state.accent,
    loveMode: state.loveMode,
    heartMotion: state.heartMotion,
    glass: state.glass,
  };
  try {
    await AsyncStorage.setItem(THEME_KEY, JSON.stringify(payload));
  } catch {
    /* storage unavailable */
  }
}

/** Wire the 401 handler once at startup. */
export function installSessionGuard(): void {
  setUnauthorizedHandler(() => {
    useStore.setState({ user: null, authStatus: 'anonymous' });
  });
}
