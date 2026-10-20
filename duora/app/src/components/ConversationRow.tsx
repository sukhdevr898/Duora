import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { DuoraAvatar } from './DuoraAvatar';
import { formatRelative, formatTime } from '../utils/formatters';
import type { ConversationSummary } from '../types/models';

interface ConversationRowProps {
  conversation: ConversationSummary;
  onPress: (conversationId: string) => void;
}

export function ConversationRow({ conversation, onPress }: ConversationRowProps) {
  const { colors, spacing, typography } = useDuoraTheme();
  const name = conversation.partner?.displayName ?? 'Your partner';
  const last = conversation.lastMessage;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open conversation with ${name}`}
      onPress={() => onPress(conversation.id)}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1, paddingVertical: spacing.md },
      ]}
    >
      <DuoraAvatar name={name} avatarUrl={conversation.partner?.avatarUrl} size={52} />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={[typography.bodyStrong, { color: colors.text, flex: 1 }]}>
            {name}
          </Text>
          {last ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {Date.now() - new Date(last.createdAt).getTime() < 86_400_000
                ? formatTime(last.createdAt)
                : formatRelative(last.createdAt)}
            </Text>
          ) : null}
        </View>
        <View style={styles.previewRow}>
          <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}>
            {last ? (last.deletedForAllAt ? 'Message deleted' : last.text) : 'Start the conversation'}
          </Text>
          {conversation.unreadCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[typography.label, { color: '#1A1330', fontSize: 11 }]}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  previewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
