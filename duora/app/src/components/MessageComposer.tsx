import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { IconButton } from './IconButton';
import { timing } from '../constants/config';
import { getSocket } from '../services/socketClient';
import { SocketEvents } from '../constants/events';
import * as repo from '../repositories/chat.repository';

interface MessageComposerProps {
  conversationId: string;
  onSend: (text: string, replyToId?: string) => void;
  replyTarget?: { id: string; text: string } | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export function MessageComposer({
  conversationId,
  onSend,
  replyTarget,
  onCancelReply,
  disabled,
}: MessageComposerProps) {
  const { colors, spacing, radii, typography } = useDuoraTheme();
  const [text, setText] = useState('');
  const lastTypingEmit = useRef(0);

  useEffect(() => {
    void repo.loadDraft(conversationId).then((draft) => {
      if (draft) setText(draft);
    });
  }, [conversationId]);

  const emitTyping = (active: boolean) => {
    const socket = getSocket();
    if (!socket?.connected) return;
    const now = Date.now();
    if (active && now - lastTypingEmit.current < timing.typingThrottleMs) return;
    lastTypingEmit.current = now;
    socket.emit(active ? SocketEvents.TYPING_START : SocketEvents.TYPING_STOP, { conversationId });
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, replyTarget?.id);
    setText('');
    void repo.saveDraft(conversationId, '');
    emitTyping(false);
    onCancelReply?.();
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {replyTarget ? (
        <View style={[styles.reply, { backgroundColor: colors.elevated }]}>
          <Ionicons name="return-up-forward-outline" size={16} color={colors.primary} />
          <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}>
            Replying: {replyTarget.text}
          </Text>
          <IconButton name="close" size={16} label="Cancel reply" onPress={() => onCancelReply?.()} />
        </View>
      ) : null}
      <View style={[styles.row, { gap: spacing.sm }]}>
        <TextInput
          accessibilityLabel="Message"
          placeholder="Message your partner…"
          placeholderTextColor={colors.textSecondary}
          multiline
          value={text}
          editable={!disabled}
          onChangeText={(next) => {
            setText(next);
            void repo.saveDraft(conversationId, next);
            emitTyping(true);
          }}
          onBlur={() => emitTyping(false)}
          style={[
            styles.input,
            typography.body,
            {
              color: colors.text,
              backgroundColor: colors.elevated,
              borderRadius: radii.xl,
              borderColor: colors.border,
            },
          ]}
        />
        <IconButton
          name="send"
          label="Send message"
          color={colors.primary}
          disabled={!text.trim() || disabled}
          onPress={handleSend}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    borderWidth: StyleSheet.hairlineWidth,
  },
  reply: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
});
