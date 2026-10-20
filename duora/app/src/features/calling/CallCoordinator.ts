import type { Socket } from 'socket.io-client';
import type {
  CallType,
  IceConfig,
  CallSession,
} from '../../types/models';
import { SocketEvents } from '../../constants/events';
import { timing } from '../../constants/config';
import { getSocket } from '../../services/socketClient';
import { useCallStore } from '../../state/call.store';
import { useSettingsStore } from '../../state/settings.store';
import { logger } from '../../utils/logger';
import { loadWebRTC, isExpoGo } from './runtime';
import * as callsApi from './calls.api';
import { presentNotification, dismissNotification } from '../notifications/notifications.service';
import { NotificationIds } from '../../constants/notification';

type WebRtc = NonNullable<ReturnType<typeof loadWebRTC>>;
type Cleanup = () => void;

interface IncomingInvite {
  callId: string;
  callerId: string;
  callType: CallType;
}

/**
 * Single source of truth for a WebRTC call. The coordinator owns the
 * RTCPeerConnection lifecycle, signaling bindings and media tracks; screens
 * only render state from useCallStore and invoke these methods.
 */
class CallCoordinator {
  private pc: WebRtc['RTCPeerConnection']['prototype'] | null = null;
  private WebRTC: WebRtc | null = null;
  private localStream: WebRtc['MediaStream']['prototype'] | null = null;
  private remoteStream: WebRtc['MediaStream']['prototype'] | null = null;
  private cleanups: Cleanup[] = [];
  private pendingOffer: { sdp: string } | null = null;
  private pendingCandidates: unknown[] = [];
  private ringTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private incomingHandler: ((invite: IncomingInvite) => void) | null = null;

  setIncomingCallHandler(handler: (invite: IncomingInvite) => void): void {
    this.incomingHandler = handler;
  }

  isActive(): boolean {
    const phase = useCallStore.getState().phase;
    return phase !== 'idle' && phase !== 'ended' && phase !== 'failed' && phase !== 'declined' && phase !== 'cancelled';
  }

  /** Binds app-lifetime socket listeners once (root layout). */
  bindGlobalSocketEvents(): Cleanup {
    const socket = getSocket();
    if (!socket) throw new Error('socket_not_connected');

    const onInvite = (payload: IncomingInvite) => void this.onRemoteInvite(payload);
    const onDecline = () => this.onRemoteEnded('declined');
    const onCancel = () => this.onRemoteEnded('cancelled');
    const onEnd = () => this.onRemoteEnded('ended');
    const onError = (payload: { callId?: string; message: string }) => {
      logger.warn('calling', 'server call_error', payload);
      useCallStore.getState().setPhase('failed', payload.message);
    };

    socket.on(SocketEvents.CALL_INVITE, onInvite);
    socket.on(SocketEvents.CALL_DECLINE, onDecline);
    socket.on(SocketEvents.CALL_CANCEL, onCancel);
    socket.on(SocketEvents.CALL_END, onEnd);
    socket.on(SocketEvents.CALL_ERROR, onError);

    return () => {
      socket.off(SocketEvents.CALL_INVITE, onInvite);
      socket.off(SocketEvents.CALL_DECLINE, onDecline);
      socket.off(SocketEvents.CALL_CANCEL, onCancel);
      socket.off(SocketEvents.CALL_END, onEnd);
      socket.off(SocketEvents.CALL_ERROR, onError);
    };
  }

  // ── Outgoing ─────────────────────────────────────────────────────

  async startOutgoing(callType: CallType): Promise<string> {
    if (isExpoGo() || !loadWebRTC()) {
      throw new Error('WebRTC calls require a Duora development build.');
    }
    if (this.isActive()) {
      return useCallStore.getState().callId!;
    }
    const { call, ice, existing } = await callsApi.initiateCall(callType);
    if (existing) logger.info('calling', 'rejoining existing call session', call.id);

    useCallStore.getState().begin({ callId: call.id, callType, isCaller: true });
    this.WebRTC = loadWebRTC();
    this.bindCallSignaling(call.id);
    await this.setupPeer(ice);
    await this.acquireLocalMedia(callType);
    await this.createAndSendOffer(call.id);

    const socket = this.requireSocket();
    socket.emit(SocketEvents.CALL_INVITE, { callId: call.id });

    this.ringTimeout = setTimeout(() => {
      logger.info('calling', 'ring timeout — cancelling');
      void this.cancel();
    }, timing.callRingTimeoutMs);

    return call.id;
  }

  // ── Incoming ─────────────────────────────────────────────────────

  private async onRemoteInvite(invite: IncomingInvite): Promise<void> {
    if (this.isActive()) {
      logger.warn('calling', 'ignoring duplicate invite while a call is active');
      return;
    }
    useCallStore.getState().begin({
      callId: invite.callId,
      callType: invite.callType,
      isCaller: false,
    });
    this.bindCallSignaling(invite.callId);
    await presentNotification({
      kind: 'incoming_call',
      title: 'Duora — incoming call',
      body: invite.callType === 'VIDEO' ? 'Your partner is video calling' : 'Your partner is calling',
      data: { kind: 'incoming_call', callId: invite.callId, callType: invite.callType },
      stableId: NotificationIds.incomingCall(invite.callId),
    });
    this.incomingHandler?.(invite);
    // Tell the caller their invitation reached a ringing device.
    this.requireSocket().emit(SocketEvents.CALL_RINGING, { callId: invite.callId });
  }

  async acceptIncoming(): Promise<void> {
    const store = useCallStore.getState();
    const callId = store.callId;
    if (!callId || !this.WebRTC) this.WebRTC = loadWebRTC();
    if (!this.WebRTC) throw new Error('WebRTC unavailable in this runtime');

    useCallStore.getState().setPhase('connecting');
    const [, ice] = await Promise.all([
      callsApi.acceptCall(callId!),
      callsApi.getIceConfig(callId!),
    ]);
    const socket = this.requireSocket();
    socket.emit(SocketEvents.CALL_ACCEPT, { callId });

    await this.setupPeer(ice);
    await this.acquireLocalMedia(store.callType);
    if (this.pendingOffer) {
      await this.answerPendingOffer(callId!, this.pendingOffer.sdp);
    }
  }

  async declineIncoming(): Promise<void> {
    const callId = useCallStore.getState().callId;
    if (!callId) return;
    try {
      await callsApi.declineCall(callId);
      this.requireSocket().emit(SocketEvents.CALL_DECLINE, { callId });
    } catch (err) {
      logger.error('calling', 'decline failed', err);
    }
    await dismissNotification(callId);
    this.teardown('declined');
  }

  async cancel(): Promise<void> {
    const callId = useCallStore.getState().callId;
    if (!callId) return;
    try {
      await callsApi.cancelCall(callId);
      this.requireSocket().emit(SocketEvents.CALL_CANCEL, { callId });
    } catch (err) {
      logger.error('calling', 'cancel failed', err);
    }
    this.teardown('cancelled');
  }

  async hangup(): Promise<void> {
    const callId = useCallStore.getState().callId;
    if (!callId) return;
    try {
      await callsApi.endCall(callId);
      this.requireSocket().emit(SocketEvents.CALL_END, { callId });
    } catch (err) {
      logger.error('calling', 'end failed', err);
    }
    await dismissNotification(callId);
    this.teardown('ended');
  }

  // ── Media controls ───────────────────────────────────────────────

  toggleMute(): boolean {
    const audioTrack = this.localStream?.getAudioTracks()[0];
    if (!audioTrack) return useCallStore.getState().muted;
    audioTrack.enabled = !audioTrack.enabled;
    const muted = !audioTrack.enabled;
    useCallStore.getState().patchMedia({ muted });
    return muted;
  }

  toggleSpeaker(): boolean {
    const current = useCallStore.getState().speakerOn;
    this.WebRTC?.mediaDevices.setSpeakerphoneOn?.(!current);
    useCallStore.getState().patchMedia({ speakerOn: !current });
    return !current;
  }

  toggleCamera(): boolean {
    const videoTrack = this.localStream?.getVideoTracks()[0];
    if (!videoTrack) return false;
    videoTrack.enabled = !videoTrack.enabled;
    const cameraOn = videoTrack.enabled;
    useCallStore.getState().patchMedia({ cameraOn });
    return cameraOn;
  }

  async flipCamera(): Promise<void> {
    const store = useCallStore.getState();
    if (!this.WebRTC || store.callType !== 'VIDEO') return;
    const frontCamera = !store.frontCamera;
    const stream = await this.WebRTC.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: frontCamera ? 'user' : 'environment' },
    });
    const newVideo = stream.getVideoTracks()[0];
    const oldVideo = this.localStream?.getVideoTracks()[0];
    const sender = this.pc?.getSenders?.().find((s) => s.track?.kind === 'video');
    if (sender) await sender.replaceTrack(newVideo);
    oldVideo?.stop();
    if (this.localStream) {
      if (oldVideo) this.localStream.removeTrack(oldVideo);
      this.localStream.addTrack(newVideo);
    }
    useCallStore.getState().patchMedia({
      frontCamera,
      localStreamUrl: this.localStream ? this.streamToUrl(this.localStream) : null,
    });
  }

  // ── Internals ────────────────────────────────────────────────────

  private requireSocket(): Socket {
    const socket = getSocket();
    if (!socket) throw new Error('socket_not_connected');
    return socket;
  }

  private streamToUrl(stream: WebRtc['MediaStream']['prototype']): string {
    // react-native-webrtc exposes a toURL() helper on MediaStream.
    const withUrl = stream as unknown as { toURL?: () => string; _reactTag?: string };
    return withUrl.toURL?.() ?? withUrl._reactTag ?? stream.id;
  }

  private async setupPeer(ice: IceConfig): Promise<void> {
    if (!this.WebRTC) throw new Error('WebRTC module missing');
    this.pc = new this.WebRTC.RTCPeerConnection({
      iceServers: ice.iceServers,
      iceCandidatePoolSize: 1,
      bundlePolicy: 'max-bundle',
    });

    this.pc.addEventListener('icecandidate', (event) => {
      if (!event.candidate) return;
      const callId = useCallStore.getState().callId;
      this.requireSocket().emit(SocketEvents.WEBRTC_ICE_CANDIDATE, {
        callId,
        candidate: event.candidate.toJSON(),
      });
    });

    this.pc.addEventListener('track', (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      this.remoteStream = stream;
      useCallStore.getState().patchMedia({ remoteStreamUrl: this.streamToUrl(stream) });
    });

    this.pc.addEventListener('connectionstatechange', () => this.onConnectionState());
  }

  private async acquireLocalMedia(callType: CallType): Promise<void> {
    if (!this.WebRTC || !this.pc) throw new Error('peer not ready');
    const lowData = useSettingsStore.getState().lowData;
    this.localStream = await this.WebRTC.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video:
        callType === 'VIDEO'
          ? lowData
            ? { frameRate: 15, width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' }
            : { frameRate: 30, facingMode: 'user' }
          : false,
    });
    for (const track of this.localStream.getTracks()) {
      this.pc.addTrack(track, this.localStream);
    }
    this.WebRTC.mediaDevices.setSpeakerphoneOn?.(useCallStore.getState().speakerOn);
    useCallStore.getState().patchMedia({ localStreamUrl: this.streamToUrl(this.localStream) });
  }

  private async createAndSendOffer(callId: string): Promise<void> {
    if (!this.pc) return;
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.requireSocket().emit(SocketEvents.WEBRTC_OFFER, { callId, sdp: offer.sdp });
  }

  private async answerPendingOffer(callId: string, sdp: string): Promise<void> {
    if (!this.pc || !this.WebRTC) return;
    await this.pc.setRemoteDescription(new this.WebRTC.RTCSessionDescription({ type: 'offer', sdp }));
    await this.flushCandidates();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this.requireSocket().emit(SocketEvents.WEBRTC_ANSWER, { callId, sdp: answer.sdp });
  }

  private bindCallSignaling(callId: string): void {
    const socket = this.requireSocket();

    const onOffer = (payload: { callId: string; sdp: string }) => {
      if (payload.callId !== callId) return;
      const store = useCallStore.getState();
      if (store.isCaller) return; // offers always flow caller → callee
      if (store.phase === 'ringing') {
        this.pendingOffer = { sdp: payload.sdp };
        return;
      }
      void this.answerPendingOffer(callId, payload.sdp).catch((err) =>
        logger.error('calling', 'answer failed', err),
      );
    };

    const onAnswer = async (payload: { callId: string; sdp: string }) => {
      if (payload.callId !== callId || !this.pc || !this.WebRTC) return;
      await this.pc.setRemoteDescription(
        new this.WebRTC.RTCSessionDescription({ type: 'answer', sdp: payload.sdp }),
      );
      await this.flushCandidates();
    };

    const onIce = async (payload: { callId: string; candidate: unknown }) => {
      if (payload.callId !== callId || !this.pc || !this.WebRTC) return;
      const candidate = payload.candidate as {
        candidate: string;
        sdpMid: string | null;
        sdpMLineIndex: number | null;
      };
      const ice = new this.WebRTC.RTCIceCandidate(candidate);
      if (this.pc.remoteDescription) await this.pc.addIceCandidate(ice);
      else this.pendingCandidates.push(ice);
    };

    const onRinging = () => {
      if (useCallStore.getState().isCaller) useCallStore.getState().setPhase('ringing');
    };

    const onCallState = (payload: { state: string }) => {
      if (payload.state === 'ACTIVE') useCallStore.getState().markConnected();
      if (payload.state === 'RECONNECTING') useCallStore.getState().setPhase('reconnecting');
    };

    socket.on(SocketEvents.WEBRTC_OFFER, onOffer);
    socket.on(SocketEvents.WEBRTC_ANSWER, onAnswer);
    socket.on(SocketEvents.WEBRTC_ICE_CANDIDATE, onIce);
    socket.on(SocketEvents.CALL_RINGING, onRinging);
    socket.on(SocketEvents.CALL_STATE, onCallState);

    this.cleanups.push(() => {
      socket.off(SocketEvents.WEBRTC_OFFER, onOffer);
      socket.off(SocketEvents.WEBRTC_ANSWER, onAnswer);
      socket.off(SocketEvents.WEBRTC_ICE_CANDIDATE, onIce);
      socket.off(SocketEvents.CALL_RINGING, onRinging);
      socket.off(SocketEvents.CALL_STATE, onCallState);
    });
  }

  private async flushCandidates(): Promise<void> {
    if (!this.pc || this.pendingCandidates.length === 0) return;
    const candidates = this.pendingCandidates;
    this.pendingCandidates = [];
    await Promise.all(candidates.map((c) => this.pc?.addIceCandidate(c as never)));
  }

  private onConnectionState(): void {
    const state = this.pc?.connectionState;
    logger.info('calling', `peer connection state: ${state ?? 'unknown'}`);
    switch (state) {
      case 'connected':
        this.reconnectAttempts = 0;
        if (this.ringTimeout) clearTimeout(this.ringTimeout);
        useCallStore.getState().markConnected();
        useCallStore.getState().setQuality('good');
        this.requireSocket().emit(SocketEvents.CALL_STATE, {
          callId: useCallStore.getState().callId,
          state: 'ACTIVE',
        });
        break;
      case 'disconnected':
        useCallStore.getState().setPhase('reconnecting');
        useCallStore.getState().setQuality('reconnecting');
        this.scheduleIceRestart();
        break;
      case 'failed':
        useCallStore.getState().setQuality('weak');
        this.scheduleIceRestart();
        break;
      case 'closed':
        this.teardown('ended');
        break;
      default:
        break;
    }
  }

  private scheduleIceRestart(): void {
    if (this.reconnectTimer) return;
    this.reconnectAttempts += 1;
    if (this.reconnectAttempts > 3) {
      useCallStore.getState().setPhase('failed', 'Connection lost');
      void this.hangup();
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      try {
        this.pc?.restartIce?.();
        logger.info('calling', `ICE restart attempt ${this.reconnectAttempts}`);
      } catch (err) {
        logger.error('calling', 'ICE restart failed', err);
      }
    }, 2000);
  }

  private onRemoteEnded(phase: 'declined' | 'cancelled' | 'ended'): void {
    const callId = useCallStore.getState().callId;
    if (callId) void dismissNotification(callId);
    if (this.ringTimeout) clearTimeout(this.ringTimeout);
    this.teardown(phase);
  }

  private teardown(phase: 'ended' | 'declined' | 'cancelled' | 'failed'): void {
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups = [];
    if (this.ringTimeout) clearTimeout(this.ringTimeout);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ringTimeout = null;
    this.reconnectTimer = null;
    this.pendingOffer = null;
    this.pendingCandidates = [];
    this.reconnectAttempts = 0;
    try {
      this.localStream?.getTracks().forEach((track) => track.stop());
      this.localStream?.release();
      this.remoteStream?.release();
      this.pc?.close();
    } catch (err) {
      logger.warn('calling', 'teardown error', err);
    }
    this.localStream = null;
    this.remoteStream = null;
    this.pc = null;
    useCallStore.getState().setPhase(phase);
  }

  /** Called by call screens on unmount to clear UI state after navigation. */
  release(): void {
    useCallStore.getState().reset();
  }
}

export const callCoordinator = new CallCoordinator();
export type { IncomingInvite, CallSession };
