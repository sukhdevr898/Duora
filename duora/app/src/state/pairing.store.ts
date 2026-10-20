import { create } from 'zustand';
import type { PairingState, Presence } from '../types/models';

interface PairingStoreState {
  pairing: PairingState;
  presence: Presence | null;
  loadingPairing: boolean;
  setPairing: (pairing: PairingState) => void;
  setPresence: (presence: Presence) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const usePairingStore = create<PairingStoreState>((set) => ({
  pairing: { status: 'UNPAIRED' },
  presence: null,
  loadingPairing: true,
  setPairing: (pairing) => set({ pairing, loadingPairing: false }),
  setPresence: (presence) => set({ presence }),
  setLoading: (loadingPairing) => set({ loadingPairing }),
  reset: () => set({ pairing: { status: 'UNPAIRED' }, presence: null }),
}));
