/** Shared API contract — mirrors the Node server responses exactly. */

export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  partnerNickname: string | null;
  createdAt: string;
};

export type AuthResult = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
};

export type ServerStatus = 'online' | 'connecting' | 'offline';

export type ServerInfo = {
  status: ServerStatus;
  latency: number;
  history: number[];
  uptimeSeconds: number;
  region: string;
  apiBase: string;
  version: string;
  lastChecked: number;
  autoReconnect: boolean;
  error?: string | null;
};

export type PairingPhase = 'idle' | 'outgoing' | 'incoming' | 'matched';

export type PairingStatus = {
  phase: PairingPhase;
  code: string | null;
  qrPayload: string | null;
  expiresAt: string | null;
  matchedAt: string | null;
  partner: {
    id: string;
    displayName: string;
    nickname: string | null;
    avatarUrl: string | null;
  } | null;
  conversationId: string | null;
};

export type ChatMessage = {
  id: string;
  clientMessageId: string;
  conversationId: string;
  /** The id of the person who wrote it - used to tell "me" from "partner". */
  senderId: string;
  from: 'me' | 'partner';
  text: string;
  sticker: string | null;
  type: string;
  createdAt: string;
  time: string;
  status: 'pending' | 'sent' | 'delivered' | 'read';
  reactions: string[];
};

export type ConversationSummary = {
  id: string;
  partner: {
    id: string;
    displayName: string;
    nickname: string | null;
    avatarUrl: string | null;
    online: boolean;
    lastSeenAt: string | null;
  } | null;
  lastMessage: { text: string; sticker: string | null; createdAt: string; from: 'me' | 'partner' } | null;
  unreadCount: number;
  updatedAt: string;
};

export type CallLogItem = {
  id: string;
  type: 'Outgoing Call' | 'Incoming Call' | 'Missed Call' | 'Video Call';
  kind: 'voice' | 'video';
  missed: boolean;
  time: string;
  day: string;
  duration: string | null;
  clock: string;
  createdAt: string;
};

export type NoteItem = {
  id: string;
  title: string;
  lines: string[];
  date: string;
  image: string | null;
  category: string;
  mood: string | null;
  createdAt: string;
};

export type UserSettings = {
  theme: 'light' | 'dark' | 'system';
  accent: 'violet' | 'rose' | 'sunset' | 'mint';
  loveMode: boolean;
  heartMotion: boolean;
  glass: boolean;
  messageNotifications: boolean;
  callNotifications: boolean;
  ringtone: string;
  vibration: boolean;
  hidePreview: boolean;
  lowData: boolean;
  updatedAt: string;
};

export type HealthPayload = {
  status: 'operational' | 'degraded' | 'down';
  version: string;
  region: string;
  apiBase: string;
  startedAt: string;
  uptimeSeconds: number;
  latencyMs: number;
  database: {
    driver: string;
    status: 'operational' | 'down';
    latencyMs: number;
    sizeBytes: number | null;
  };
  services: {
    name: string;
    label: string;
    status: 'operational' | 'degraded' | 'down';
    latencyMs: number;
    detail: string;
  }[];
  checks: { name: string; ok: boolean; detail: string }[];
};

export type HomePayload = {
  partner: {
    id: string;
    displayName: string;
    nickname: string | null;
    avatarUrl: string | null;
    online: boolean;
    lastSeenAt: string | null;
  } | null;
  linked: boolean;
  streakDays: number;
  daysTogether: number;
  pairedAt: string | null;
  anniversary: { title: string; date: string; daysUntil: number; daysTogether: number };
  loveStats: { daysTogether: string; messages: string; callsThisWeek: string };
  moments: NoteItem[];
  latestMessage: { text: string; sticker: string | null; createdAt: string; from: 'me' | 'partner' } | null;
};
