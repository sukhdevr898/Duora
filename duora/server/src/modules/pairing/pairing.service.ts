import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { opaqueToken, shortPairingCode } from '../../utils/ids';
import { emitToUsers } from '../../websocket/socketState';
import { findActivePairing } from '../../services/relationship.service';

export interface InvitationView {
  id: string;
  code: string;
  token: string;
  status: string;
  expiresAt: Date;
  createdBy: { id: string; displayName: string; avatarUrl: string | null };
}

function invitationView(row: Prisma.PairingInvitationGetPayload<{ include: { createdBy: true } }>): InvitationView {
  return {
    id: row.id,
    code: row.code,
    token: row.token,
    status: row.status,
    expiresAt: row.expiresAt,
    createdBy: {
      id: row.createdBy.id,
      displayName: row.createdBy.displayName,
      avatarUrl: row.createdBy.avatarUrl,
    },
  };
}

async function assertUnpaired(userId: string): Promise<void> {
  const pairing = await findActivePairing(userId);
  if (pairing) throw ApiError.conflict('You already have an active pairing. Unpair first.');
}

export async function createInvitation(userId: string): Promise<InvitationView> {
  await assertUnpaired(userId);

  // Revoke the caller's stale pending invitations so only one live invite exists.
  await prisma.pairingInvitation.updateMany({
    where: { createdById: userId, status: 'PENDING' },
    data: { status: 'REVOKED' },
  });

  const expiresAt = new Date(Date.now() + env.INVITATION_TTL_MINUTES * 60 * 1000);
  // Short codes are unique; regenerate on the rare collision.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const invitation = await prisma.pairingInvitation.create({
        data: {
          code: shortPairingCode(),
          token: opaqueToken(24),
          createdById: userId,
          expiresAt,
        },
        include: { createdBy: true },
      });
      return invitationView(invitation);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' && attempt < 2) continue;
      throw err;
    }
  }
  throw ApiError.conflict('Could not generate a unique invitation code, try again');
}

async function loadPendingInvitation(where: { code?: string; token?: string }) {
  const invitation = await prisma.pairingInvitation.findFirst({
    where,
    include: { createdBy: true },
  });
  return invitation;
}

/** Previews an invitation (QR scan or code entry) without pairing. */
export async function previewInvitation(
  userId: string,
  query: { code?: string; token?: string },
): Promise<InvitationView> {
  const invitation = await loadPendingInvitation(query);
  if (!invitation) throw ApiError.notFound('Invitation not found');
  if (invitation.createdById === userId) {
    throw ApiError.badRequest('You cannot accept your own invitation');
  }
  if (invitation.status !== 'PENDING') throw ApiError.conflict('Invitation is no longer valid');
  if (invitation.expiresAt < new Date()) {
    await prisma.pairingInvitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
    throw ApiError.conflict('Invitation has expired');
  }
  return invitationView(invitation);
}

/**
 * Verification for typed codes: enforces an attempt ceiling to make brute
 * forcing the 6-digit code impractical within the short TTL window.
 */
export async function verifyCode(userId: string, code: string): Promise<InvitationView> {
  const invitation = await loadPendingInvitation({ code });
  if (!invitation) throw ApiError.notFound('No invitation matches this code');
  if (invitation.createdById === userId) throw ApiError.badRequest('You cannot use your own invitation code');

  if (invitation.attemptCount >= env.INVITATION_MAX_ATTEMPTS) {
    await prisma.pairingInvitation.update({ where: { id: invitation.id }, data: { status: 'REVOKED' } });
    throw ApiError.forbidden('Too many attempts — request a new code from your partner');
  }
  await prisma.pairingInvitation.update({
    where: { id: invitation.id },
    data: { attemptCount: { increment: 1 } },
  });
  if (invitation.status !== 'PENDING') throw ApiError.conflict('Invitation is no longer valid');
  if (invitation.expiresAt < new Date()) {
    await prisma.pairingInvitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
    throw ApiError.conflict('Invitation has expired');
  }
  return invitationView(invitation);
}

/**
 * Final, server-authorized pairing. Runs inside a transaction so the pairing,
 * conversation, participants and invitation state can never diverge.
 */
export async function acceptInvitation(
  userId: string,
  input: { code?: string; token?: string },
): Promise<{ pairingId: string; conversationId: string; partnerId: string }> {
  await assertUnpaired(userId);
  const invitation = await loadPendingInvitation(input);
  if (!invitation) throw ApiError.notFound('Invitation not found');
  if (invitation.createdById === userId) throw ApiError.badRequest('You cannot accept your own invitation');
  if (invitation.status !== 'PENDING') throw ApiError.conflict('Invitation is no longer valid');
  if (invitation.expiresAt < new Date()) {
    await prisma.pairingInvitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
    throw ApiError.conflict('Invitation has expired');
  }

  const creatorId = invitation.createdById;
  const creatorPairing = await findActivePairing(creatorId);
  if (creatorPairing) throw ApiError.conflict('Inviter is already paired with someone else');

  try {
    const result = await prisma.$transaction(async (tx) => {
      const pairing = await tx.pairing.create({
        data: { userAId: creatorId, userBId: userId, status: 'ACTIVE' },
      });
      const conversation = await tx.conversation.create({
        data: {
          pairingId: pairing.id,
          participants: { create: [{ userId: creatorId }, { userId }] },
        },
      });
      await tx.pairingInvitation.update({
        where: { id: invitation.id },
        data: { status: 'USED', usedAt: new Date(), consumedById: userId },
      });
      // Any other pending invitations for both users are now invalid.
      await tx.pairingInvitation.updateMany({
        where: {
          status: 'PENDING',
          OR: [{ createdById: creatorId }, { createdById: userId }],
        },
        data: { status: 'REVOKED' },
      });
      return { pairing, conversation };
    });

    emitToUsers([creatorId, userId], 'pairing_update', {
      status: 'ACTIVE',
      pairingId: result.pairing.id,
      conversationId: result.conversation.id,
      at: new Date().toISOString(),
    });

    return {
      pairingId: result.pairing.id,
      conversationId: result.conversation.id,
      partnerId: creatorId,
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw ApiError.conflict('Pairing conflict — one side is already paired');
    }
    throw err;
  }
}

export async function getCurrentPairing(userId: string) {
  const pairing = await findActivePairing(userId);
  if (!pairing) return { status: 'UNPAIRED' as const };

  const partnerId = pairing.userAId === userId ? pairing.userBId : pairing.userAId;
  const partner = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { id: true, displayName: true, avatarUrl: true, partnerNickname: true },
  });
  return {
    status: 'ACTIVE' as const,
    pairingId: pairing.id,
    conversationId: pairing.conversationId,
    since: pairing.createdAt,
    partner,
  };
}

export async function unpair(userId: string): Promise<void> {
  const pairing = await findActivePairing(userId);
  if (!pairing) throw ApiError.conflict('You are not currently paired');
  const partnerId = pairing.userAId === userId ? pairing.userBId : pairing.userAId;

  await prisma.$transaction([
    prisma.pairing.update({ where: { id: pairing.id }, data: { status: 'UNLINKED', unlinkedAt: new Date() } }),
    prisma.pairingInvitation.updateMany({
      where: { status: 'PENDING', OR: [{ createdById: userId }, { createdById: partnerId }] },
      data: { status: 'REVOKED' },
    }),
  ]);

  emitToUsers([userId, partnerId], 'pairing_update', {
    status: 'UNLINKED',
    at: new Date().toISOString(),
  });
}
