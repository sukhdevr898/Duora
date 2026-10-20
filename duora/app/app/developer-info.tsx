import { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Application from 'expo-application';
import { Screen } from '../src/components/Screen';
import { DuoraTopBar } from '../src/components/DuoraTopBar';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { useDuoraTheme } from '../src/theme/ThemeProvider';
import { useCallStore } from '../src/state/call.store';
import { useNetworkStore } from '../src/state/network.store';
import { getExecutionRuntime } from '../src/features/calling/runtime';
import { buildDiagnosticReport, pingBackend, redactedExport } from '../src/services/diagnostics';
import { spacing, radii, typography } from '../src/theme/tokens';

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useDuoraTheme();
  return (
    <View style={styles.row}>
      <Text style={[typography.caption, { color: colors.textSecondary, flex: 1 }]}>{label}</Text>
      <Text style={[typography.body, { color: colors.text, flex: 1.4 }]}>{value}</Text>
    </View>
  );
}

export default function DeveloperInfoScreen() {
  const { colors } = useDuoraTheme();
  const [health, setHealth] = useState('Not checked');
  const socketState = useNetworkStore((s) => s.socketState);
  const callPhase = useCallStore((s) => s.phase);
  const callQuality = useCallStore((s) => s.quality);

  const runDiagnostics = async () => {
    const result = await pingBackend();
    setHealth(`${result.health} / ${result.ready}`);
  };

  const exportReport = async () => {
    const result = await pingBackend();
    const report = buildDiagnosticReport(`${result.health} / ${result.ready}`);
    await Share.share({ message: redactedExport(report), title: 'Duora diagnostics' });
  };

  return (
    <Screen>
      <DuoraTopBar showBack title="Developer info" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg }]}>
          <Row label="App name" value={Application.applicationName ?? 'Duora'} />
          <Row label="Version" value={Application.nativeApplicationVersion ?? 'unknown'} />
          <Row label="Build number" value={Application.nativeBuildVersion ?? 'unknown'} />
          <Row label="Runtime" value={getExecutionRuntime()} />
          <Row label="Backend health" value={health} />
          <Row label="WebSocket" value={socketState} />
          <Row label="Call phase" value={callPhase} />
          <Row label="Call quality" value={callQuality} />
        </View>

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          <PrimaryButton label="Run diagnostics" icon="bug-outline" onPress={() => void runDiagnostics()} />
          <PrimaryButton
            label="Export redacted report"
            variant="secondary"
            icon="share-outline"
            onPress={() => void exportReport()}
          />
        </View>

        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.lg }]}>
          The export contains app versions, runtime and connectivity state only. Access tokens, refresh tokens,
          passwords, pairing tokens and WebRTC SDP are never included.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  row: { flexDirection: 'row', paddingVertical: 4 },
});
