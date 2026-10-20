import { http } from '../../services/httpClient';
import { pagination } from '../../constants/config';
import type { ConversationSummary, Message } from '../../types/models';

export async function listConversations(): Promise<ConversationSummary[]> {
  const data = await http.get<{ conversations: ConversationSummary[] }>('/conversations');
  return data.conversations;
}

export async function fetchMessages(
  conversationId: string,
  cursor?: string,
): Promise<{ messages: Message[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ limit: String(pagination.initialPageSize) });
  if (cursor) params.set('cursor', cursor);
  return http.get<{ messages: Message[]; nextCursor: string | null }>(
    `/conversations/${conversationId}/messages?${params.toString()}`,
  );
}

export async function syncMessages(conversationId: string, since: string) {
  return http.get<{ messages: Message[]; receipts: unknown[] }>(
    `/conversations/${conversationId}/sync?since=${encodeURIComponent(since)}`,
  );
}

export async function sendMessageHttp(payload: {
  conversationId: string;
  clientMessageId: string;
  text: string;
  replyToId?: string;
}): Promise<Message> {
  const data = await http.post<{ message: Message }>('/messages', payload);
  return data.message;
}

export async function markDelivered(conversationId: string): Promise<void> {
  await http.post(`/conversations/${conversationId}/delivered`);
}

export async function markRead(conversationId: string, messageId?: string): Promise<void> {
  await http.post('/messages/read', { conversationId, messageId });
}

export async function deleteForMe(messageId: string): Promise<void> {
  await http.post('/messages/delete-for-me', { messageId });
}

export async function deleteForEveryone(
  messageId: string,
): Promise<{ id: string; at: string }> {
  return http.post('/messages/delete-for-all', { messageId });
}
