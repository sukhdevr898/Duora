import { db } from '../../db/client';
import { nowIso } from '../../utils/ids';
import { ensureSettings } from '../users/users.service';

export type Settings = {
  theme: 'light' | 'dark' | 'system';
  accent: 'violet' | 'rose' | 'sunset' | 'mint';
  loveMode: boolean;
  heartMotion: boolean;
  glass: boolean;
  messageNotifications: boolean;
  callNotifications: boolean;
  ringtone: string;
  vibration: boolean;
  hidePreview: boolean;
  lowData: boolean;
  updatedAt: string;
};

type SettingsRow = {
  user_id: string;
  theme: string;
  accent: string;
  love_mode: number;
  heart_motion: number;
  glass: number;
  message_notifications: number;
  call_notifications: number;
  ringtone: string;
  vibration: number;
  hide_preview: number;
  low_data: number;
  updated_at: string;
};

export async function getSettings(userId: string): Promise<Settings> {
  await ensureSettings(userId);
  const row = await db().one<SettingsRow>('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
  if (!row) {
    return {
      theme: 'system',
      accent: 'violet',
      loveMode: false,
      heartMotion: true,
      glass: true,
      messageNotifications: true,
      callNotifications: true,
      ringtone: 'default',
      vibration: true,
      hidePreview: false,
      lowData: false,
      updatedAt: nowIso(),
    };
  }
  return {
    theme: row.theme as Settings['theme'],
    accent: row.accent as Settings['accent'],
    loveMode: Boolean(row.love_mode),
    heartMotion: Boolean(row.heart_motion),
    glass: Boolean(row.glass),
    messageNotifications: Boolean(row.message_notifications),
    callNotifications: Boolean(row.call_notifications),
    ringtone: row.ringtone,
    vibration: Boolean(row.vibration),
    hidePreview: Boolean(row.hide_preview),
    lowData: Boolean(row.low_data),
    updatedAt: row.updated_at,
  };
}

export async function updateSettings(
  userId: string,
  patch: Partial<Omit<Settings, 'updatedAt'>>,
): Promise<Settings> {
  await ensureSettings(userId);
  const map: Record<string, string> = {
    theme: 'theme',
    accent: 'accent',
    loveMode: 'love_mode',
    heartMotion: 'heart_motion',
    glass: 'glass',
    messageNotifications: 'message_notifications',
    callNotifications: 'call_notifications',
    ringtone: 'ringtone',
    vibration: 'vibration',
    hidePreview: 'hide_preview',
    lowData: 'low_data',
  };

  const fields: string[] = [];
  const params: unknown[] = [];
  for (const [key, column] of Object.entries(map)) {
    const value = (patch as Record<string, unknown>)[key];
    if (value === undefined) continue;
    fields.push(`${column} = ?`);
    params.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
  }
  if (fields.length) {
    fields.push('updated_at = ?');
    params.push(nowIso(), userId);
    await db().run(`UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`, params);
  }
  return getSettings(userId);
}
