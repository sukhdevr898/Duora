import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { DuoraTopBar } from '../../src/components/DuoraTopBar';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { LoadingState } from '../../src/components/LoadingState';
import { ErrorState } from '../../src/components/ErrorState';
import { ConfirmationDialog } from '../../src/components/ConfirmationDialog';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { config } from '../../src/constants/config';
import { spacing } from '../../src/theme/tokens';
import {
  acceptInvitation,
  createInvitation,
  getCurrentPairing,
  verifyCode,
} from '../../src/features/pairing/pairing.api';
import { usePairingStore } from '../../src/state/pairing.store';
import { ApiClientError } from '../../src/types/api';
import type { Invitation } from '../../src/types/models';

function useCountdown(expiresAt: string | null): string {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!expiresAt) return '--:--';
  const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function InvitationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const enterMode = params.mode === 'enter';
  const { colors, typography, radii } = useDuoraTheme();
  const setPairing = usePairingStore((s) => s.setPairing);

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(!enterMode);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<Invitation | null>(null);
  const [accepting, setAccepting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { invitation: created } = await createInvitation();
      setInvitation(created);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not create an invitation.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enterMode) void load();
  }, [enterMode, load]);

  const qrPayload = useMemo(() => {
    if (!invitation) return '';
    // Opaque server token only — never a password or refresh token.
    return JSON.stringify({
      duora: 1,
      host: config.wsUrl,
      code: invitation.code,
      token: invitation.token,
      exp: new Date(invitation.expiresAt).getTime(),
    });
  }, [invitation]);

  const countdown = useCountdown(invitation?.expiresAt ?? null);

  const onVerify = async () => {
    setError(null);
    try {
      const { invitation: found } = await verifyCode(code.trim().toUpperCase());
      setPreview(found);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not verify this code.');
    }
  };

  const onAccept = async (input: { code?: string; token?: string }) => {
    setAccepting(true);
    try {
      await acceptInvitation(input);
      const { pairing } = await getCurrentPairing();
      setPairing(pairing);
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Pairing failed.');
      setPreview(null);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) return <Screen><DuoraTopBar showBack title="Invitation" /><LoadingState message="Creating your invitation…" /></Screen>;
  if (error && !invitation && !enterMode) {
    return (
      <Screen>
        <DuoraTopBar showBack title="Invitation" />
        <ErrorState message={error} onRetry={() => void load()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <DuoraTopBar showBack title={enterMode ? 'Enter code' : 'My invitation'} />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        {!enterMode && invitation ? (
          <View style={{ alignItems: 'center', gap: spacing.lg }}>
            <View style={[styles.qr, { backgroundColor: '#FFFFFF', borderRadius: radii.lg, padding: spacing.lg }]}>
              <QRCode value={qrPayload} size={220} backgroundColor="#FFFFFF" color="#241B32" />
            </View>
            <Text style={[typography.display, { color: colors.primary, letterSpacing: 3 }]}>{invitation.code}</Text>
            <View style={styles.expiry}>
              <Ionicons name="time-outline" size={16} color={colors.warning} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 6 }]}>
                Expires in {countdown}
              </Text>
            </View>
            <PrimaryButton
              label="Copy code"
              icon="copy-outline"
              fullWidth={false}
              onPress={() => void Clipboard.setStringAsync(invitation.code)}
            />
            <PrimaryButton
              label="Share invitation"
              icon="share-social-outline"
              variant="secondary"
              fullWidth={false}
              onPress={() => void Share.share({ message: `Pair with me on Duora using code ${invitation.code}` })}
            />
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
              Your partner scans this QR in Duora, or enters the code manually. Each invitation is single-use and
              expires automatically.
            </Text>
          </View>
        ) : null}

        {enterMode ? (
          <View style={{ marginTop: spacing.lg }}>
            <TextField
              label="Partner’s code"
              value={code}
              onChangeText={setCode}
              placeholder="DUO-482913"
              autoCapitalize="characters"
              autoCorrect={false}
              error={error ?? undefined}
            />
            <PrimaryButton label="Verify code" icon="checkmark-circle-outline" onPress={() => void onVerify()} />
          </View>
        ) : null}
      </ScrollView>

      <ConfirmationDialog
        visible={Boolean(preview)}
        title="Pair with this person?"
        message={preview ? `${preview.createdBy.displayName} invited you to connect on Duora.` : ''}
        confirmLabel="Pair now"
        loading={accepting}
        onConfirm={() => preview && void onAccept({ code: preview.code })}
        onCancel={() => setPreview(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  qr: { alignSelf: 'center' },
  expiry: { flexDirection: 'row', alignItems: 'center' },
});
