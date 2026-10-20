import fs from 'node:fs';
import { cert, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { prisma } from '../../database/prisma';

let firebaseApp: App | null = null;
let initAttempted = false;

function getMessagingClient(): ReturnType<typeof getMessaging> | null {
  if (initAttempted) return firebaseApp ? getMessaging(firebaseApp) : null;
  initAttempted = true;
  try {
    if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = JSON.parse(fs.readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'));
      firebaseApp = initializeApp({ credential: cert(serviceAccount) });
    } else if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          // Docker/ENV multiline escaping: replace literal \n with real newlines
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      logger.warn('Firebase credentials not configured — push notifications will be skipped');
      return null;
    }
    logger.info('Firebase Admin initialized for FCM');
  } catch (err) {
    logger.error({ err }, 'Failed to initialize Firebase Admin — push disabled');
    firebaseApp = null;
  }
  return firebaseApp ? getMessaging(firebaseApp) : null;
}

export interface PushPayload {
  title: string;
  body: string;
  data: Record<string, string>;
  channelId?: 'messages' | 'incoming_calls' | 'missed_calls';
  /** High-priority ring-style notification for incoming calls. */
  ring?: boolean;
}

/**
 * Sends an FCM message to every registered device of a user.
 * Stale/invalid tokens are pruned. Failures never break the calling flow.
 */
export async function sendToUser(userId: string, payload: PushPayload): Promise<void> {
  const client = getMessagingClient();
  const devices = await prisma.device.findMany({ where: { userId } });
  if (devices.length === 0) return;

  if (!client) {
    logger.debug({ userId, kind: payload.data.kind }, 'Push skipped (FCM not configured)');
    return;
  }

  const results = await Promise.allSettled(
    devices.map((device) =>
      client.send({
        token: device.pushToken,
        notification: { title: payload.title, body: payload.body },
        android: {
          priority: payload.ring ? 'high' : 'normal',
          notification: {
            channelId: payload.channelId ?? 'messages',
            sound: payload.ring ? 'ringtone' : 'default',
          },
        },
        data: payload.data,
      }),
    ),
  );

  const deadTokens: string[] = [];
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const reason = String((result.reason as { code?: string })?.code ?? result.reason);
      if (reason.includes('registration-token-not-registered') || reason.includes('invalid-argument')) {
        deadTokens.push(devices[index].pushToken);
      }
      logger.warn({ reason, userId }, 'FCM send failed');
    }
  });
  if (deadTokens.length > 0) {
    await prisma.device.deleteMany({ where: { pushToken: { in: deadTokens } } });
  }
}
