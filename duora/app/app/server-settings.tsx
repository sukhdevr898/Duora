import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { DuoraTopBar } from '../src/components/DuoraTopBar';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { useDuoraTheme } from '../src/theme/ThemeProvider';
import { config } from '../src/constants/config';
import { useNetworkStore } from '../src/state/network.store';
import { useAuthStore } from '../src/state/auth.store';
import { reconnectSocket } from '../src/hooks/useBootstrap';
import { pingBackend } from '../src/services/diagnostics';
import { spacing, radii, typography } from '../src/theme/tokens';

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useDuoraTheme();
  return (
    <View style={styles.row}>
      <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>{label}</Text>
      <Text style={[typography.bodyStrong, { color: colors.text, flex: 1.2, textAlign: 'right' }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function ServerSettingsScreen() {
  const { colors } = useDuoraTheme();
  const socketState = useNetworkStore((s) => s.socketState);
  const lastConnectedAt = useNetworkStore((s) => s.lastConnectedAt);
  const authenticated = Boolean(useAuthStore((s) => s.tokens));
  const [health, setHealth] = useState<string>('Not checked');
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    const result = await pingBackend();
    setHealth(`${result.health} / readiness ${result.ready}`);
    setChecking(false);
  };

  return (
    <Screen>
      <DuoraTopBar showBack title="Server settings" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg }]}>
          <Row label="API base URL" value={config.apiBaseUrl} />
          <Row label="WebSocket URL" value={config.wsUrl} />
          <Row label="Environment" value={config.env} />
          <Row label="Authentication" value={authenticated ? 'Signed in' : 'No session'} />
          <Row label="Socket state" value={socketState} />
          <Row label="Last connection" value={lastConnectedAt ? new Date(lastConnectedAt).toLocaleString() : 'Never'} />
          <Row label="Reachability" value={health} />
        </View>

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          <PrimaryButton label={checking ? 'Checking…' : 'Test connection'} icon="pulse" onPress={() => void check()} />
          <PrimaryButton label="Reconnect WebSocket" variant="secondary" icon="refresh" onPress={() => void reconnectSocket()} />
        </View>

        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.lg }]}>
          A reachable server does not guarantee that authentication, messaging, notifications or WebRTC work — each is
          reported separately. Tokens and pairing secrets are never shown on this screen. Server URLs are fixed per
          build and cannot be changed to arbitrary insecure endpoints.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
