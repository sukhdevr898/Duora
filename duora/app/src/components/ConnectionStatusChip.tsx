import { StyleSheet, Text, View } from 'react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { useNetworkStore } from '../state/network.store';
import { usePairingStore } from '../state/pairing.store';

type ChipState = 'online' | 'offline' | 'connecting' | 'unknown';

/**
 * Reachability of the PARTNER, derived from presence events — never from the
 * local socket connection alone.
 */
export function ConnectionStatusChip() {
  const { colors, typography, spacing, radii } = useDuoraTheme();
  const socketState = useNetworkStore((s) => s.socketState);
  const presence = usePairingStore((s) => s.presence);

  const state: ChipState = presence
    ? presence.online
      ? 'online'
      : 'offline'
    : socketState === 'connecting'
      ? 'connecting'
      : 'unknown';

  const tone = {
    online: colors.success,
    offline: colors.textSecondary,
    connecting: colors.warning,
    unknown: colors.textSecondary,
  }[state];

  const label = {
    online: 'Online',
    offline: 'Offline',
    connecting: 'Connecting…',
    unknown: 'Status unknown',
  }[state];

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: colors.elevated, borderRadius: radii.pill, paddingHorizontal: spacing.md },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', height: 26, gap: 6, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
