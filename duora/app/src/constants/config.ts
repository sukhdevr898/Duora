/**
 * Runtime configuration. All public vars are prefixed EXPO_PUBLIC_ and inlined
 * by Expo at build time. Secrets never belong here.
 */
export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.0.2.2:4000/api/v1',
  wsUrl: process.env.EXPO_PUBLIC_WS_URL ?? 'http://10.0.2.2:4000',
  env: (process.env.EXPO_PUBLIC_ENV ?? 'development') as 'development' | 'staging' | 'production',
  versionEndpoint: process.env.EXPO_PUBLIC_VERSION_ENDPOINT ?? '',
  easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '',
} as const;

export function buildUrl(path: string): string {
  const normalizedBase = config.apiBaseUrl.endsWith('/')
    ? config.apiBaseUrl.slice(0, -1)
    : config.apiBaseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export const pagination = {
  initialPageSize: 40,
  maxPageSize: 50,
} as const;

export const timing = {
  typingThrottleMs: 2500,
  presenceThrottleMs: 5000,
  socketConnectTimeoutMs: 15_000,
  callRingTimeoutMs: 90_000,
} as const;
