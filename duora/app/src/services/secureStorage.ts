import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';

/**
 * Small secrets only (session tokens, preferences). SecureStore has a ~2KB
 * per-entry limit; message history lives in SQLite, never here.
 */
export const StorageKeys = {
  authSession: 'duora.auth.session',
  settings: 'duora.settings',
  serverProfile: 'duora.server.profile',
} as const;

export async function secureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (err) {
    logger.error('secureStorage', `get failed for ${key}`, err);
    return null;
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  });
}

export async function secureDelete(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

/** zustand `persist` storage adapter backed by SecureStore. */
export const securePersistStorage = {
  getItem: async (name: string): Promise<string | null> => secureGet(name),
  setItem: async (name: string, value: string): Promise<void> => secureSet(name, value),
  removeItem: async (name: string): Promise<void> => secureDelete(name),
};
