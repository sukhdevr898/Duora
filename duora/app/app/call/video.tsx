import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { CallActionButton } from '../../src/components/CallActionButton';
import { CallControl } from '../../src/components/CallControl';
import { CallDevBuildNotice } from '../../src/features/calling/CallDevBuildNotice';
import { useOutgoingCall } from '../../src/features/calling/useOutgoingCall';
import { useCallDuration } from '../../src/features/calling/useCallTimer';
import { callCoordinator } from '../../src/features/calling/CallCoordinator';
import { isExpoGo, loadWebRTC } from '../../src/features/calling/runtime';
import { useCallStore } from '../../src/state/call.store';
import { usePairingStore } from '../../src/state/pairing.store';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { spacing, radii, typography } from '../../src/theme/tokens';

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

export default function VideoCallScreen() {
  const router = useRouter();
  const { colors } = useDuoraTheme();
  const { error } = useOutgoingCall('VIDEO');
  const phase = useCallStore((s) => s.phase);
  const localStreamUrl = useCallStore((s) => s.localStreamUrl);
  const remoteStreamUrl = useCallStore((s) => s.remoteStreamUrl);
  const cameraOn = useCallStore((s) => s.cameraOn);
  const frontCamera = useCallStore((s) => s.frontCamera);
  const partner = usePairingStore((s) => s.pairing.partner);
  const duration = useCallDuration();
  const partnerName = partner?.partnerNickname ?? partner?.displayName ?? 'Your partner';

  const WebRTC = isExpoGo() ? null : loadWebRTC();
  const RTCView = WebRTC?.RTCView ?? null;

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

  // The coordinator outlives the screen: leaving it does not end the call.
  useEffect(() => () => callCoordinator.release(), []);

  if (isExpoGo() || !RTCView) {
    return (
      <Screen showOfflineBanner={false}>
        <CallDevBuildNotice onBack={() => router.back()} />
      </Screen>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#05030A' }]}>
      {/* Real remote WebRTC video — never a placeholder image. */}
      {remoteStreamUrl ? (
        <RTCView streamURL={remoteStreamUrl} objectFit="cover" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={styles.waiting}>
          <Text style={[typography.heading, { color: colors.text }]}>{error ?? PHASE_LABEL[phase]}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Waiting for your partner’s video…
          </Text>
        </View>
      )}

      <View style={[styles.topOverlay, { backgroundColor: 'rgba(5,3,10,0.45)' }]}>
        <Text style={[typography.bodyStrong, { color: '#FFFFFF' }]}>{partnerName}</Text>
        <Text style={[typography.caption, { color: '#D8CEEA' }]}>
          {phase === 'connected' ? duration : PHASE_LABEL[phase]}
        </Text>
      </View>

      {/* Local camera preview */}
      {localStreamUrl && cameraOn ? (
        <View style={[styles.local, { borderRadius: radii.lg, overflow: 'hidden' }]}>
          <RTCView streamURL={localStreamUrl} mirror={frontCamera} objectFit="cover" style={StyleSheet.absoluteFill} />
        </View>
      ) : null}

      <View style={styles.bottomOverlay}>
        <CallControl video />
        <View style={styles.endRow}>
          <CallActionButton icon="call" label="End call" destructive onPress={() => void callCoordinator.hangup()} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  waiting: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topOverlay: {
    position: 'absolute',
    top: spacing.xxl,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  local: {
    position: 'absolute',
    top: 110,
    right: spacing.lg,
    width: 116,
    height: 168,
    backgroundColor: '#191423',
  },
  bottomOverlay: { position: 'absolute', left: 0, right: 0, bottom: spacing.xl, paddingHorizontal: spacing.lg },
  endRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
});
