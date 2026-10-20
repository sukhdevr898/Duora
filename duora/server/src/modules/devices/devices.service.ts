import { prisma } from '../../database/prisma';

export interface PushDeviceInput {
  pushToken: string;
  platform: 'android' | 'ios' | 'web';
  deviceId?: string;
}

/**
 * Registers or re-owns a push token. Tokens are globally unique because FCM
 * tokens are per physical app install and can move when an account is switched.
 */
export async function upsertPushToken(userId: string, input: PushDeviceInput) {
  return prisma.device.upsert({
    where: { pushToken: input.pushToken },
    create: {
      userId,
      pushToken: input.pushToken,
      platform: input.platform,
      deviceId: input.deviceId ?? null,
      lastSeenAt: new Date(),
    },
    update: { userId, deviceId: input.deviceId ?? null, lastSeenAt: new Date() },
  });
}

export async function removePushToken(userId: string, pushToken: string): Promise<void> {
  await prisma.device.deleteMany({ where: { pushToken, userId } });
}
