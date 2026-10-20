import * as Application from 'expo-application';
import { buildUrl, config } from '../../constants/config';
import { http } from '../../services/httpClient';
import type { VersionInfo } from '../../types/models';

/**
 * Update check against the documented contract. Offline/error failures are
 * returned (never thrown) so the app can continue without blocking startup.
 */
export async function checkForUpdates(): Promise<
  { ok: true; info: VersionInfo } | { ok: false; reason: string }
> {
  try {
    const installed = Application.nativeApplicationVersion ?? '0.0.0';
    if (config.versionEndpoint) {
      const response = await fetch(
        `${config.versionEndpoint}?platform=android&version=${encodeURIComponent(installed)}`,
      );
      if (!response.ok) return { ok: false, reason: `HTTP ${response.status}` };
      return { ok: true, info: (await response.json()) as VersionInfo };
    }
    const info = await http.get<VersionInfo>(
      `/app/version?platform=android&version=${encodeURIComponent(installed)}`,
    );
    return { ok: true, info };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'update check failed' };
  }
}

export { buildUrl };
