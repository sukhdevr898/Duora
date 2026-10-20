import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { PrimaryButton } from './PrimaryButton';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const { colors, spacing, radii, typography } = useDuoraTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Dismiss dialog">
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.xl }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[typography.heading, { color: colors.text }]}>{title}</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>{message}</Text>
          <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
            <PrimaryButton
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              loading={loading}
              onPress={onConfirm}
            />
            <PrimaryButton label={cancelLabel} variant="ghost" onPress={onCancel} disabled={loading} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: 'rgba(8,5,14,0.72)' },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center' },
});
