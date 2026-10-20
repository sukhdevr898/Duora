import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { formatTime } from '../utils/formatters';
import type { Message } from '../types/models';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onLongPress?: (message: Message) => void;
}

function statusIcon(status: Message['deliveryStatus'], colors: ReturnType<typeof useDuoraTheme>['colors']) {
  switch (status) {
    case 'pending':
      return <Ionicons name="time-outline" size={13} color={colors.textSecondary} />;
    case 'sending':
      return <Ionicons name="cloud-upload-outline" size={13} color={colors.textSecondary} />;
    case 'sent':
      return <Ionicons name="checkmark" size={14} color={colors.textSecondary} />;
    case 'delivered':
      return <Ionicons name="checkmark-done-outline" size={14} color={colors.textSecondary} />;
    case 'read':
      return <Ionicons name="checkmark-done" size={14} color={colors.primary} />;
    case 'failed':
      return <Ionicons name="alert-circle-outline" size={14} color={colors.error} />;
    default:
      return null;
  }
}

export function MessageBubble({ message, isOwn, onLongPress }: MessageBubbleProps) {
  const { colors, radii, typography } = useDuoraTheme();
  const deleted = Boolean(message.deletedForAll || message.deletedForAllAt);

  return (
    <View style={[styles.row, { justifyContent: isOwn ? 'flex-end' : 'flex-start' }]}>
      <View
        accessibilityRole="text"
        onStartShouldSetResponder={() => Boolean(onLongPress)}
        onResponderRelease={() => onLongPress?.(message)}
        style={[
          styles.bubble,
          {
            backgroundColor: isOwn ? colors.primary : colors.elevated,
            borderBottomRightRadius: isOwn ? radii.sm : radii.lg,
            borderBottomLeftRadius: isOwn ? radii.lg : radii.sm,
            maxWidth: '82%',
          },
        ]}
      >
        {message.replyTo && !message.replyTo.deletedForAllAt ? (
          <View
            style={[
              styles.quote,
              { borderLeftColor: isOwn ? colors.surface : colors.primary, backgroundColor: colors.overlay },
            ]}
          >
            <Text numberOfLines={2} style={[typography.caption, { color: colors.textSecondary }]}>
              {message.replyTo.text}
            </Text>
          </View>
        ) : null}
        <Text style={[typography.body, { color: isOwn ? '#1A1330' : colors.text }]}>
          {deleted ? 'This message was deleted' : message.text}
        </Text>
        <View style={styles.meta}>
          <Text
            style={[
              typography.caption,
              { color: isOwn ? 'rgba(26,19,48,0.65)' : colors.textSecondary, fontSize: 11 },
            ]}
          >
            {formatTime(message.createdAt)}
          </Text>
          {isOwn && !deleted ? statusIcon(message.deliveryStatus, colors) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 4 },
  bubble: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-end' },
  quote: { borderLeftWidth: 3, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 6 },
});
