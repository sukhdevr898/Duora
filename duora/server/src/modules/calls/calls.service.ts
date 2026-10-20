import { CallStatus, CallType } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { ApiError } from '../../utils/ApiError';
import { requireActivePairing, partnerIdOf } from '../../services/relationship.service';
import { buildIceConfig } from './turn.service';

const OPEN_STATUSES: CallStatus[] = [CallStatus.RINGING, CallStatus.CONNECTING, CallStatus.ACTIVE];

async function assertParticipant(callId: string, userId: string) {
  const call = await prisma.callSession.findUnique({ where: { id: callId } });
  if (!call) throw ApiError.notFound('Call session not found');
  if (call.callerId !== userId && call.calleeId !== userId) {
    throw ApiError.forbidden('You are not a participant in this call');
  }
  return call;
}

export async function initiateCall(userId: string, callType: CallType) {
  const pairing = await requireActivePairing(userId);
  const calleeId = partnerIdOf(pairing, userId);

  const conflict = await prisma.callSession.findFirst({
    where: {
      status: { in: OPEN_STATUSES },
      OR: [{ callerId: userId }, { calleeId: userId }, { callerId: calleeId }, { calleeId: calleeId }],
    },
    orderBy: { createdAt: 'desc' },
  });
  if (conflict) {
    // Return the existing session instead of creating a duplicate
    return { call: conflict, ice: buildIceConfig(userId), existing: true };
  }

  const call = await prisma.callSession.create({
    data: { callerId: userId, calleeId, callType, status: CallStatus.RINGING, startedAt: new Date() },
  });
  return { call, ice: buildIceConfig(userId), existing: false };
}

export async function acceptCall(callId: string, userId: string) {
  const call = await assertParticipant(callId, userId);
  if (call.calleeId !== userId) throw ApiError.forbidden('Only the callee can accept a call');
  if (call.status !== CallStatus.RINGING) {
    throw ApiError.conflict(`Call cannot be accepted from status ${call.status}`);
  }
  const updated = await prisma.callSession.update({
    where: { id: callId },
    data: { status: CallStatus.CONNECTING },
  });
  return updated;
}

export async function declineCall(callId: string, userId: string) {
  const call = await assertParticipant(callId, userId);
  if (call.calleeId !== userId) throw ApiError.forbidden('Only the callee can decline a call');
  if (call.status !== CallStatus.RINGING) throw ApiError.conflict('Call is no longer ringing');
  return prisma.callSession.update({
    where: { id: callId },
    data: { status: CallStatus.DECLINED, endedAt: new Date(), endReason: 'declined' },
  });
}

export async function cancelCall(callId: string, userId: string) {
  const call = await assertParticipant(callId, userId);
  if (call.callerId !== userId) throw ApiError.forbidden('Only the caller can cancel a call');
  if (call.status !== CallStatus.RINGING) throw ApiError.conflict('Call is no longer ringing');
  return prisma.callSession.update({
    where: { id: callId },
    data: { status: CallStatus.CANCELLED, endedAt: new Date(), endReason: 'cancelled' },
  });
}

export async function endCall(callId: string, userId: string) {
  const call = await assertParticipant(callId, userId);
  if (!OPEN_STATUSES.includes(call.status)) return call;
  return prisma.callSession.update({
    where: { id: callId },
    data: {
      status: CallStatus.ENDED,
      endedAt: new Date(),
      endReason: call.connectedAt ? 'completed' : 'ended_before_connect',
    },
  });
}

/** Called from the socket layer when WebRTC media becomes connected. */
export async function markActive(callId: string, userId: string) {
  const call = await assertParticipant(callId, userId);
  if (!OPEN_STATUSES.includes(call.status)) return call;
  if (call.status === CallStatus.ACTIVE) return call;
  return prisma.callSession.update({
    where: { id: callId },
    data: { status: CallStatus.ACTIVE, connectedAt: new Date() },
  });
}

export async function markFailed(callId: string, userId: string, reason: string) {
  const call = await assertParticipant(callId, userId);
  if (!OPEN_STATUSES.includes(call.status)) return call;
  return prisma.callSession.update({
    where: { id: callId },
    data: { status: CallStatus.FAILED, endedAt: new Date(), endReason: reason.slice(0, 200) },
  });
}

export async function getActiveCall(userId: string) {
  return prisma.callSession.findFirst({
    where: {
      status: { in: OPEN_STATUSES },
      OR: [{ callerId: userId }, { calleeId: userId }],
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getIceForCall(callId: string, userId: string) {
  await assertParticipant(callId, userId);
  return buildIceConfig(userId);
}
