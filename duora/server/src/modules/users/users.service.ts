import { prisma } from '../../database/prisma';
import { ApiError } from '../../utils/ApiError';

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      partnerNickname: true,
      deletedAt: true,
      createdAt: true,
      settings: true,
    },
  });
  if (!user || user.deletedAt) throw ApiError.notFound('Account not found');
  return user;
}

export async function updateProfile(
  userId: string,
  data: { displayName?: string; avatarUrl?: string; partnerNickname?: string | null },
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, displayName: true, avatarUrl: true, partnerNickname: true },
  });
}

export async function getSettings(userId: string) {
  const settings = await prisma.userSettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  return settings;
}

export interface SettingsUpdate {
  theme?: 'system' | 'light' | 'dark';
  messageNotifications?: boolean;
  callNotifications?: boolean;
  ringtone?: string;
  vibration?: boolean;
  hidePreview?: boolean;
  lowData?: boolean;
}

export async function updateSettings(userId: string, data: SettingsUpdate) {
  return prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

/**
 * Account deletion: soft-delete the user and revoke every refresh session.
 * A retention job can hard-delete after the retention window.
 */
export async function deleteAccount(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } }),
    prisma.refreshSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
}
