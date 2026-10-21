/**
 * HTTP client for the Duora Node server.
 *
 * • base URL comes from the app settings (so a broken deployment can be
 *   swapped in-app), then EXPO_PUBLIC_API_URL, then app.json, then Render
 * • access tokens live in memory, refresh tokens in the device keystore
 * • a 401 triggers exactly one refresh + replay
 * • every failure is turned into a friendly, human readable message
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

/**
 * Where the app talks to the API by default.
 *
 * 1. `EXPO_PUBLIC_API_URL` (build/dev env) — wins, handy for a LAN server.
 * 2. `expo.extra.apiUrl` in app.json — baked into the published build.
 * 3. The live Render deployment.
 */
export const PRODUCTION_API_URL = 'https://duora.onrender.com';

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && fromEnv.length > 0) return normalizeBaseUrl(fromEnv);
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (extra?.apiUrl) return normalizeBaseUrl(extra.apiUrl);
  return PRODUCTION_API_URL;
}

/** `duora.onrender.com` → `https://duora.onrender.com` (no trailing slash). */
export function normalizeBaseUrl(raw: string): string {
  let url = (raw ?? '').trim();
  if (!url) return PRODUCTION_API_URL;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, '');
}

/** Live binding — updated by `setApiBaseUrl` when the user changes the server. */
export let API_BASE_URL = resolveBaseUrl();

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/** Points the app at a different Duora server. */
export function setApiBaseUrl(raw: string): string {
  API_BASE_URL = normalizeBaseUrl(raw);
  return API_BASE_URL;
}

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
  /** Milliseconds before the request is aborted. */
  timeoutMs?: number;
};

/** Default request budget — a sleeping Render instance answers in ~30 s. */
const DEFAULT_TIMEOUT_MS = 30_000;
/**
 * Signing in and signing up get a bigger budget: a cold Render free-tier
 * instance can take a full minute to boot before it answers the first call.
 */
const AUTH_TIMEOUT_MS = 75_000;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  // Abort slow requests so the UI never hangs on a sleeping server.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw new ApiError(0, 'timeout', 'The server took too long to answer');
    }
    throw new ApiError(0, 'network_error', 'Cannot reach the Duora server');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();

  // Render answers with an HTML "application loading" page while the free
  // instance boots — that is not JSON, so treat it as "not ready yet".
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new ApiError(0, 'not_ready', 'The server is waking up — try again in a moment');
    }
  }

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
/* Errors the user can act on                                         */
/* ------------------------------------------------------------------ */

export type ErrorKind =
  | 'offline'
  | 'waking'
  | 'auth'
  | 'conflict'
  | 'validation'
  | 'server'
  | 'unknown';

export type ErrorInfo = {
  kind: ErrorKind;
  /** Short headline — "Server is waking up". */
  title: string;
  /** The sentence under the headline. */
  message: string;
  /** Label of the recovery button. */
  action: string;
};

/**
 * Turns any failure into something a person can read and act on.
 * The API never shows a raw status code to the user.
 */
export function describeError(error: unknown): ErrorInfo {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      if (error.code === 'not_ready') {
        return {
          kind: 'waking',
          title: 'Server is waking up',
          message:
            'The Duora server is not answering yet — it may be asleep or still starting up. Give it a moment, then tap retry.',
          action: 'Wake it up',
        };
      }
      if (error.code === 'timeout') {
        return {
          kind: 'waking',
          title: 'Server took too long',
          message:
            'The server did not answer in time. It may still be starting up — wait a moment and try again.',
          action: 'Try again',
        };
      }
      return {
        kind: 'offline',
        title: 'Cannot reach the server',
        message:
          'We could not reach the Duora server. Check your internet connection, or point the app at another server address.',
        action: 'Try again',
      };
    }
    if (error.status === 401) {
      return {
        kind: 'auth',
        title: 'That did not match',
        message: error.message || 'Email or password is wrong.',
        action: 'Try again',
      };
    }
    if (error.status === 403) {
      return {
        kind: 'auth',
        title: 'Not allowed',
        message: error.message || 'This account cannot do that yet.',
        action: 'Try again',
      };
    }
    if (error.status === 409) {
      return {
        kind: 'conflict',
        title: 'Already taken',
        message: error.message || 'That email is already registered.',
        action: 'Sign in instead',
      };
    }
    if (error.status === 400 || error.status === 422) {
      return {
        kind: 'validation',
        title: 'Check the details',
        message: error.message || 'Some of the details are not right.',
        action: 'Fix it',
      };
    }
    if (error.status >= 500) {
      return {
        kind: 'server',
        title: 'The server stumbled',
        message: 'The Duora server ran into a problem. Give it a moment and try again.',
        action: 'Try again',
      };
    }
    return {
      kind: 'unknown',
      title: 'Something went wrong',
      message: error.message || `Request failed (${error.status}).`,
      action: 'Try again',
    };
  }
  return {
    kind: 'unknown',
    title: 'Something went wrong',
    message: error instanceof Error ? error.message : 'Please try again.',
    action: 'Try again',
  };
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
      timeoutMs: AUTH_TIMEOUT_MS,
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
      timeoutMs: AUTH_TIMEOUT_MS,
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
    // Short budget: a sleeping Render instance answers with a loading page,
    // the heartbeat then retries until the service is really up.
    await request<HealthPayload>('/api/v1/health', { auth: false, timeoutMs: 12_000 });
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    return { ok: false, latencyMs: 0, error: err instanceof Error ? err.message : 'unreachable' };
  }
}

/**
 * Checks a candidate server address without touching the saved one.
 * Used by the server screen so a wrong URL is obvious straight away.
 */
export async function probeServer(
  rawUrl: string,
): Promise<{ ok: boolean; message: string; payload?: HealthPayload }> {
  const url = normalizeBaseUrl(rawUrl);
  const t0 = Date.now();
  // A manual controller — `AbortSignal.timeout` is missing in Hermes.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${url}/api/v1/health`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      return { ok: false, message: `The server answered with ${response.status}.` };
    }
    try {
      const payload = JSON.parse(text) as HealthPayload;
      return {
        ok: true,
        message: `Connected in ${Date.now() - t0} ms · ${payload.version ?? 'server'} on ${payload.database?.driver ?? 'database'}.`,
        payload,
      };
    } catch {
      return {
        ok: false,
        message: 'That address answered, but it is not a Duora server yet.',
      };
    }
  } catch (err) {
    const info = describeError(err);
    return { ok: false, message: info.message };
  } finally {
    clearTimeout(timer);
  }
}

/** Retries `fn` while it fails with a transport error (server waking up). */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 2500): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const transport = err instanceof ApiError && err.status === 0;
      if (!transport || attempt === attempts - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

export type { ServerInfo };
