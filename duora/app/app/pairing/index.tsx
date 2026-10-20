import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { DuoraTopBar } from '../../src/components/DuoraTopBar';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SettingsRow } from '../../src/components/SettingsRow';
import { ConfirmationDialog } from '../../src/components/ConfirmationDialog';
import { LoadingState } from '../../src/components/LoadingState';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { usePairingStore } from '../../src/state/pairing.store';
import { unpair } from '../../src/features/pairing/pairing.api';
import { spacing } from '../../src/theme/tokens';
import { useState } from 'react';

export default function PairingOverviewScreen() {
  const router = useRouter();
  const { colors, typography, radii } = useDuoraTheme();
  const { pairing, loadingPairing, setPairing } = usePairingStore();
  const [confirmUnpair, setConfirmUnpair] = useState(false);
  const [busy, setBusy] = useState(false);

  const paired = pairing.status === 'ACTIVE';

  return (
    <Screen showOfflineBanner>
      <DuoraTopBar showBack title="Pairing" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={[styles.status, { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg }]}>
          <Ionicons
            name={paired ? 'heart-circle' : 'heart-dislike-circle-outline'}
            size={30}
            color={paired ? colors.success : colors.textSecondary}
          />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={[typography.bodyStrong, { color: colors.text }]}>
              {paired ? `Paired with ${pairing.partner?.displayName ?? 'your partner'}` : 'Not paired'}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {paired
                ? `Since ${pairing.since ? new Date(pairing.since).toLocaleDateString() : 'recently'}`
                : 'Generate an invite or scan your partner’s QR code.'}
            </Text>
          </View>
        </View>

        {!paired ? (
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            <PrimaryButton
              label="Generate invitation code"
              icon="gift-outline"
              onPress={() => router.push('/pairing/invite')}
            />
            <PrimaryButton
              label="Scan partner’s QR code"
              icon="qr-code-outline"
              variant="secondary"
              onPress={() => router.push('/pairing/scan')}
            />
            <PrimaryButton
              label="Enter a code manually"
              icon="keypad-outline"
              variant="ghost"
              onPress={() => router.push('/pairing/invite?mode=enter')}
            />
          </View>
        ) : null}

        <View style={{ marginTop: spacing.xl }}>
          <SettingsRow
            icon="help-circle-outline"
            label="How pairing works"
            onPress={() => router.push('/pairing/help')}
          />
          {paired ? (
            <SettingsRow icon="link-outline" label="Unpair from your partner" danger onPress={() => setConfirmUnpair(true)} />
          ) : null}
        </View>

        {loadingPairing ? <LoadingState message="Checking pairing status…" /> : null}
      </ScrollView>

      <ConfirmationDialog
        visible={confirmUnpair}
        title="Unpair?"
        message="This ends the pairing on both devices. Your conversation history stays on each device until deleted."
        confirmLabel="Unpair"
        destructive
        loading={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await unpair();
            setPairing({ status: 'UNPAIRED' });
            router.replace('/(tabs)/home');
          } finally {
            setBusy(false);
            setConfirmUnpair(false);
          }
        }}
        onCancel={() => setConfirmUnpair(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
});
