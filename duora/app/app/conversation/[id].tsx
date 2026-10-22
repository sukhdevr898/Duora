import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Send,
  Smile,
  Sticker as StickerIcon,
  Video,
  WifiOff,
} from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { RichText } from '../../src/components/RichText';
import { Sticker, stickers } from '../../src/components/Sticker';
import { Sheet, useToast } from '../../src/components/Overlay';
import { PressableScale } from '../../src/components/ui';
import { TypingBubble } from '../../src/components/TypingBubble';
import { ChatSkeleton } from '../../src/components/Skeleton';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useStore } from '../../src/state/store';
import type { ChatMessage } from '../../src/api/types';

const FALLBACK_REPLIES = ['Miss you ✨', 'Call me 💖', 'Good night 🌙'];

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useDuoraTheme();
  const { toast } = useToast();

  const messages = useStore((s) => s.messages);
  const conversations = useStore((s) => s.conversations);
  const server = useStore((s) => s.server);
  const partnerTyping = useStore((s) => s.partnerTyping);
  const partnerOnline = useStore((s) => s.partnerOnline);
  const realtimeConnected = useStore((s) => s.realtimeConnected);
  const quickReplies = useStore((s) => s.quickReplies);
  const loadMessages = useStore((s) => s.loadMessages);
  const sendMessage = useStore((s) => s.sendMessage);
  const toggleReaction = useStore((s) => s.toggleReaction);
  const setTyping = useStore((s) => s.setTyping);

  const [draft, setDraft] = useState('');
  const [stickerOpen, setStickerOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationId = String(id ?? '');

  const conversation = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId],
  );

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    void loadMessages(conversationId).finally(() => setLoading(false));
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (messages.length) {
      const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const partnerName = conversation?.partner?.nickname ?? conversation?.partner?.displayName ?? 'partner';
  const partnerPhoto = conversation?.partner?.avatarUrl ?? null;
  const replies = quickReplies.length ? quickReplies : FALLBACK_REPLIES;

  const send = useCallback(
    async (text: string) => {
      const value = text.trim();
      if (!value) return;
      setDraft('');
      setTyping(conversationId, false);
      await sendMessage(conversationId, value);
    },
    [conversationId, sendMessage, setTyping],
  );

  const sendSticker = useCallback(
    async (stickerId: string) => {
      setStickerOpen(false);
      await sendMessage(conversationId, '', stickerId);
    },
    [conversationId, sendMessage],
  );

  /** Tells the partner you are writing — throttled to one event per second. */
  const onChangeDraft = useCallback(
    (value: string) => {
      setDraft(value);
      if (!conversationId) return;
      setTyping(conversationId, value.trim().length > 0);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(conversationId, false), 2200);
    },
    [conversationId, setTyping],
  );

  useEffect(
    () => () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <MessageRow item={item} onReact={toggleReaction} animate={false} />
    ),
    [toggleReaction],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* header */}
        <View style={[styles.head, { paddingTop: insets.top + 8, borderBottomColor: t.line }]}>
          <PressableScale onPress={() => router.back()} accessibilityLabel="Back">
            <ArrowLeft size={20} strokeWidth={2.4} color={t.text} />
          </PressableScale>
          <PressableScale onPress={() => toast(`${partnerName} is online`)} accessibilityLabel="Partner profile">
            <Avatar src={partnerPhoto} size={36} online={partnerOnline} alt={partnerName} />
          </PressableScale>
          <View style={styles.who}>
            <Text style={[styles.name, { color: t.text }]}>{partnerName}</Text>
            <Text
              style={[
                styles.status,
                { color: partnerOnline ? t.mint : t.text3 },
              ]}
            >
              {partnerTyping
                ? 'typing…'
                : partnerOnline
                  ? 'Online'
                  : realtimeConnected
                    ? 'Away'
                    : 'Offline'}
            </Text>
          </View>
          <View style={styles.actions}>
            <PressableScale
              onPress={() => router.push('/call/audio')}
              accessibilityLabel="Voice call"
              style={[styles.iconBtn, { backgroundColor: t.fieldBg }]}
            >
              <Phone size={16} strokeWidth={2.3} color={t.text} />
            </PressableScale>
            <PressableScale
              onPress={() => router.push('/call/video')}
              accessibilityLabel="Video call"
              style={[styles.iconBtn, { backgroundColor: t.fieldBg }]}
            >
              <Video size={17} strokeWidth={2.3} color={t.text} />
            </PressableScale>
            <PressableScale
              onPress={() => setAttachOpen(true)}
              accessibilityLabel="More options"
              style={styles.iconBtnGhost}
            >
              <MoreVertical size={18} strokeWidth={2.3} color={t.text} />
            </PressableScale>
          </View>
        </View>

        {server.status !== 'online' ? (
          <View style={[styles.offline, { backgroundColor: `${t.danger}18` }]}>
            <WifiOff size={13} strokeWidth={2.4} color={t.danger} />
            <Text style={[styles.offlineText, { color: t.text2 }]}>
              {server.status === 'offline'
                ? 'Offline — messages will send when you reconnect'
                : 'Reconnecting…'}
            </Text>
          </View>
        ) : null}

        {/* messages */}
        {loading && messages.length === 0 ? (
          <ChatSkeleton rows={7} />
        ) : (
          <FlatList
            ref={listRef}
            style={styles.flex}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={14}
            maxToRenderPerBatch={12}
            windowSize={9}
            removeClippedSubviews
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListHeaderComponent={
              messages.length ? (
                <View style={styles.dayChipWrap}>
                  <View style={[styles.dayChip, { backgroundColor: t.fieldBg }]}>
                    <Text style={[styles.dayChipText, { color: t.text3 }]}>{dayLabel(messages[0]?.createdAt)}</Text>
                  </View>
                </View>
              ) : null
            }
            ListFooterComponent={
              <TypingBubble visible={partnerTyping} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: t.text3 }]}>
                  Say hello — the first word is always the hardest.
                </Text>
              </View>
            }
          />
        )}

        {/* quick replies */}
        <View style={styles.quickRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={replies}
            keyExtractor={(item) => item}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}
            renderItem={({ item }) => (
              <PressableScale onPress={() => void send(item)} accessibilityLabel={`Quick reply ${item}`}>
                <View style={[styles.quickChip, { backgroundColor: t.surface, borderColor: t.cardBorder }]}>
                  <RichText text={item} size={12.5} color={t.text} />
                </View>
              </PressableScale>
            )}
          />
        </View>

        {/* composer */}
        <View
          style={[
            styles.composer,
            { paddingBottom: insets.bottom + 10, backgroundColor: t.bg, borderTopColor: t.line },
          ]}
        >
          <PressableScale onPress={() => setAttachOpen(true)} accessibilityLabel="Add attachment">
            <View style={[styles.plus, { backgroundColor: t.primarySoft }]}>
              <Plus size={21} strokeWidth={2.4} color={t.primaryDeep} />
            </View>
          </PressableScale>

          <View style={[styles.field, { backgroundColor: t.fieldBg }]}>
            <TextInput
              value={draft}
              onChangeText={onChangeDraft}
              onSubmitEditing={() => void send(draft)}
              placeholder={`Message ${partnerName}...`}
              placeholderTextColor={t.text3}
              style={[styles.input, { color: t.text }]}
              accessibilityLabel="Message"
              returnKeyType="send"
              multiline={false}
            />
            <Pressable onPress={() => setStickerOpen(true)} accessibilityLabel="Stickers">
              <Smile size={19} strokeWidth={2} color={t.text3} />
            </Pressable>
            <Pressable onPress={() => toast('Photos are not part of this build yet')} accessibilityLabel="Attach file">
              <Paperclip size={18} strokeWidth={2} color={t.text3} />
            </Pressable>
          </View>

          <PressableScale
            onPress={() => void send(draft)}
            accessibilityLabel="Send message"
            style={[
              styles.sendBtn,
              { backgroundColor: draft.trim() ? t.primary : t.fieldBg },
            ]}
          >
            <Send size={18} strokeWidth={2.4} color={draft.trim() ? '#fff' : t.text3} style={{ marginLeft: 2 }} />
          </PressableScale>
        </View>
      </KeyboardAvoidingView>

      <Sheet
        visible={stickerOpen}
        onClose={() => setStickerOpen(false)}
        title="Stickers"
        subtitle="Little ways to say it — handmade for your two hearts."
      >
        <View style={styles.stickerGrid}>
          {stickers.map((s) => (
            <PressableScale
              key={s.id}
              onPress={() => void sendSticker(s.id)}
              accessibilityLabel={`Send sticker ${s.id}`}
              style={[styles.stickerBtn, { backgroundColor: t.fieldBg }]}
            >
              <Sticker id={s.id} size={54} />
            </PressableScale>
          ))}
        </View>
      </Sheet>

      <Sheet
        visible={attachOpen}
        onClose={() => setAttachOpen(false)}
        title="Share something"
        subtitle="Photos, voice notes and memories stay between the two of you."
      >
        <View style={styles.attachGrid}>
          {[
            { icon: ImageIcon, label: 'Photos' },
            { icon: Camera, label: 'Camera' },
            { icon: Mic, label: 'Voice note' },
            { icon: StickerIcon, label: 'Sticker' },
            { icon: Phone, label: 'Call' },
            { icon: Video, label: 'Video call' },
          ].map(({ icon: Icon, label }) => (
            <PressableScale
              key={label}
              onPress={() => {
                setAttachOpen(false);
                if (label === 'Call') router.push('/call/audio');
                else if (label === 'Video call') router.push('/call/video');
                else if (label === 'Sticker') setStickerOpen(true);
                else toast(`${label} is not part of this build yet`);
              }}
              accessibilityLabel={label}
              style={[styles.attachTile, { backgroundColor: t.fieldBg }]}
            >
              <Icon size={20} strokeWidth={2} color={t.text} />
              <Text style={[styles.attachLabel, { color: t.text }]}>{label}</Text>
            </PressableScale>
          ))}
        </View>
      </Sheet>
    </View>
  );
}

/** One bubble — memoised so long threads scroll smoothly. */
const MessageRow = memo(function MessageRow({
  item,
  onReact,
  animate = false,
}: {
  item: ChatMessage;
  onReact: (messageId: string, emoji: string) => void;
  /** Only the newest bubble slides in - animating every row made scrolling heavy. */
  animate?: boolean;
}) {
  const { t, shadow } = useDuoraTheme();
  const mine = item.from === 'me';

  return (
    <Animated.View
      entering={animate ? FadeInDown.duration(220) : undefined}
      style={[styles.msgRow, mine ? styles.msgRowOut : styles.msgRowIn]}
    >
      <View style={[styles.bubbleWrap, mine ? styles.bubbleWrapOut : styles.bubbleWrapIn]}>
        <PressableScale
          onPress={() => onReact(item.id, '❤️')}
          accessibilityLabel={`React to message ${item.id}`}
          style={[
            styles.bubble,
            mine ? { backgroundColor: t.primary } : { backgroundColor: t.bubbleIn },
            shadow('xs'),
          ]}
        >
          {item.sticker ? (
            <View style={styles.stickerWrap}>
              <Sticker id={item.sticker} size={62} />
            </View>
          ) : (
            <RichText
              text={item.text}
              size={14}
              color={mine ? '#fff' : t.text}
              sparkleColor="#E4D6FF"
            />
          )}
          <View style={styles.bubbleMeta}>
            <Text style={[styles.bubbleTime, { color: mine ? 'rgba(255,255,255,0.72)' : t.text3 }]}>
              {item.time}
            </Text>
            {mine ? (
              item.status === 'sent' ? (
                <Check size={11} strokeWidth={3} color="rgba(255,255,255,0.85)" />
              ) : (
                <CheckCheck
                  size={12}
                  strokeWidth={2.6}
                  color="rgba(255,255,255,0.95)"
                  opacity={item.status === 'read' ? 1 : 0.65}
                />
              )
            ) : null}
          </View>
        </PressableScale>

        {item.reactions.length > 0 ? (
          <View style={[styles.reactions, mine ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
            {item.reactions.map((r) => (
              <PressableScale
                key={r}
                onPress={() => onReact(item.id, r)}
                accessibilityLabel={`Toggle reaction ${r}`}
                style={[styles.reaction, { backgroundColor: t.surface, borderColor: t.cardBorder }]}
              >
                <RichText text={r} size={13} />
              </PressableScale>
            ))}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
});

/** "Today" / "Yesterday" / a real date. */
function dayLabel(iso?: string): string {
  if (!iso) return 'Today';
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  who: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  status: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconBtnGhost: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  offline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 8,
  },
  offlineText: { fontSize: 11.5, fontWeight: '600' },
  listContent: { paddingHorizontal: 14, paddingBottom: 6 },
  dayChipWrap: { alignItems: 'center', paddingVertical: 12 },
  dayChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  dayChipText: { fontSize: 10.5, fontWeight: '700' },
  msgRow: { flexDirection: 'row', marginBottom: 8 },
  msgRowOut: { justifyContent: 'flex-end' },
  msgRowIn: { justifyContent: 'flex-start' },
  bubbleWrap: { maxWidth: '82%' },
  bubbleWrapOut: { alignItems: 'flex-end' },
  bubbleWrapIn: { alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 18 },
  stickerWrap: { paddingVertical: 2 },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
  bubbleTime: { fontSize: 9.5, fontWeight: '600' },
  reactions: { flexDirection: 'row', gap: 4, marginTop: -6, zIndex: 2 },
  reaction: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quickRow: { paddingVertical: 8 },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  plus: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 13, fontWeight: '600' },
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  stickerBtn: { width: 68, height: 68, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  attachGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  attachTile: {
    width: '31%',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    gap: 7,
  },
  attachLabel: { fontSize: 11.5, fontWeight: '700' },
});
