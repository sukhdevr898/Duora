import type { Socket } from 'socket.io';
import { z } from 'zod';
import { SocketEvents } from '../events';
import { emitToUser, isUserOnline } from '../socketState';
import * as callsService from '../../modules/calls/calls.service';
import { sendToUser } from '../../modules/push/push.service';
import { prisma } from '../../database/prisma';
import { ApiError } from '../../utils/ApiError';

const callRefSchema = z.object({ callId: z.string().min(1).max(64) });
const offerSchema = z.object({ callId: z.string().min(1).max(64), sdp: z.string().min(1).max(1_000_000) });
const answerSchema = offerSchema;
const iceSchema = z.object({
  callId: z.string().min(1).max(64),
  candidate: z.record(z.unknown()),
});
const stateSchema = z.object({
  callId: z.string().min(1).max(64),
  state: z.enum(['CONNECTING', 'ACTIVE', 'RECONNECTING']),
});

type AuthedSocket = Socket;

async function peerIdOf(callId: string, userId: string): Promise<string> {
  const call = await prisma.callSession.findUnique({ where: { id: callId } });
  if (!call) throw ApiError.notFound('Call session not found');
  if (call.callerId !== userId && call.calleeId !== userId) {
    throw ApiError.forbidden('Not a participant of this call');
  }
  return call.callerId === userId ? call.calleeId : call.callerId;
}

function fail(socket: Socket, callId: string, message: string): void {
  socket.emit(SocketEvents.CALL_ERROR, { callId, message });
}

export function registerCallHandlers(socket: AuthedSocket, userId: string): void {
  // The call row is created through REST (POST /api/v1/calls) so it is durable;
  // this event performs the real-time fan-out plus offline push.
  socket.on(SocketEvents.CALL_INVITE, async (raw: unknown) => {
    const parsed = callRefSchema.safeParse(raw);
    if (!parsed.success) return fail(socket, '', 'Invalid call invite');
    const { callId } = parsed.data;
    try {
      const call = await prisma.callSession.findUnique({ where: { id: callId } });
      if (!call || call.callerId !== userId) return fail(socket, callId, 'Unauthorized call invite');
      const calleeId = call.calleeId;
      emitToUser(calleeId, SocketEvents.CALL_INVITE, {
        callId,
        callerId: userId,
        callType: call.callType,
        at: new Date().toISOString(),
      });
      if (!isUserOnline(calleeId)) {
        const settings = await prisma.userSettings.findUnique({ where: { userId: calleeId } });
        if (!settings || settings.callNotifications) {
          await sendToUser(calleeId, {
            title: 'Duora — incoming call',
            body: call.callType === 'VIDEO' ? 'Your partner is video calling you' : 'Your partner is calling you',
            data: { kind: 'incoming_call', callId, callType: call.callType, callerId: userId },
            channelId: 'incoming_calls',
            ring: true,
          });
        }
      }
    } catch (err) {
      fail(socket, callId, err instanceof Error ? err.message : 'invite failed');
    }
  });

  socket.on(SocketEvents.CALL_RINGING, async (raw: unknown) => {
    const parsed = callRefSchema.safeParse(raw);
    if (!parsed.success) return;
    try {
      const peerId = await peerIdOf(parsed.data.callId, userId);
      emitToUser(peerId, SocketEvents.CALL_RINGING, { callId: parsed.data.callId, at: new Date().toISOString() });
    } catch {
      /* ignore */
    }
  });

  socket.on(SocketEvents.CALL_ACCEPT, async (raw: unknown) => {
    const parsed = callRefSchema.safeParse(raw);
    if (!parsed.success) return;
    try {
      const call = await callsService.acceptCall(parsed.data.callId, userId);
      emitToUser(call.callerId, SocketEvents.CALL_ACCEPT, { callId: call.id, at: new Date().toISOString() });
    } catch (err) {
      fail(socket, parsed.data.callId, err instanceof Error ? err.message : 'accept failed');
    }
  });

  socket.on(SocketEvents.CALL_DECLINE, async (raw: unknown) => {
    const parsed = callRefSchema.safeParse(raw);
    if (!parsed.success) return;
    try {
      const call = await callsService.declineCall(parsed.data.callId, userId);
      emitToUser(call.callerId, SocketEvents.CALL_DECLINE, { callId: call.id, at: new Date().toISOString() });
      if (!isUserOnline(call.callerId)) {
        await sendToUser(call.callerId, {
          title: 'Duora',
          body: 'Call declined',
          data: { kind: 'missed_call', callId: call.id },
          channelId: 'missed_calls',
        });
      }
    } catch (err) {
      fail(socket, parsed.data.callId, err instanceof Error ? err.message : 'decline failed');
    }
  });

  socket.on(SocketEvents.CALL_CANCEL, async (raw: unknown) => {
    const parsed = callRefSchema.safeParse(raw);
    if (!parsed.success) return;
    try {
      const call = await callsService.cancelCall(parsed.data.callId, userId);
      emitToUser(call.calleeId, SocketEvents.CALL_CANCEL, { callId: call.id, at: new Date().toISOString() });
      if (!isUserOnline(call.calleeId)) {
        await sendToUser(call.calleeId, {
          title: 'Duora',
          body: 'Missed call',
          data: { kind: 'missed_call', callId: call.id },
          channelId: 'missed_calls',
        });
      }
    } catch (err) {
      fail(socket, parsed.data.callId, err instanceof Error ? err.message : 'cancel failed');
    }
  });

  socket.on(SocketEvents.CALL_END, async (raw: unknown) => {
    const parsed = callRefSchema.safeParse(raw);
    if (!parsed.success) return;
    try {
      const call = await callsService.endCall(parsed.data.callId, userId);
      const peerId = call.callerId === userId ? call.calleeId : call.callerId;
      emitToUser(peerId, SocketEvents.CALL_END, { callId: call.id, at: new Date().toISOString() });
    } catch (err) {
      fail(socket, parsed.data.callId, err instanceof Error ? err.message : 'end failed');
    }
  });

  socket.on(SocketEvents.CALL_STATE, async (raw: unknown) => {
    const parsed = stateSchema.safeParse(raw);
    if (!parsed.success) return;
    try {
      if (parsed.data.state === 'ACTIVE') {
        await callsService.markActive(parsed.data.callId, userId);
      }
      const peerId = await peerIdOf(parsed.data.callId, userId);
      emitToUser(peerId, SocketEvents.CALL_STATE, { ...parsed.data, at: new Date().toISOString() });
    } catch {
      /* ignore state relay errors */
    }
  });

  // WebRTC signaling is related only; SDP/ICE never touch the database.
  socket.on(SocketEvents.WEBRTC_OFFER, async (raw: unknown) => {
    const parsed = offerSchema.safeParse(raw);
    if (!parsed.success) return fail(socket, '', 'Invalid offer');
    try {
      const peerId = await peerIdOf(parsed.data.callId, userId);
      emitToUser(peerId, SocketEvents.WEBRTC_OFFER, { callId: parsed.data.callId, sdp: parsed.data.sdp });
    } catch (err) {
      fail(socket, parsed.data.callId, err instanceof Error ? err.message : 'offer rejected');
    }
  });

  socket.on(SocketEvents.WEBRTC_ANSWER, async (raw: unknown) => {
    const parsed = answerSchema.safeParse(raw);
    if (!parsed.success) return fail(socket, '', 'Invalid answer');
    try {
      const peerId = await peerIdOf(parsed.data.callId, userId);
      emitToUser(peerId, SocketEvents.WEBRTC_ANSWER, { callId: parsed.data.callId, sdp: parsed.data.sdp });
    } catch (err) {
      fail(socket, parsed.data.callId, err instanceof Error ? err.message : 'answer rejected');
    }
  });

  socket.on(SocketEvents.WEBRTC_ICE_CANDIDATE, async (raw: unknown) => {
    const parsed = iceSchema.safeParse(raw);
    if (!parsed.success) return fail(socket, '', 'Invalid ICE candidate');
    try {
      const peerId = await peerIdOf(parsed.data.callId, userId);
      emitToUser(peerId, SocketEvents.WEBRTC_ICE_CANDIDATE, {
        callId: parsed.data.callId,
        candidate: parsed.data.candidate,
      });
    } catch {
      /* ignore */
    }
  });
}
