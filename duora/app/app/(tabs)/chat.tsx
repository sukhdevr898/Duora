import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCheck,
  Image as ImageIcon,
  Link2,
  Lock,
  Search,
  Sparkles,
  X,
} from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { BrandWordmark } from '../../src/components/BrandWordmark';
import { HeartOrb, Sparkle } from '../../src/components/Brand';
import { ConnectionPill } from '../../src/components/ConnectionPill';
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
  const notes = useStore((s) => s.notes);
  const pairing = useStore((s) => s.pairing);
  const loadConversations = useStore((s) => s.loadConversations);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      void loadConversations();
    }, [loadConversations]),
  );

  const linked = conversations.length > 0;

  const chats = useMemo(() => {
    const real = conversations.map((c) => ({
      id: c.id,
      name: c.partner?.nickname ?? c.partner?.displayName ?? 'Partner',
      photo: c.partner?.avatarUrl ?? null,
      preview: c.lastMessage?.sticker
        ? 'Sent a sticker'
        : (c.lastMessage?.text ?? 'Say something lovely'),
      time: c.lastMessage
        ? new Date(c.lastMessage.createdAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
        : '',
      unread: c.unreadCount,
      online: c.partner?.online ?? false,
    }));

    // Two real shortcuts - the notes you wrote and the pairing state.
    const special = [
      {
        id: 'c-notes',
        name: 'Shared memories',
        photo: null,
        preview: notes.length
          ? `${notes.length} ${notes.length === 1 ? 'memory' : 'memories'} saved in our space`
          : 'Write your first memory together',
        time: notes[0] ? 'recent' : '',
        unread: 0,
        online: false,
        special: true as const,
      },
      {
        id: 'c-vault',
        name: 'Secret corner',
        photo: null,
        preview: pairing?.code
          ? `Pairing code ${pairing.code} · share it with your person`
          : 'Only the two of you can read this',
        time: pairing?.phase === 'matched' ? 'paired' : '',
        unread: 0,
        online: false,
        special: true as const,
      },
    ];

    return [...real, ...special];
  }, [conversations, notes, pairing]);

  const filtered = chats.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.preview.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.appbar, { paddingTop: insets.top + 10 }]}>
        <BrandWordmark size={19} />
        <View style={styles.appbarActions}>
          <ConnectionPill compact />
          <IconButton
            icon={searching ? X : Search}
            variant={searching ? 'soft' : 'ghost'}
            size={36}
            accessibilityLabel={searching ? 'Close search' : 'Search chats'}
            onPress={() => {
              setSearching((v) => !v);
              setQuery('');
            }}
          />
          <IconButton
            icon={Link2}
            variant="soft"
            size={36}
            accessibilityLabel="Pairing"
            onPress={() => router.push('/pairing')}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {searching ? (
          <View style={styles.searchWrap}>
            <View style={[styles.searchbar, { backgroundColor: t.chipBg, borderColor: t.line }]}>
              <Search size={16} strokeWidth={2.2} color={t.text3} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search your chat…"
                placeholderTextColor={t.text3}
                style={[styles.searchInput, { color: t.text }]}
                accessibilityLabel="Search chats"
              />
            </View>
          </View>
        ) : null}

        {filtered.length > 0 ? (
          <View style={styles.list}>
            <View style={styles.listHead}>
              <Text style={[styles.listTitle, { color: t.text }]}>Your private space</Text>
              <Text style={[styles.listCount, { color: t.text3 }]}>{chats.length} chats</Text>
            </View>

            {filtered.map((c) => (
              <PressableScale
                key={c.id}
                onPress={() => {
                  if ('special' in c && c.special) router.push('/notes');
                  else router.push(`/conversation/${c.id}`);
                }}
                accessibilityLabel={c.name}
                style={styles.rowWrap}
              >
                <View style={[styles.row, { backgroundColor: t.card }, shadow('sm')]}>
                  {'special' in c && c.special ? (
                    <View style={[styles.glyph, { backgroundColor: t.primarySoft }]}>
                      {c.id === 'c-notes' ? (
                        <ImageIcon size={19} strokeWidth={2.1} color={t.primary} />
                      ) : (
                        <Lock size={19} strokeWidth={2.1} color={t.primary} />
                      )}
                    </View>
                  ) : (
                    <Avatar src={c.photo} size={50} ring online={c.online} alt={c.name} />
                  )}

                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Text style={[styles.rowName, { color: t.text }]}>{c.name}</Text>
                      <Text style={[styles.rowTime, { color: t.text3 }]}>{c.time}</Text>
                    </View>
                    <View style={styles.rowMsg}>
                      {'special' in c && c.special ? (
                        <Sparkles size={13} strokeWidth={2.6} color={t.primary2} />
                      ) : (
                        <CheckCheck size={13} strokeWidth={2.6} color={t.primary2} />
                      )}
                      <RichText text={c.preview} size={12.5} color={t.text2} numberOfLines={1} />
                    </View>
                  </View>

                  {c.unread > 0 ? (
                    <View style={[styles.unread, { backgroundColor: t.primary }]}>
                      <Text style={styles.unreadText}>{c.unread}</Text>
                    </View>
                  ) : null}
                </View>
              </PressableScale>
            ))}

            <View style={[styles.quote, { backgroundColor: t.surfaceSoft }, shadow('sm')]}>
              <View style={[styles.quoteBalloon, { backgroundColor: t.surface }]}>
                <HeartOrb size={38} tone="violet" />
              </View>
              <Text style={[styles.quoteText, { color: t.text2 }]}>
                <Text style={{ fontWeight: '800', color: t.text }}>Tip:</Text> long-press a message
                to react, reply or save it as a memory.
              </Text>
            </View>

            <View style={styles.footer}>
              <Lock size={11} strokeWidth={2.2} color={t.text3} />
              <Text style={[styles.footerText, { color: t.text3 }]}>
                Private by default · just you two
              </Text>
            </View>
          </View>
        ) : linked ? (
          <View style={styles.empty}>
            <View style={styles.emptyArt}>
              <Search size={52} strokeWidth={1.4} color="#c9bee6" />
            </View>
            <Text style={[styles.emptyTitle, { color: t.text }]}>No chats found</Text>
            <Text style={[styles.emptySub, { color: t.text2 }]}>Try a different name or word.</Text>
          </View>
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyArt}>
              <HeartOrb size={140} tone="violet" />
              <View style={{ position: 'absolute', top: 16, right: 6 }}>
                <Sparkle size={15} />
              </View>
              <View style={{ position: 'absolute', bottom: 26, left: 4 }}>
                <Sparkle size={9} />
              </View>
              <View style={{ position: 'absolute', bottom: 12, right: 16 }}>
                <Sparkle size={13} />
              </View>
            </View>
            <Text style={[styles.emptyTitle, { color: t.text }]}>No Chats Yet</Text>
            <Text style={[styles.emptySub, { color: t.text2 }]}>
              Start a conversation with your special one <RichText text="💖" size={13} />
            </Text>
            <Btn
              label="Pair with your person"
              icon={Sparkles}
              block={false}
              onPress={() => router.push('/pairing')}
              style={{ marginTop: 18, paddingHorizontal: 26 }}
            />
            <View style={styles.footer}>
              <Lock size={12} strokeWidth={2.2} color={t.text3} />
              <Text style={[styles.footerText, { color: t.text3 }]}>
                Private by default · just you two
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  appbarActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scroll: { flex: 1 },
  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  searchbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  list: { paddingHorizontal: 18, paddingBottom: 24 },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingBottom: 6,
    marginTop: 6,
  },
  listTitle: { fontSize: 13, fontWeight: '800' },
  listCount: { fontSize: 11, fontWeight: '600' },
  rowWrap: { marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  glyph: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  rowName: { fontSize: 15.5, fontWeight: '800', letterSpacing: -0.3 },
  rowTime: { fontSize: 11, fontWeight: '700' },
  rowMsg: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  unread: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  quote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 26,
    marginTop: 6,
  },
  quoteBalloon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteText: { flex: 1, fontSize: 12.5, lineHeight: 18, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  footerText: { fontSize: 10.5, fontWeight: '600' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  emptyArt: { width: 168, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  emptyTitle: { fontSize: 21, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  emptySub: { fontSize: 13.5, lineHeight: 19, textAlign: 'center' },
});
