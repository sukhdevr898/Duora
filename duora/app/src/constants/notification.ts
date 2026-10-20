// Stable identifiers — never reuse an id for a different semantic channel.
export const NotificationChannels = {
  MESSAGES: 'duora_messages',
  INCOMING_CALLS: 'duora_incoming_calls',
  MISSED_CALLS: 'duora_missed_calls',
} as const;

// Stable notification ids so duplicates are replaced, not stacked.
export const NotificationIds = {
  incomingCall: (callId: string) => `call-in:${callId}`,
  missedCall: (callId: string) => `call-missed:${callId}`,
  message: (conversationId: string) => `msg:${conversationId}`,
} as const;

export type NotificationKind = 'message' | 'incoming_call' | 'missed_call';
