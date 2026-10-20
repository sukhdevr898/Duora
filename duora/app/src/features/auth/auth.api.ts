import { http } from '../../services/httpClient';
import type { AuthResult, AuthTokens, User } from '../../types/models';
import type { LoginForm, RegisterForm } from '../../utils/validation';

interface DeviceInfo {
  pushToken?: string;
  platform?: 'android' | 'ios' | 'web';
  deviceId?: string;
}

export async function register(input: RegisterForm): Promise<AuthResult> {
  return http.post<AuthResult>('/auth/register', input, { auth: false });
}

export async function login(input: LoginForm, device?: DeviceInfo): Promise<AuthResult> {
  return http.post<AuthResult>('/auth/login', { ...input, device }, { auth: false });
}

export async function refresh(refreshToken: string): Promise<{ tokens: AuthTokens }> {
  return http.post<{ tokens: AuthTokens }>('/auth/refresh', { refreshToken }, { auth: false });
}

export async function logout(refreshToken: string): Promise<void> {
  await http.post<void>('/auth/logout', { refreshToken });
}

export async function getMe(): Promise<{ user: User }> {
  return http.get<{ user: User }>('/auth/me');
}
