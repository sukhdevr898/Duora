import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import { prisma } from '../../database/prisma';
import { asyncHandler } from '../../utils/asyncHandler';

export const healthRouter = Router();

// Liveness — process is up
healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'duora-server', time: new Date().toISOString() });
});

// Readiness — dependencies reachable
healthRouter.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ready', database: 'up', fcmConfigured: env.firebaseConfigured });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'down' });
    }
  }),
);

// In-app update contract (documented in docs/api.md). No invented endpoint —
// this is the contract the app's update check is built against.
export const appRouter = Router();

const versionQuery = z.object({
  platform: z.enum(['android', 'ios']).default('android'),
  version: z.string().min(1).max(40).optional(),
});

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => Number(n) || 0);
  const pb = b.split('.').map((n) => Number(n) || 0);
  for (let i = 0; i < 3; i += 1) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1;
  }
  return 0;
}

appRouter.get(
  '/app/version',
  asyncHandler(async (req, res) => {
    const { platform, version } = versionQuery.parse(req.query);
    const latestVersion = platform === 'android' ? env.ANDROID_LATEST_VERSION : env.ANDROID_LATEST_VERSION;
    const minSupported = env.ANDROID_MIN_SUPPORTED_VERSION;
    const updateRequired = version ? compareSemver(version, minSupported) < 0 : false;
    const updateAvailable = version ? compareSemver(latestVersion, version) > 0 : false;
    res.json({
      platform,
      latestVersion,
      minSupportedVersion: minSupported,
      updateAvailable,
      updateRequired,
      releaseUrl: env.ANDROID_RELEASE_URL,
      checkedAt: new Date().toISOString(),
    });
  }),
);
