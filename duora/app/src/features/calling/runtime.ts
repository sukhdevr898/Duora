import Constants, { ExecutionEnvironment } from 'expo-constants';
import { logger } from '../../utils/logger';

export type ExecutionRuntime = 'expo-go' | 'development-build' | 'standalone';

/**
 * Honest runtime classification. Expo Go cannot load react-native-webrtc,
 * foreground calling services or PiP — those require a development build.
 */
export function getExecutionRuntime(): ExecutionRuntime {
  // StoreClient is the Expo Go sandbox, which cannot load native modules.
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return 'expo-go';
  if (__DEV__) return 'development-build';
  return 'standalone';
}

export function isExpoGo(): boolean {
  return getExecutionRuntime() === 'expo-go';
}

type WebRtcModule = typeof import('react-native-webrtc');
let cachedModule: WebRtcModule | null | undefined;

/**
 * Dynamically loads the native WebRTC module. Returns null in Expo Go instead
 * of crashing the JS bundle — call screens render an upgrade panel then.
 */
export function loadWebRTC(): WebRtcModule | null {
  if (cachedModule !== undefined) return cachedModule;
  if (isExpoGo()) {
    cachedModule = null;
    return null;
  }
  try {
    // Lazy require so Metro never evaluates the native module in Expo Go.
    const moduleRef = require('react-native-webrtc') as WebRtcModule;
    moduleRef.registerGlobals?.();
    cachedModule = moduleRef;
    logger.info('calling', 'react-native-webrtc loaded', { runtime: getExecutionRuntime() });
  } catch (err) {
    logger.error('calling', 'react-native-webrtc unavailable', err);
    cachedModule = null;
  }
  return cachedModule;
}

export function assertDevelopmentBuild(feature: string): Error {
  return new Error(`${feature} requires a Duora development build (native WebRTC is not in Expo Go).`);
}
