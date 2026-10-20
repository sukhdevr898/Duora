/**
 * Minimal type surface for the native react-native-webrtc API used by Duora.
 * The module is installed for development builds only; at runtime it is loaded
 * through features/calling/runtime.ts which detects Expo Go.
 */
declare module 'react-native-webrtc' {
  export interface RTCConfiguration {
    iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }>;
    iceCandidatePoolSize?: number;
    bundlePolicy?: string;
  }

  export class RTCSessionDescription {
    constructor(init: { type: 'offer' | 'answer' | 'pranswer' | 'rollback'; sdp: string });
    type: string;
    sdp: string;
  }

  export class RTCIceCandidate {
    constructor(init: { candidate: string; sdpMid: string | null; sdpMLineIndex: number | null });
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
    toJSON(): unknown;
  }

  export interface MediaStreamTrack {
    id: string;
    kind: 'audio' | 'video';
    enabled: boolean;
    muted: boolean;
    readyState: string;
    stop(): void;
    applyConstraints?(constraints: Record<string, unknown>): Promise<void>;
  }

  export class MediaStream {
    id: string;
    getTracks(): MediaStreamTrack[];
    getAudioTracks(): MediaStreamTrack[];
    getVideoTracks(): MediaStreamTrack[];
    addTrack(track: MediaStreamTrack): void;
    removeTrack(track: MediaStreamTrack): void;
    release(): void;
  }

  export interface MediaDevicesLike {
    getUserMedia(constraints: {
      audio?: boolean | Record<string, unknown>;
      video?: boolean | Record<string, unknown>;
    }): Promise<MediaStream>;
    setSpeakerphoneOn?(on: boolean): void;
    startMediaStreamSection?(): void;
  }

  export const mediaDevices: MediaDevicesLike;

  export interface RTCRtpSender {
    track: MediaStreamTrack | null;
    replaceTrack(track: MediaStreamTrack | null): Promise<void>;
  }

  interface PeerConnectionEventMap {
    icecandidate: { candidate: RTCIceCandidate | null };
    addstream: { stream: MediaStream };
    track: { track: MediaStreamTrack; streams: MediaStream[] };
    negotiationneeded: Record<string, never>;
    connectionstatechange: Record<string, never>;
    iceconnectionstatechange: Record<string, never>;
    signaledstatechange: Record<string, never>;
  }

  export class RTCPeerConnection {
    constructor(config: RTCConfiguration);
    localDescription: RTCSessionDescription | null;
    remoteDescription: RTCSessionDescription | null;
    connectionState: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';
    iceConnectionState: string;
    addTrack(track: MediaStreamTrack, stream: MediaStream): void;
    removeTrack(track: MediaStreamTrack): void;
    createOffer(options?: Record<string, unknown>): Promise<RTCSessionDescription>;
    createAnswer(options?: Record<string, unknown>): Promise<RTCSessionDescription>;
    setLocalDescription(description: RTCSessionDescription): Promise<void>;
    setRemoteDescription(description: RTCSessionDescription): Promise<void>;
    addIceCandidate(candidate: RTCIceCandidate): Promise<void>;
    getStats(): Promise<unknown>;
    getSenders?(): RTCRtpSender[];
    restartIce?(): void;
    close(): void;
    addEventListener<K extends keyof PeerConnectionEventMap>(
      event: K,
      handler: (event: PeerConnectionEventMap[K]) => void,
    ): void;
    removeEventListener<K extends keyof PeerConnectionEventMap>(
      event: K,
      handler: (event: PeerConnectionEventMap[K]) => void,
    ): void;
  }

  export interface RTCViewProps {
    streamURL: string | null;
    mirror?: boolean;
    objectFit?: 'cover' | 'contain';
    zOrder?: number;
    style?: import('react-native').ViewStyle;
  }

  export const RTCView: import('react').ComponentClass<RTCViewProps>;

  export function registerGlobals(): void;
}
