import { create } from 'zustand';
import type { Message } from '../types/models';

interface ConversationState {
  messages: Message[];
  nextCursor: string | null;
  loadingOlder: boolean;
  initialLoaded: boolean;
  draft: string;
  partnerTyping: boolean;
}

interface ChatStoreState {
  conversations: Record<string, ConversationState>;
  ensureConversation: (conversationId: string) => void;
  setMessages: (conversationId: string, messages: Message[], nextCursor: string | null) => void;
  prependMessages: (conversationId: string, older: Message[], nextCursor: string | null) => void;
  upsertMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, clientMessageId: string, patch: Partial<Message>) => void;
  setLoadingOlder: (conversationId: string, loading: boolean) => void;
  setDraft: (conversationId: string, draft: string) => void;
  setPartnerTyping: (conversationId: string, typing: boolean) => void;
  markReadByPartner: (conversationId: string, at?: string) => void;
  markDeliveredByPartner: (conversationId: string, at?: string) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  reset: () => void;
}

function emptyConversation(): ConversationState {
  return {
    messages: [],
    nextCursor: null,
    loadingOlder: false,
    initialLoaded: false,
    draft: '',
    partnerTyping: false,
  };
}

export const useChatStore = create<ChatStoreState>((set) => ({
  conversations: {},

  ensureConversation: (conversationId) =>
    set((s) =>
      s.conversations[conversationId]
        ? s
        : { conversations: { ...s.conversations, [conversationId]: emptyConversation() } },
    ),

  setMessages: (conversationId, messages, nextCursor) =>
    set((s) => ({
      conversations: {
        ...s.conversations,
        [conversationId]: {
          ...(s.conversations[conversationId] ?? emptyConversation()),
          messages,
          nextCursor,
          initialLoaded: true,
        },
      },
    })),

  prependMessages: (conversationId, older, nextCursor) =>
    set((s) => {
      const conv = s.conversations[conversationId] ?? emptyConversation();
      const known = new Set(conv.messages.map((m) => m.id));
      return {
        conversations: {
          ...s.conversations,
          [conversationId]: {
            ...conv,
            messages: [...older.filter((m) => !known.has(m.id)), ...conv.messages],
            nextCursor,
            loadingOlder: false,
          },
        },
      };
    }),

  upsertMessage: (conversationId, message) =>
    set((s) => {
      const conv = s.conversations[conversationId] ?? emptyConversation();
      const byClient = conv.messages.findIndex((m) => m.clientMessageId === message.clientMessageId);
      const byId = conv.messages.findIndex((m) => m.id === message.id);
      const index = byClient >= 0 ? byClient : byId;
      const messages =
        index >= 0
          ? conv.messages.map((m, i) => (i === index ? { ...m, ...message } : m))
          : [...conv.messages, message];
      return {
        conversations: {
          ...s.conversations,
          [conversationId]: { ...conv, messages },
        },
      };
    }),

  updateMessage: (conversationId, clientMessageId, patch) =>
    set((s) => {
      const conv = s.conversations[conversationId];
      if (!conv) return s;
      return {
        conversations: {
          ...s.conversations,
          [conversationId]: {
            ...conv,
            messages: conv.messages.map((m) =>
              m.clientMessageId === clientMessageId || m.id === clientMessageId ? { ...m, ...patch } : m,
            ),
          },
        },
      };
    }),

  setLoadingOlder: (conversationId, loadingOlder) =>
    set((s) => ({
      conversations: {
        ...s.conversations,
        [conversationId]: { ...(s.conversations[conversationId] ?? emptyConversation()), loadingOlder },
      },
    })),

  setDraft: (conversationId, draft) =>
    set((s) => ({
      conversations: {
        ...s.conversations,
        [conversationId]: { ...(s.conversations[conversationId] ?? emptyConversation()), draft },
      },
    })),

  setPartnerTyping: (conversationId, partnerTyping) =>
    set((s) => ({
      conversations: {
        ...s.conversations,
        [conversationId]: { ...(s.conversations[conversationId] ?? emptyConversation()), partnerTyping },
      },
    })),

  markReadByPartner: (conversationId) =>
    set((s) => {
      const conv = s.conversations[conversationId];
      if (!conv) return s;
      return {
        conversations: {
          ...s.conversations,
          [conversationId]: {
            ...conv,
            messages: conv.messages.map((m) =>
              m.deliveryStatus === 'delivered' || m.deliveryStatus === 'sent'
                ? { ...m, deliveryStatus: 'read' as const }
                : m,
            ),
          },
        },
      };
    }),

  markDeliveredByPartner: (conversationId) =>
    set((s) => {
      const conv = s.conversations[conversationId];
      if (!conv) return s;
      return {
        conversations: {
          ...s.conversations,
          [conversationId]: {
            ...conv,
            messages: conv.messages.map((m) =>
              m.deliveryStatus === 'sent' ? { ...m, deliveryStatus: 'delivered' as const } : m,
            ),
          },
        },
      };
    }),

  removeMessage: (conversationId, messageId) =>
    set((s) => {
      const conv = s.conversations[conversationId];
      if (!conv) return s;
      return {
        conversations: {
          ...s.conversations,
          [conversationId]: { ...conv, messages: conv.messages.filter((m) => m.id !== messageId) },
        },
      };
    }),

  reset: () => set({ conversations: {} }),
}));

export function selectConversation(id: string) {
  return (s: ChatStoreState): ConversationState =>
    s.conversations[id] ?? {
      messages: [],
      nextCursor: null,
      loadingOlder: false,
      initialLoaded: false,
      draft: '',
      partnerTyping: false,
    };
}
