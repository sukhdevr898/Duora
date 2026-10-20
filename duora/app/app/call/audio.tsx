import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { DuoraAvatar } from '../../src/components/DuoraAvatar';
import { CallActionButton } from '../../src/components/CallActionButton';
import { CallControl } from '../../src/components/CallControl';
import { CallDevBuildNotice } from '../../src/features/calling/CallDevBuildNotice';
import { useOutgoingCall } from '../../src/features/calling/useOutgoingCall';
import { useCallDuration } from '../../src/features/calling/useCallTimer';
import { callCoordinator } from '../../src/features/calling/CallCoordinator';
import { isExpoGo } from '../../src/features/calling/runtime';
import { useCallStore } from '../../src/state/call.store';
import { usePairingStore } from '../../src/state/pairing.store';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { spacing, typography } from '../../src/theme/tokens';

const PHASE_LABEL: Record<string, string> = {
  calling: 'Calling…',
  ringing: 'Ringing…',
  connecting: 'Connecting…',
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
  ended: 'Call ended',
  failed: 'Call failed',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

export default function AudioCallScreen() {
  const router = useRouter();
  const { colors } = useDuoraTheme();
  const { error } = useOutgoingCall('AUDIO');
  const phase = useCallStore((s) => s.phase);
  const quality = useCallStore((s) => s.quality);
  const partner = usePairingStore((s) => s.pairing.partner);
  const duration = useCallDuration();
  const partnerName = partner?.partnerNickname ?? partner?.displayName ?? 'Your partner';

  useEffect(() => {
    if (['ended', 'declined', 'cancelled', 'failed'].includes(phase)) {
      const id = setTimeout(() => {
        callCoordinator.release();
        router.back();
      }, 900);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [phase, router]);

  useEffect(() => () => callCoordinator.release(), []);

  if (isExpoGo()) {
    return (
      <Screen showOfflineBanner={false}>
        <CallDevBuildNotice onBack={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen showOfflineBanner={false}>
      <View style={styles.center}>
        <DuoraAvatar name={partnerName} avatarUrl={partner?.avatarUrl} size={128} showPresence online={phase === 'connected'} />
        <Text style={[typography.title, { color: colors.text, marginTop: spacing.xl }]}>{partnerName}</Text>
        <Text style={[typography.body, { color: phase === 'connected' ? colors.success : colors.primary, marginTop: spacing.xs }]}>
          {error ?? (phase === 'connected' ? duration : PHASE_LABEL[phase] ?? 'Calling…')}
        </Text>
        {phase === 'reconnecting' || quality === 'weak' ? (
          <Text style={[typography.caption, { color: colors.warning, marginTop: spacing.sm }]}>
            Weak network — keeping audio connected
          </Text>
        ) : null}
      </View>

      <View style={styles.bottom}>
        <CallControl video={false} />
        <View style={styles.endRow}>
          <CallActionButton icon="call" label="End call" destructive onPress={() => void callCoordinator.hangup()} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottom: { paddingBottom: spacing.xxl },
  endRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
});
