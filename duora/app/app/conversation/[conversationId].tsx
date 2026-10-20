import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { Screen } from '../../src/components/Screen';
import { DuoraAvatar } from '../../src/components/DuoraAvatar';
import { MessageBubble } from '../../src/components/MessageBubble';
import { MessageComposer } from '../../src/components/MessageComposer';
import { LoadingState } from '../../src/components/LoadingState';
import { EmptyState } from '../../src/components/EmptyState';
import { IconButton } from '../../src/components/IconButton';

import { useChatStore, selectConversation } from '../../src/state/chat.store';
import { useAuthStore } from '../../src/state/auth.store';
import { usePairingStore } from '../../src/state/pairing.store';
import * as chatSync from '../../src/features/chat/chat.sync';
import * as chatApi from '../../src/features/chat/chat.api';
import { saveMemory } from '../../src/repositories/memories.repository';
import { formatDateSeparator } from '../../src/utils/formatters';
import { spacing } from '../../src/theme/tokens';
import type { Message } from '../../src/types/models';

type ListItem = { kind: 'date'; id: string; label: string } | { kind: 'message'; id: string; message: Message };

export default function ConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const conversationId = params.conversationId;
  const { colors, typography, spacing: themeSpacing } = useDuoraTheme();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const partner = usePairingStore((s) => s.pairing.partner);
  const presence = usePairingStore((s) => s.presence);
  const conversation = useChatStore(selectConversation(conversationId ?? ''));
  const ensureConversation = useChatStore((s) => s.ensureConversation);
  const [loading, setLoading] = useState(true);
  const [replyTarget, setReplyTarget] = useState<{ id: string; text: string } | null>(null);
  const listRef = useRef<FlatList<ListItem>>(null);

  const validId = typeof conversationId === 'string' && conversationId.length > 0;

  useEffect(() => {
    if (!validId) return;
    ensureConversation(conversationId);
    void (async () => {
      setLoading(true);
      await chatSync.loadInitialMessages(conversationId);
      setLoading(false);
    })();
  }, [conversationId, validId, ensureConversation]);

  useFocusEffect(
    useCallback(() => {
      if (!validId) return;
      void chatApi.markRead(conversationId).catch(() => undefined);
    }, [conversationId, validId]),
  );

  const items = useMemo<ListItem[]>(() => {
    const out: ListItem[] = [];
    let lastDate = '';
    for (const message of conversation.messages) {
      const day = formatDateSeparator(message.createdAt);
      if (day !== lastDate) {
        lastDate = day;
        out.push({ kind: 'date', id: `date-${message.createdAt}`, label: day });
      }
      out.push({ kind: 'message', id: message.id, message });
    }
    return out;
  }, [conversation.messages]);

  const onLongPress = (message: Message) => {
    const isOwn = message.senderId === currentUserId;
    const options = ['Reply', 'Copy', 'Save as memory'];
    if (isOwn && !message.deletedForAllAt) options.push('Delete for everyone');
    options.push('Delete for me', 'Cancel');
    Alert.alert('Message', undefined, [
      ...options
        .filter((option) => option !== 'Cancel')
        .map((option) => ({
          text: option,
          style: option.startsWith('Delete') ? ('destructive' as const) : ('default' as const),
          onPress: () => void handleAction(option, message),
        })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAction = async (action: string, message: Message) => {
    if (!conversationId) return;
    switch (action) {
      case 'Reply':
        setReplyTarget({ id: message.id, text: message.text });
        break;
      case 'Copy':
        await Clipboard.setStringAsync(message.text);
        break;
      case 'Save as memory':
        await saveMemory(message);
        Alert.alert('Saved', 'Added to your memories.');
        break;
      case 'Delete for me':
        await chatApi.deleteForMe(message.id).catch(() => undefined);
        useChatStore.getState().removeMessage(conversationId, message.id);
        break;
      case 'Delete for everyone':
        try {
          const result = await chatApi.deleteForEveryone(message.id);
          useChatStore
            .getState()
            .updateMessage(conversationId, message.clientMessageId, {
              deletedForAllAt: result.at,
              text: '',
              deliveryStatus: message.deliveryStatus,
            });
        } catch {
          Alert.alert('Not allowed', 'This message could not be deleted.');
        }
        break;
      default:
        break;
    }
  };

  const onSend = (text: string, replyToId?: string) =>
    void chatSync.sendMessage(conversationId!, text, replyToId);

  const partnerName = partner?.partnerNickname ?? partner?.displayName ?? 'Your partner';

  if (!validId) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title="Invalid conversation" description="No conversation id was provided." />
      </Screen>
    );
  }

  return (
    <Screen showOfflineBanner={false}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <IconButton name="chevron-back" label="Back" onPress={() => router.back()} />
        <Pressable style={styles.headerCenter} onPress={() => router.push('/profile')}>
          <DuoraAvatar name={partnerName} avatarUrl={partner?.avatarUrl} size={40} showPresence online={Boolean(presence?.online)} />
          <View style={{ marginLeft: themeSpacing.sm, flex: 1 }}>
            <Text numberOfLines={1} style={[typography.bodyStrong, { color: colors.text }]}>
              {partnerName}
            </Text>
            <Text style={[typography.caption, { color: presence?.online ? colors.success : colors.textSecondary }]}>
              {conversation.partnerTyping ? 'typing…' : presence?.online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </Pressable>
        <IconButton name="call" label="Audio call" onPress={() => router.push('/call/audio')} />
        <IconButton name="videocam" label="Video call" onPress={() => router.push('/call/video')} />
      </View>

      {loading ? (
        <LoadingState message="Loading conversation…" />
      ) : (
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          onScroll={({ nativeEvent }) => {
            if (nativeEvent.contentOffset.y < 40 && conversation.nextCursor && !conversation.loadingOlder) {
              void chatSync.loadOlderMessages(conversationId);
            }
          }}
          scrollEventThrottle={500}
          ListHeaderComponent={
            conversation.loadingOlder ? <ActivityIndicator color={colors.primary} style={{ margin: spacing.md }} /> : null
          }
          ListEmptyComponent={
            <EmptyState icon="chatbubbles-outline" title="Start the conversation" description="Say something sweet." />
          }
          renderItem={({ item }) =>
            item.kind === 'date' ? (
              <View style={styles.dateWrap}>
                <Text style={[typography.label, { color: colors.textSecondary, backgroundColor: colors.elevated }]}>
                  {item.label}
                </Text>
              </View>
            ) : (
              <MessageBubble
                message={item.message}
                isOwn={item.message.senderId === currentUserId}
                onLongPress={onLongPress}
              />
            )
          }
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <MessageComposer
          conversationId={conversationId}
          onSend={onSend}
          replyTarget={replyTarget}
          onCancelReply={() => setReplyTarget(null)}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingRight: 8 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  listContent: { flexGrow: 1, paddingVertical: spacing.sm },
  dateWrap: { alignSelf: 'center', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginVertical: spacing.sm },
});
