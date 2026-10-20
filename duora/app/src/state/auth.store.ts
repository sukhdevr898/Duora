import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AuthTokens, User } from '../types/models';
import { securePersistStorage, StorageKeys } from '../services/secureStorage';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  hydrated: boolean;
  setSession: (user: User, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  clear: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      hydrated: false,
      setSession: (user, tokens) => set({ user, tokens }),
      setTokens: (tokens) => set({ tokens }),
      setUser: (user) => set({ user }),
      clear: () => set({ user: null, tokens: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: StorageKeys.authSession,
      storage: createJSONStorage(() => securePersistStorage),
      partialize: (s) => ({ user: s.user, tokens: s.tokens }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

/** Non-reactive accessor for services (http client, socket). */
export function getAuthSnapshot() {
  return useAuthStore.getState();
}
