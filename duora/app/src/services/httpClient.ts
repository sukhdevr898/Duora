import { buildUrl, config } from '../constants/config';
import { ApiClientError, type ApiErrorBody } from '../types/api';
import type { AuthTokens } from '../types/models';
import { getAuthSnapshot, useAuthStore } from '../state/auth.store';
import { logger } from '../utils/logger';

const REQUEST_TIMEOUT_MS = 20_000;

let refreshInFlight: Promise<AuthTokens | null> | null = null;
let onSessionExpired: (() => void) | null = null;

export function registerSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

async function refreshTokens(): Promise<AuthTokens | null> {
  const snapshot = getAuthSnapshot();
  const refreshToken = snapshot.tokens?.refreshToken;
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) return null;
        const data = (await response.json()) as { tokens: AuthTokens };
        useAuthStore.getState().setTokens(data.tokens);
        return data.tokens;
      } catch (err) {
        logger.warn('httpClient', 'token refresh failed', err);
        return null;
      } finally {
        // Release the single-flight lock on the next tick.
        setTimeout(() => {
          refreshInFlight = null;
        }, 0);
      }
    })();
  }
  return refreshInFlight;
}

export interface RequestOptions {
  auth?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = true, timeoutMs = REQUEST_TIMEOUT_MS } = options;
  return execute<T>(method, path, body, auth, timeoutMs, true);
}

async function execute<T>(
  method: string,
  path: string,
  body: unknown,
  auth: boolean,
  timeoutMs: number,
  allowRefresh: boolean,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers: Record<string, string> = { accept: 'application/json' };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (auth) {
    const token = getAuthSnapshot().tokens?.accessToken;
    if (token) headers.authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new ApiClientError(0, 'network_error', `Cannot reach ${config.env} server`);
  }
  clearTimeout(timer);

  if (response.status === 401 && auth && allowRefresh) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      return execute<T>(method, path, body, auth, timeoutMs, false);
    }
    useAuthStore.getState().clear();
    onSessionExpired?.();
    throw new ApiClientError(401, 'session_expired', 'Your session has expired. Please sign in again.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const parsed = data as ApiErrorBody | null;
    throw new ApiClientError(
      response.status,
      parsed?.error.code ?? 'unknown_error',
      parsed?.error.message ?? `Request failed (${response.status})`,
      parsed?.error.details,
    );
  }

  return data as T;
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('DELETE', path, body, options),
};
