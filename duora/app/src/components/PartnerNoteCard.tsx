import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { DuoraAvatar } from './DuoraAvatar';
import { EmptyState } from './EmptyState';
import { formatTime, formatDateSeparator } from '../utils/formatters';
import type { Message } from '../types/models';

interface PartnerNoteCardProps {
  partnerName: string;
  partnerAvatar?: string | null;
  note: Message | null;
  unread: boolean;
  offline: boolean;
  onPress: () => void;
}

/** "A note from your partner" — driven only by real synchronized messages. */
export function PartnerNoteCard({
  partnerName,
  partnerAvatar,
  note,
  unread,
  offline,
  onPress,
}: PartnerNoteCardProps) {
  const { colors, spacing, radii, typography } = useDuoraTheme();

  if (!note) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg }]}>
        <Text style={[typography.heading, { color: colors.text }]}>A note from your partner</Text>
        <EmptyState
          icon="mail-outline"
          title="No notes yet"
          description="Messages from your partner will appear here."
        />
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open note from ${partnerName}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={styles.titleRow}>
        <Text style={[typography.label, { color: colors.textSecondary }]}>A note from your partner</Text>
        {unread ? (
          <View style={[styles.unread, { backgroundColor: colors.secondary }]}>
            <Text style={[typography.label, { color: '#2A1220', fontSize: 10 }]}>NEW</Text>
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', marginTop: spacing.md, gap: spacing.md }}>
        <DuoraAvatar name={partnerName} avatarUrl={partnerAvatar} size={44} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={4} style={[typography.body, { color: colors.text }]}>
            {note.deletedForAllAt ? 'This message was deleted' : note.text}
          </Text>
          <View style={styles.footer}>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {formatDateSeparator(note.createdAt)} · {formatTime(note.createdAt)}
            </Text>
            {offline ? (
              <View style={styles.stale}>
                <Ionicons name="cloud-offline-outline" size={12} color={colors.warning} />
                <Text style={[typography.caption, { color: colors.warning, marginLeft: 4 }]}>Cached</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: 8 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  stale: { flexDirection: 'row', alignItems: 'center' },
  unread: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
});
