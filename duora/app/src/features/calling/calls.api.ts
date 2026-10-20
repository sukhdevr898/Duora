import { http } from '../../services/httpClient';
import type { CallSession, CallType, IceConfig } from '../../types/models';

export async function initiateCall(callType: CallType): Promise<{
  call: CallSession;
  ice: IceConfig;
  existing: boolean;
}> {
  return http.post('/calls', { callType });
}

export async function getActiveCall(): Promise<{ call: CallSession | null }> {
  return http.get('/calls/active');
}

export async function getIceConfig(callId: string): Promise<IceConfig> {
  return http.get(`/calls/${callId}/ice`);
}

export async function acceptCall(callId: string): Promise<{ call: CallSession }> {
  return http.post(`/calls/${callId}/accept`);
}

export async function declineCall(callId: string): Promise<{ call: CallSession }> {
  return http.post(`/calls/${callId}/decline`);
}

export async function cancelCall(callId: string): Promise<{ call: CallSession }> {
  return http.post(`/calls/${callId}/cancel`);
}

export async function endCall(callId: string): Promise<{ call: CallSession }> {
  return http.post(`/calls/${callId}/end`);
}
