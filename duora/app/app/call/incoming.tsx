import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { DuoraAvatar } from '../../src/components/DuoraAvatar';
import { CallActionButton } from '../../src/components/CallActionButton';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useCallStore } from '../../src/state/call.store';
import { usePairingStore } from '../../src/state/pairing.store';
import { callCoordinator } from '../../src/features/calling/CallCoordinator';
import { isExpoGo } from '../../src/features/calling/runtime';
import { CallDevBuildNotice } from '../../src/features/calling/CallDevBuildNotice';
import { spacing, typography } from '../../src/theme/tokens';
import type { CallType } from '../../src/types/models';

export default function IncomingCallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ callId?: string; callType?: string }>();
  const { colors } = useDuoraTheme();
  const phase = useCallStore((s) => s.phase);
  const callType = useCallStore((s) => s.callType);
  const partner = usePairingStore((s) => s.pairing.partner);
  const [busy, setBusy] = useState(false);

  const partnerName = partner?.partnerNickname ?? partner?.displayName ?? 'Your partner';
  const type: CallType = (params.callType as CallType) ?? callType ?? 'AUDIO';

  // If the caller hangs up first, leave the screen automatically.
  useEffect(() => {
    if (phase === 'cancelled' || phase === 'declined' || phase === 'ended') {
      const id = setTimeout(() => router.back(), 600);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [phase, router]);

  if (isExpoGo()) {
    return (
      <Screen showOfflineBanner={false}>
        <CallDevBuildNotice onBack={() => router.back()} />
      </Screen>
    );
  }

  const accept = async () => {
    setBusy(true);
    try {
      await callCoordinator.acceptIncoming();
      router.replace(type === 'VIDEO' ? '/call/video' : '/call/audio');
    } catch {
      setBusy(false);
      router.back();
    }
  };

  const decline = async () => {
    setBusy(true);
    await callCoordinator.declineIncoming();
    router.back();
  };

  return (
    <Screen showOfflineBanner={false}>
      <View style={styles.center}>
        <DuoraAvatar name={partnerName} avatarUrl={partner?.avatarUrl} size={112} showPresence online />
        <Text style={[typography.title, { color: colors.text, marginTop: spacing.xl }]}>{partnerName}</Text>
        <Text style={[typography.body, { color: colors.primary, marginTop: spacing.xs }]}>
          Incoming {type === 'VIDEO' ? 'video call' : 'audio call'}…
        </Text>
      </View>
      <View style={styles.controls}>
        <CallActionButton icon="call" label="Accept" onPress={() => void accept()} disabled={busy} />
        <CallActionButton icon="close-circle" label="Decline" destructive onPress={() => void decline()} disabled={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'space-evenly', paddingBottom: spacing.xxxl },
});
