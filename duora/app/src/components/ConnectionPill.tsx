import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { useStore } from '../state/store';

/**
 * Live connection indicator — mirrors `.connect-pill`.
 * Connected · Connecting · Offline, driven by the real server heartbeat.
 */
export const ConnectionPill = memo(function ConnectionPill({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { t } = useDuoraTheme();
  const router = useRouter();
  const status = useStore((s) => s.server.status);
  const latency = useStore((s) => s.server.latency);
  const checkServer = useStore((s) => s.checkServer);

  const label =
    status === 'online' ? `Connected${compact ? '' : ` · ${latency}ms`}` : status === 'connecting' ? 'Connecting…' : 'Offline';

  const color =
    status === 'online' ? t.mint : status === 'connecting' ? t.peach : t.danger;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Server ${label}. Open server status`}
      onPress={() => {
        void checkServer();
        router.push('/server');
      }}
      style={({ pressed }) => [
        styles.pill,
        compact && styles.compact,
        {
          backgroundColor: t.chipBg,
          borderColor: t.line,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, compact && styles.textCompact, { color: t.text2 }]}>{label}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  compact: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  textCompact: {
    fontSize: 11,
  },
});
