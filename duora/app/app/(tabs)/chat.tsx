import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CardSkeleton } from '../../src/components/Skeleton';
import { ErrorCard } from '../../src/components/Feedback';
import { CheckCheck, Link2, MessageCircle, Search, X } from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { PageBackground } from '../../src/components/PageBackground';
import { Btn, IconButton, PressableScale } from '../../src/components/ui';
import { RichText } from '../../src/components/RichText';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useStore } from '../../src/state/store';

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();
  const conversations = useStore((s) => s.conversations);
  const loadConversations = useStore((s) => s.loadConversations);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');

  const reloadConversations = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const loaded = await loadConversations();
    setLoadError(!loaded);
    setLoading(false);
  }, [loadConversations]);

  useFocusEffect(
    useCallback(() => {
      void reloadConversations();
    }, [reloadConversations]),
  );

  const chats = useMemo(() => conversations.map((conversation) => ({
    id: conversation.id,
    name: conversation.partner?.nickname ?? conversation.partner?.displayName ?? 'Partner',
    photo: conversation.partner?.avatarUrl ?? null,
    preview: conversation.lastMessage?.sticker
      ? 'Sent a sticker'
      : conversation.lastMessage?.text || 'No messages yet',
    time: conversation.lastMessage
      ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString(undefined, {
          hour: 'numeric', minute: '2-digit',
        })
      : '',
    unread: conversation.unreadCount,
    online: conversation.partner?.online ?? false,
    lastFromMe: conversation.lastMessage?.from === 'me',
  })), [conversations]);

  const filtered = chats.filter((chat) =>
    chat.name.toLowerCase().includes(query.toLowerCase()) ||
    chat.preview.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.appbar, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.appbarTitle, { color: t.text }]}>Chats</Text>
        <View style={styles.appbarActions}>
          <IconButton
            icon={searching ? X : Search}
            variant={searching ? 'soft' : 'ghost'}
            size={36}
            accessibilityLabel={searching ? 'Close search' : 'Search chats'}
            onPress={() => { setSearching((value) => !value); setQuery(''); }}
          />
          <IconButton
            icon={Link2}
            variant="soft"
            size={36}
            accessibilityLabel="Pair with your partner"
            onPress={() => router.push('/pairing')}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loadError && conversations.length > 0 ? (
          <ErrorCard error={{ kind: 'offline', title: 'Could not refresh conversations', message: 'Showing the conversations already on this device.', action: 'Retry' }} onRetry={() => void reloadConversations()} />
        ) : null}
        {searching ? (
          <View style={[styles.searchbar, { backgroundColor: t.card, borderColor: t.line }]}>
            <Search size={16} strokeWidth={2.2} color={t.text3} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search conversations"
              placeholderTextColor={t.text3}
              style={[styles.searchInput, { color: t.text }]}
              accessibilityLabel="Search chats"
            />
          </View>
        ) : null}

        <View style={styles.listHead}>
          <View>
            <Text style={[styles.listTitle, { color: t.text }]}>Your conversations</Text>
            <Text style={[styles.listSub, { color: t.text3 }]}>Messages from your Duora space</Text>
          </View>
          {conversations.length > 0 ? (
            <Text style={[styles.listCount, { color: t.text2 }]}>{conversations.length}</Text>
          ) : null}
        </View>

        {loading && conversations.length === 0 ? (
          <View style={styles.list}><CardSkeleton count={3} height={82} /></View>
        ) : loadError && conversations.length === 0 ? (
          <ErrorCard error={{ kind: 'offline', title: 'Conversations unavailable', message: 'We could not load your chats. Check the connection and try again.', action: 'Retry' }} onRetry={() => void reloadConversations()} />
        ) : filtered.length > 0 ? (
          <View style={styles.list}>
            {filtered.map((chat) => (
              <PressableScale
                key={chat.id}
                onPress={() => router.push(`/conversation/${chat.id}`)}
                accessibilityLabel={`Open chat with ${chat.name}`}
                style={styles.rowWrap}
              >
                <View style={[styles.row, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('xs')]}>
                  <Avatar src={chat.photo} size={54} ring online={chat.online} alt={chat.name} />
                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Text style={[styles.rowName, { color: t.text }]} numberOfLines={1}>{chat.name}</Text>
                      {chat.time ? <Text style={[styles.rowTime, { color: t.text3 }]}>{chat.time}</Text> : null}
                    </View>
                    <View style={styles.rowMsg}>
                      {chat.lastFromMe ? <CheckCheck size={13} strokeWidth={2.5} color={t.primary} /> : null}
                      <RichText text={chat.preview} size={12.5} color={t.text2} numberOfLines={1} />
                    </View>
                  </View>
                  {chat.unread > 0 ? (
                    <View style={[styles.unread, { backgroundColor: t.primary }]}>
                      <Text style={styles.unreadText}>{chat.unread}</Text>
                    </View>
                  ) : null}
                </View>
              </PressableScale>
            ))}
          </View>
        ) : query.trim() ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: t.primarySoft }]}>
              <Search size={27} strokeWidth={1.8} color={t.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: t.text }]}>No matches</Text>
            <Text style={[styles.emptySub, { color: t.text2 }]}>Try a different name or message.</Text>
          </View>
        ) : (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: t.primarySoft }]}>
              <MessageCircle size={29} strokeWidth={1.8} color={t.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: t.text }]}>No conversations yet</Text>
            <Text style={[styles.emptySub, { color: t.text2 }]}>Connect with your partner to start a real conversation.</Text>
            <Btn
              label="Connect with your partner"
              icon={Link2}
              block={false}
              onPress={() => router.push('/pairing')}
              style={styles.pairButton}
            />
          </View>
        )}
        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  appbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  appbarTitle: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.8 },
  appbarActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 20 },
  searchbar: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 15, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 3, paddingVertical: 10 },
  listTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.45 },
  listSub: { fontSize: 10.5, fontWeight: '500', marginTop: 3 },
  listCount: { fontSize: 12, fontWeight: '800' },
  list: { gap: 9, paddingTop: 5 },
  rowWrap: { borderRadius: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 13, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  rowName: { flex: 1, fontSize: 14.5, fontWeight: '800', letterSpacing: -0.25 },
  rowTime: { fontSize: 10.5, fontWeight: '600' },
  rowMsg: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  unread: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: 10.5, fontWeight: '800' },
  empty: { alignItems: 'center', paddingHorizontal: 34, paddingTop: 74 },
  emptyIcon: { width: 72, height: 72, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  emptySub: { fontSize: 12.5, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  pairButton: { marginTop: 20, minHeight: 48, paddingHorizontal: 18 },
});
