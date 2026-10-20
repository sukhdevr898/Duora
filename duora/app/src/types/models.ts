// Mirrors of server payloads. Kept structural so the app does not import Prisma.

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  partnerNickname?: string | null;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export interface Invitation {
  id: string;
  code: string;
  token: string;
  status: 'PENDING' | 'USED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdBy: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
}

export type PairingStatus = 'UNPAIRED' | 'ACTIVE';

export interface PairingState {
  status: PairingStatus;
  pairingId?: string;
  conversationId?: string | null;
  since?: string;
  partner?: Pick<User, 'id' | 'displayName' | 'avatarUrl' | 'partnerNickname'>;
}

export type MessageType = 'TEXT' | 'ATTACHMENT';
export type DeliveryStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageReceipt {
  userId: string;
  deliveredAt: string | null;
  readAt: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId: string;
  type: MessageType;
  text: string;
  attachmentUrl?: string | null;
  attachmentMeta?: Record<string, unknown> | null;
  replyToId?: string | null;
  replyTo?: Pick<Message, 'id' | 'text' | 'senderId' | 'deletedForAllAt'> | null;
  deletedForAllAt?: string | null;
  deletedForAll?: boolean;
  createdAt: string;
  receipts?: MessageReceipt[];
  // Client-only fields for the local SQLite cache / offline queue.
  deliveryStatus?: DeliveryStatus;
}

export interface ConversationSummary {
  id: string;
  updatedAt: string;
  partner: Pick<User, 'id' | 'displayName' | 'avatarUrl'> | null;
  lastMessage: Message | null;
  unreadCount: number;
}

export type CallType = 'AUDIO' | 'VIDEO';
export type CallPhase =
  | 'idle'
  | 'calling'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'failed'
  | 'declined'
  | 'cancelled';

export interface CallSession {
  id: string;
  callerId: string;
  calleeId: string;
  callType: CallType;
  status: 'RINGING' | 'CONNECTING' | 'ACTIVE' | 'ENDED' | 'DECLINED' | 'CANCELLED' | 'MISSED' | 'FAILED';
  startedAt: string | null;
  connectedAt: string | null;
  endedAt: string | null;
  endReason?: string | null;
}

export interface IceConfig {
  iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }>;
  expiresAt: string | null;
}

export interface Presence {
  userId: string;
  online: boolean;
  lastSeenAt: string | null;
}

export interface UserSettings {
  theme: 'system' | 'light' | 'dark';
  messageNotifications: boolean;
  callNotifications: boolean;
  ringtone: string;
  vibration: boolean;
  hidePreview: boolean;
  lowData: boolean;
}

export interface VersionInfo {
  platform: 'android' | 'ios';
  latestVersion: string;
  minSupportedVersion: string;
  updateAvailable: boolean;
  updateRequired: boolean;
  releaseUrl: string;
  checkedAt: string;
}
