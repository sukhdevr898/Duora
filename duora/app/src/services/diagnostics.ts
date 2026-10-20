import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { config, buildUrl } from '../constants/config';
import { useNetworkStore } from '../state/network.store';
import { useAuthStore } from '../state/auth.store';
import { getExecutionRuntime } from '../features/calling/runtime';
import { getSocket } from './socketClient';

export interface DiagnosticReport {
  app: {
    name: string;
    version: string;
    build: string;
    runtime: string;
    environment: string;
  };
  backend: {
    apiBaseUrl: string;
    health: string;
    socket: string;
    socketId: string | null;
    authenticated: boolean;
  };
  device: {
    platform: string;
    osVersion: string | null;
  };
}

/** Unauthenticated liveness/redness probe. Never includes tokens. */
export async function pingBackend(): Promise<{ health: string; ready: string }> {
  const healthBase = config.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
  try {
    const [health, ready] = await Promise.all([
      fetch(`${healthBase}/health`).then((r) => (r.ok ? 'reachable' : `HTTP ${r.status}`)),
      fetch(`${healthBase}/ready`).then((r) => (r.ok ? 'ready' : `HTTP ${r.status}`)),
    ]);
    return { health, ready };
  } catch {
    return { health: 'unreachable', ready: 'unreachable' };
  }
}

export function buildDiagnosticReport(health: string): DiagnosticReport {
  const socket = getSocket();
  return {
    app: {
      name: Application.applicationName ?? 'Duora',
      version: Application.nativeApplicationVersion ?? 'unknown',
      build: Application.nativeBuildVersion ?? 'unknown',
      runtime: getExecutionRuntime(),
      environment: config.env,
    },
    backend: {
      apiBaseUrl: buildUrl(''),
      health,
      socket: useNetworkStore.getState().socketState,
      socketId: socket?.id ?? null,
      authenticated: Boolean(useAuthStore.getState().tokens),
    },
    device: {
      platform: Constants.platform?.android ? 'android' : 'unknown',
      osVersion: Constants.platform?.android ? String(Constants.platform.android.version) : null,
    },
  };
}

/** Plain-text export safe to share — secrets, tokens and SDP are excluded. */
export function redactedExport(report: DiagnosticReport): string {
  return [
    'DUORA DIAGNOSTICS (redacted)',
    `Generated: ${new Date().toISOString()}`,
    '',
    `App: ${report.app.name} ${report.app.version} (${report.app.build})`,
    `Runtime: ${report.app.runtime} / env ${report.app.environment}`,
    `Device: ${report.device.platform} ${report.device.osVersion ?? ''}`,
    '',
    `API: ${report.backend.apiBaseUrl}`,
    `Health: ${report.backend.health}`,
    `Socket: ${report.backend.socket} (${report.backend.socketId ?? 'no id'})`,
    `Authenticated: ${report.backend.authenticated}`,
  ].join('\n');
}
