import { useCallback, useEffect, useState } from 'react';
import { listConversations } from '../chat/chat.api';
import { getCachedMessages } from '../../repositories/chat.repository';
import { usePairingStore } from '../../state/pairing.store';
import type { ConversationSummary, Message } from '../../types/models';

interface HomeData {
  conversations: ConversationSummary[];
  cachedNote: Message | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useHome(): HomeData {
  const pairing = usePairingStore((s) => s.pairing);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [cachedNote, setCachedNote] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (pairing.status !== 'ACTIVE') {
      setLoading(false);
      return;
    }
    try {
      const data = await listConversations();
      setConversations(data);
      setError(null);
      const convId = pairing.conversationId ?? data[0]?.id;
      if (convId) {
        const cached = await getCachedMessages(convId, 50);
        // A partner note is the most recent message FROM the partner.
        const fromPartner = cached.filter((m) => m.senderId === pairing.partner?.id).reverse();
        setCachedNote(fromPartner[0] ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your dashboard');
      const convId = pairing.conversationId;
      if (convId) {
        const cached = await getCachedMessages(convId, 50);
        setCachedNote(cached[cached.length - 1] ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [pairing]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { conversations, cachedNote, loading, error, refresh };
}
