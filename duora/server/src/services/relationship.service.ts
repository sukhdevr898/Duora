import { prisma } from '../database/prisma';
import { ApiError } from '../utils/ApiError';

export interface ActivePairing {
  id: string;
  userAId: string;
  userBId: string;
  conversationId: string | null;
  createdAt: Date;
}

/** Returns the user's ACTIVE pairing or null when unpaired. */
export async function findActivePairing(userId: string): Promise<ActivePairing | null> {
  const pairings = await prisma.pairing.findMany({
    where: {
      status: 'ACTIVE',
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: { conversation: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });
  const pairing = pairings[0];
  if (!pairing) return null;
  return {
    id: pairing.id,
    userAId: pairing.userAId,
    userBId: pairing.userBId,
    conversationId: pairing.conversation?.id ?? null,
    createdAt: pairing.createdAt,
  };
}

export async function requireActivePairing(userId: string): Promise<ActivePairing> {
  const pairing = await findActivePairing(userId);
  if (!pairing) throw ApiError.forbidden('You are not paired with a partner');
  return pairing;
}

export function partnerIdOf(pairing: ActivePairing, userId: string): string {
  return pairing.userAId === userId ? pairing.userBId : pairing.userAId;
}

/**
 * Authorizes that the requesting user belongs to this conversation and returns
 * the participating user ids.
 */
export async function authorizeConversation(
  userId: string,
  conversationId: string,
): Promise<{ conversationId: string; participantIds: string[]; partnerId: string }> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: { select: { userId: true } }, pairing: true },
  });
  if (!conversation) throw ApiError.notFound('Conversation not found');
  const participantIds = conversation.participants.map((p) => p.userId);
  if (!participantIds.includes(userId)) {
    throw ApiError.forbidden('You are not a participant in this conversation');
  }
  const partnerId = conversation.pairing.userAId === userId
    ? conversation.pairing.userBId
    : conversation.pairing.userAId;
  return { conversationId, participantIds, partnerId };
}
