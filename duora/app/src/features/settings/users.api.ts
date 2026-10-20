import { http } from '../../services/httpClient';
import type { User, UserSettings } from '../../types/models';

export async function getProfile(): Promise<{ user: User & { settings: UserSettings | null } }> {
  return http.get('/users/me');
}

export async function updateProfile(input: {
  displayName?: string;
  avatarUrl?: string;
  partnerNickname?: string | null;
}): Promise<{ user: User }> {
  return http.patch('/users/me', input);
}

export async function getSettings(): Promise<{ settings: UserSettings }> {
  return http.get('/users/me/settings');
}

export async function updateSettings(input: Partial<UserSettings>): Promise<{ settings: UserSettings }> {
  return http.put('/users/me/settings', input);
}

export async function deleteAccount(): Promise<void> {
  await http.delete('/users/me');
}

export async function registerPushToken(input: {
  pushToken: string;
  platform: 'android' | 'ios' | 'web';
  deviceId?: string;
}): Promise<void> {
  await http.post('/devices/push-token', input);
}

export async function removePushToken(pushToken: string): Promise<void> {
  await http.delete('/devices/push-token', { pushToken });
}
