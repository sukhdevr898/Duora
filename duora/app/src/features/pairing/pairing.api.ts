import { http } from '../../services/httpClient';
import type { Invitation, PairingState } from '../../types/models';

export async function getCurrentPairing(): Promise<{ pairing: PairingState }> {
  return http.get<{ pairing: PairingState }>('/pairing/current');
}

export async function createInvitation(): Promise<{ invitation: Invitation }> {
  return http.post<{ invitation: Invitation }>('/pairing/invitations', {});
}

export async function previewInvitation(query: {
  code?: string;
  token?: string;
}): Promise<{ invitation: Invitation }> {
  const params = new URLSearchParams();
  if (query.code) params.set('code', query.code);
  if (query.token) params.set('token', query.token);
  return http.get<{ invitation: Invitation }>(`/pairing/invitations/preview?${params.toString()}`);
}

export async function verifyCode(code: string): Promise<{ invitation: Invitation }> {
  return http.post<{ invitation: Invitation }>('/pairing/verify', { code });
}

export async function acceptInvitation(input: {
  code?: string;
  token?: string;
}): Promise<{ pairing: { pairingId: string; conversationId: string; partnerId: string } }> {
  return http.post('/pairing/accept', input);
}

export async function unpair(): Promise<void> {
  await http.delete<void>('/pairing/current', { confirm: 'UNPAIR' });
}
