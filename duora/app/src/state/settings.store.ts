import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ThemeMode } from '../theme/tokens';
import { securePersistStorage, StorageKeys } from '../services/secureStorage';

interface SettingsState {
  hasOnboarded: boolean;
  theme: ThemeMode;
  messageNotifications: boolean;
  callNotifications: boolean;
  ringtone: string;
  vibration: boolean;
  hidePreview: boolean;
  lowData: boolean;
  setOnboarded: () => void;
  setTheme: (theme: ThemeMode) => void;
  patch: (partial: Partial<Omit<SettingsState, 'patch' | 'setOnboarded' | 'setTheme'>>) => void;
}

const defaults = {
  hasOnboarded: false,
  theme: 'system' as ThemeMode,
  messageNotifications: true,
  callNotifications: true,
  ringtone: 'default',
  vibration: true,
  hidePreview: false,
  lowData: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      setOnboarded: () => set({ hasOnboarded: true }),
      setTheme: (theme) => set({ theme }),
      patch: (partial) => set(partial),
    }),
    {
      name: StorageKeys.settings,
      storage: createJSONStorage(() => securePersistStorage),
    },
  ),
);
