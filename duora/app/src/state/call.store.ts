import { create } from 'zustand';
import type { CallPhase, CallType } from '../types/models';

export interface MediaTrackState {
  /** Object URL for the local preview (set by the WebRTC coordinator). */
  localStreamUrl: string | null;
  remoteStreamUrl: string | null;
  muted: boolean;
  speakerOn: boolean;
  cameraOn: boolean;
  frontCamera: boolean;
}

interface CallStoreState extends MediaTrackState {
  callId: string | null;
  phase: CallPhase;
  callType: CallType;
  isCaller: boolean;
  startedAt: number | null;
  connectedAt: number | null;
  quality: 'good' | 'weak' | 'reconnecting';
  error: string | null;
  begin: (params: { callId: string; callType: CallType; isCaller: boolean }) => void;
  setPhase: (phase: CallPhase, error?: string | null) => void;
  patchMedia: (patch: Partial<MediaTrackState>) => void;
  setQuality: (quality: CallStoreState['quality']) => void;
  markConnected: () => void;
  reset: () => void;
}

const initialMedia: MediaTrackState = {
  localStreamUrl: null,
  remoteStreamUrl: null,
  muted: false,
  speakerOn: true,
  cameraOn: true,
  frontCamera: true,
};

export const useCallStore = create<CallStoreState>((set) => ({
  ...initialMedia,
  callId: null,
  phase: 'idle',
  callType: 'AUDIO',
  isCaller: true,
  startedAt: null,
  connectedAt: null,
  quality: 'good',
  error: null,

  begin: ({ callId, callType, isCaller }) =>
    set({
      ...initialMedia,
      callId,
      callType,
      isCaller,
      phase: isCaller ? 'calling' : 'ringing',
      startedAt: Date.now(),
      connectedAt: null,
      quality: 'good',
      error: null,
      cameraOn: callType === 'VIDEO',
    }),

  setPhase: (phase, error = null) => set({ phase, error }),
  patchMedia: (patch) => set(patch),
  setQuality: (quality) => set({ quality }),
  markConnected: () => set({ phase: 'connected', connectedAt: Date.now(), quality: 'good' }),
  reset: () =>
    set({
      ...initialMedia,
      callId: null,
      phase: 'idle',
      startedAt: null,
      connectedAt: null,
      quality: 'good',
      error: null,
    }),
}));
