/**
 * HTTP client for the Duora Node server.
 *
 * • base URL comes from EXPO_PUBLIC_API_URL (defaults to the Render deployment)
 * • access tokens live in memory, refresh tokens in the device keystore
 * • a 401 triggers exactly one refresh + replay
 */
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import type {
  AuthResult,
  CallLogItem,
  ChatMessage,
  ConversationSummary,
  HealthPayload,
  HomePayload,
  NoteItem,
  PairingStatus,
  PublicUser,
  ServerInfo,
  UserSettings,
} from './types';

const REFRESH_KEY = 'duora.refreshToken';

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, '');
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (extra?.apiUrl) return extra.apiUrl.replace(/\/$/, '');
  return 'https://duora-server.onrender.com';
}

export const API_BASE_URL = resolveBaseUrl();

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

export async function loadRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

export async function storeRefreshToken(token: string | null): Promise<void> {
  try {
    if (token) await SecureStore.setItemAsync(REFRESH_KEY, token);
    else await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch {
    /* keystore unavailable — session stays in memory only */
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ApiError(0, 'network_error', 'Cannot reach the Duora server');
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : {};

  if (!response.ok) {
    const error = (data as { error?: { code?: string; message?: string } }).error;
    if (response.status === 401 && auth) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return request<T>(path, { ...options, body, auth });
      }
      onUnauthorized?.();
    }
    throw new ApiError(
      response.status,
      error?.code ?? 'request_failed',
      error?.message ?? `Request failed (${response.status})`,
    );
  }

  return data as T;
}

/** Single-flight refresh — parallel 401s share one refresh round-trip. */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const token = await loadRefreshToken();
      if (!token) return null;
      const result = await request<AuthResult>('/api/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken: token },
        auth: false,
      });
      accessToken = result.accessToken;
      await storeRefreshToken(result.refreshToken);
      return accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

/* ------------------------------------------------------------------ */
/* Endpoints                                                          */
/* ------------------------------------------------------------------ */

export const api = {
  /* auth */
  async register(email: string, password: string, displayName: string): Promise<AuthResult> {
    const result = await request<AuthResult>('/api/v1/auth/register', {
      method: 'POST',
      body: { email, password, displayName },
      auth: false,
    });
    accessToken = result.accessToken;
    await storeRefreshToken(result.refreshToken);
    return result;
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const result = await request<AuthResult>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    accessToken = result.accessToken;
    await storeRefreshToken(result.refreshToken);
    return result;
  },

  async logout(): Promise<void> {
    const token = await loadRefreshToken();
    if (token) {
      await request<void>('/api/v1/auth/logout', { method: 'POST', body: { refreshToken: token } }).catch(
        () => undefined,
      );
    }
    accessToken = null;
    await storeRefreshToken(null);
  },

  async me(): Promise<PublicUser> {
    const result = await request<{ user: PublicUser }>('/api/v1/auth/me');
    return result.user;
  },

  /* pairing */
  pairingStatus: () => request<PairingStatus>('/api/v1/pairing/status'),
  createInvitation: () =>
    request<{ code: string; token: string; qrPayload: string; expiresAt: string }>(
      '/api/v1/pairing/invitation',
      { method: 'POST' },
    ),
  acceptByCode: (code: string) =>
    request<PairingStatus>('/api/v1/pairing/accept', { method: 'POST', body: { code } }),
  acceptByToken: (token: string) =>
    request<PairingStatus>('/api/v1/pairing/scan', { method: 'POST', body: { token } }),
  resolveQr: (data: string) =>
    request<{ token: string }>('/api/v1/pairing/resolve', { method: 'POST', body: { data } }),
  unlink: () => request<PairingStatus>('/api/v1/pairing', { method: 'DELETE' }),

  /* chat */
  conversations: () => request<{ conversations: ConversationSummary[] }>('/api/v1/chat/conversations'),
  messages: (conversationId: string) =>
    request<{ messages: ChatMessage[] }>(
      `/api/v1/chat/conversations/${conversationId}/messages?limit=80`,
    ),
  sendMessage: (conversationId: string, clientMessageId: string, text: string, sticker?: string | null) =>
    request<{ message: ChatMessage }>(`/api/v1/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { clientMessageId, text, sticker: sticker ?? null },
    }),
  markRead: (conversationId: string) =>
    request<{ marked: number }>(`/api/v1/chat/conversations/${conversationId}/read`, { method: 'POST' }),
  react: (messageId: string, emoji: string) =>
    request<{ reactions: string[] }>(`/api/v1/chat/messages/${messageId}/reactions`, {
      method: 'POST',
      body: { emoji },
    }),
  hideMessage: (messageId: string) =>
    request<void>(`/api/v1/chat/messages/${messageId}`, { method: 'DELETE' }),

  /* calls */
  calls: () => request<{ calls: CallLogItem[] }>('/api/v1/calls'),
  startCall: (kind: 'voice' | 'video') =>
    request<{ call: CallLogItem }>('/api/v1/calls', { method: 'POST', body: { kind } }),
  endCall: (callId: string) =>
    request<{ call: CallLogItem }>(`/api/v1/calls/${callId}/end`, { method: 'POST' }),

  /* notes */
  notes: () => request<{ notes: NoteItem[] }>('/api/v1/notes'),
  createNote: (input: { title: string; body?: string; category?: string; mood?: string | null }) =>
    request<{ note: NoteItem }>('/api/v1/notes', { method: 'POST', body: input }),
  deleteNote: (noteId: string) => request<void>(`/api/v1/notes/${noteId}`, { method: 'DELETE' }),

  /* settings */
  settings: () => request<{ settings: UserSettings }>('/api/v1/settings'),
  updateSettings: (patch: Partial<UserSettings>) =>
    request<{ settings: UserSettings }>('/api/v1/settings', { method: 'PATCH', body: patch }),

  /* home + health */
  home: () => request<HomePayload>('/api/v1/home'),
  health: () => request<HealthPayload>('/api/v1/health'),
};

/** Measures the live round-trip to the server — powers the health ring. */
export async function pingServer(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const t0 = Date.now();
  try {
    await request<HealthPayload>('/api/v1/health', { auth: false });
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    return { ok: false, latencyMs: 0, error: err instanceof Error ? err.message : 'unreachable' };
  }
}

export type { ServerInfo };
