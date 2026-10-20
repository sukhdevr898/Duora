import { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Screen } from '../../src/components/Screen';
import { DuoraTopBar } from '../../src/components/DuoraTopBar';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { ConfirmationDialog } from '../../src/components/ConfirmationDialog';
import { LoadingState } from '../../src/components/LoadingState';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { spacing, radii } from '../../src/theme/tokens';
import { acceptInvitation, getCurrentPairing, previewInvitation } from '../../src/features/pairing/pairing.api';
import { usePairingStore } from '../../src/state/pairing.store';
import { ApiClientError } from '../../src/types/api';
import type { Invitation } from '../../src/types/models';

type ScanError = 'invalid' | 'expired' | 'used' | 'network' | 'duplicate' | null;

export default function ScanScreen() {
  const router = useRouter();
  const { colors, typography } = useDuoraTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [preview, setPreview] = useState<Invitation | null>(null);
  const [error, setError] = useState<ScanError>(null);
  const [accepting, setAccepting] = useState(false);
  const lockRef = useRef(false);
  const setPairing = usePairingStore((s) => s.setPairing);

  useEffect(() => {
    if (!permission?.granted) void requestPermission();
  }, [permission, requestPermission]);

  const parseQr = (raw: string): { token?: string; code?: string } | null => {
    try {
      const data = JSON.parse(raw) as { duora?: number; token?: string; code?: string };
      if (data.duora === 1 && (data.token || data.code)) {
        return { token: data.token, code: data.code };
      }
      return null;
    } catch {
      return null;
    }
  };

  const onScanned = async ({ data }: { data: string }) => {
    if (lockRef.current) return;
    const parsed = parseQr(data);
    if (!parsed) {
      setError('invalid');
      return;
    }
    lockRef.current = true;
    try {
      const { invitation } = await previewInvitation(parsed);
      setPreview(invitation);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) setError('expired');
        else if (err.code === 'not_found') setError('used');
        else setError('network');
      } else {
        setError('network');
      }
    } finally {
      // Release after the user dismisses the outcome, preventing duplicate scans.
      setTimeout(() => {
        lockRef.current = false;
      }, 1500);
    }
  };

  const confirmPair = async () => {
    if (!preview) return;
    setAccepting(true);
    try {
      await acceptInvitation({ token: preview.token });
      const { pairing } = await getCurrentPairing();
      setPairing(pairing);
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof ApiClientError ? 'used' : 'network');
      setPreview(null);
    } finally {
      setAccepting(false);
    }
  };

  if (!permission) {
    return (
      <Screen>
        <DuoraTopBar showBack title="Scan QR" />
        <LoadingState message="Checking camera permission…" />
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <DuoraTopBar showBack title="Scan QR" />
        <View style={styles.permission}>
          <Text style={[typography.heading, { color: colors.text }]}>Camera permission needed</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
            Duora needs the camera to scan your partner’s pairing QR code.
          </Text>
          <View style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}>
            <PrimaryButton label="Open system settings" icon="settings" onPress={() => void Linking.openSettings()} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen showOfflineBanner={false}>
      <DuoraTopBar showBack title="Scan partner’s QR" />
      <View style={[styles.camera, { borderRadius: radii.xl, overflow: 'hidden', backgroundColor: colors.surface }]}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={(result) => void onScanned(result)}
        />
        <View style={[styles.frame, { borderColor: colors.primary }]} pointerEvents="none" />
      </View>
      {error ? (
        <Text style={[typography.body, { color: colors.error, marginTop: spacing.lg, textAlign: 'center' }]}>
          {error === 'invalid' && 'That QR code isn’t a Duora invitation.'}
          {error === 'expired' && 'This invitation has expired — ask for a new one.'}
          {error === 'used' && 'This invitation was already used or revoked.'}
          {error === 'network' && 'Network problem — check your connection and try again.'}
          {error === 'duplicate' && 'That invitation has already been scanned.'}
        </Text>
      ) : (
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.lg, textAlign: 'center' }]}
        >
          Point the camera at the QR code on your partner’s screen. Nothing is paired until you confirm.
        </Text>
      )}

      <ConfirmationDialog
        visible={Boolean(preview)}
        title="Pair with this person?"
        message={preview ? `${preview.createdBy.displayName} invited you. Pairing connects your private Duora space.` : ''}
        confirmLabel="Pair now"
        loading={accepting}
        onConfirm={() => void confirmPair()}
        onCancel={() => setPreview(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  camera: { flex: 1, marginTop: spacing.md, minHeight: 320 },
  frame: {
    position: 'absolute',
    alignSelf: 'center',
    top: '22%',
    width: 220,
    height: 220,
    borderWidth: 3,
    borderRadius: 24,
  },
  permission: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
});
