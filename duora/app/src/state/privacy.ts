/**
 * Stores the user's preferred decorative icon for the in-app splash/brand
 * treatment. This does not change the Android launcher icon.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PrivacyIconKey } from '../privacy/icons';

const ICON_KEY = 'duora.privacyIcon.v1';

type PrivacyStore = {
  icon: PrivacyIconKey;
  /** False until the saved icon has been read from the device. */
  ready: boolean;
  hydrate: () => Promise<void>;
  setIcon: (icon: PrivacyIconKey) => Promise<void>;
};

export const usePrivacy = create<PrivacyStore>((set) => ({
  icon: 'duora',
  ready: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(ICON_KEY);
      if (raw === 'clock' || raw === 'weather' || raw === 'calculator' || raw === 'notes' || raw === 'duora') {
        set({ icon: raw, ready: true });
        return;
      }
    } catch {
      /* storage unavailable — keep the default */
    }
    set({ ready: true });
  },

  setIcon: async (icon) => {
    set({ icon });
    try {
      await AsyncStorage.setItem(ICON_KEY, icon);
    } catch {
      /* storage unavailable — the icon still applies for this session */
    }
  },
}));

/** Convenience for components that only need the key. */
export const privacyIcon = (): PrivacyIconKey => usePrivacy.getState().icon;
