import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { useNetworkStore } from '../state/network.store';

export function OfflineBanner() {
  const { colors, typography, spacing } = useDuoraTheme();
  const { isConnected, socketState, setSocketState } = useNetworkStore();
  const show = !isConnected || socketState === 'connecting' || socketState === 'disconnected';

  if (!show && isConnected && socketState === 'connected') return null;

  const reconnecting = isConnected && socketState !== 'connected';
  const label = !isConnected
    ? 'You are offline — showing cached content'
    : reconnecting
      ? 'Reconnecting to Duora…'
      : null;

  if (!label) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Connection status. Tap to retry connection."
      onPress={() => setSocketState('connecting')}
      style={[
        styles.banner,
        { backgroundColor: colors.elevated, borderBottomColor: colors.border },
      ]}
    >
      <Ionicons
        name={isConnected ? 'cloud-done-outline' : 'cloud-offline-outline'}
        size={16}
        color={isConnected ? colors.warning : colors.error}
      />
      <View style={styles.textWrap}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Ionicons name="refresh" size={14} color={colors.primary} style={{ marginLeft: spacing.sm }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textWrap: { flex: 1, marginLeft: 8 },
});
