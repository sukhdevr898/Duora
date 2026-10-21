import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ArrowLeft, Flashlight, FlashlightOff, ScanLine, Sparkles } from 'lucide-react-native';
import { PressableScale } from '../../src/components/ui';
import { useToast } from '../../src/components/Overlay';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { ABSOLUTE_FILL } from '../../src/theme/tokens';
import { useStore } from '../../src/state/store';

export default function ScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useDuoraTheme();
  const { toast } = useToast();
  const acceptToken = useStore((s) => s.acceptToken);

  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);

  // The laser sweeps up and down forever - driven by a shared value so the
  // animation runs on the UI thread instead of restarting on every frame.
  const laser = useSharedValue(0);
  laser.value = withRepeat(withTiming(1, { duration: 2200 }), -1, false);
  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laser.value * 240 }],
  }));

  const onBarcode = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    const token = data.includes('token=')
      ? new URL(data.replace('duora://', 'https://')).searchParams.get('token') ?? ''
      : data;
    const ok = await acceptToken(token);
    if (ok) {
      toast('Paired 💜');
      setTimeout(() => router.replace('/pairing'), 700);
    } else {
      toast('That QR code did not work');
      setScanned(false);
    }
  };

  if (!permission) {
    return <View style={[styles.root, { backgroundColor: '#000' }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, { backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 30 }]}>
        <Text style={[styles.permissionTitle, { color: t.text }]}>Camera access needed</Text>
        <Text style={[styles.permissionSub, { color: t.text2 }]}>
          Duora uses the camera only to scan your partner&apos;s pairing QR code.
        </Text>
        <PressableScale onPress={() => void requestPermission()} accessibilityLabel="Allow camera">
          <View style={[styles.permissionBtn, { backgroundColor: t.primary }]}>
            <Text style={styles.permissionBtnText}>Allow camera</Text>
          </View>
        </PressableScale>
        <PressableScale onPress={() => router.back()} accessibilityLabel="Go back">
          <Text style={[styles.backText, { color: t.text3 }]}>Not now</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : onBarcode}
      />

      <View style={styles.overlay}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <PressableScale onPress={() => router.back()} accessibilityLabel="Back">
            <ArrowLeft size={20} strokeWidth={2.4} color="#fff" />
          </PressableScale>
          <Text style={styles.headerTitle}>Scan partner&apos;s QR</Text>
          <PressableScale
            onPress={() => setTorch((v) => !v)}
            accessibilityLabel={torch ? 'Turn torch off' : 'Turn torch on'}
          >
            {torch ? (
              <FlashlightOff size={20} strokeWidth={2.4} color="#fff" />
            ) : (
              <Flashlight size={20} strokeWidth={2.4} color="#fff" />
            )}
          </PressableScale>
        </View>

        <View style={styles.frameWrap}>
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            <Animated.View style={[styles.laser, laserStyle]} />
          </View>
          <Text style={styles.hint}>
            <ScanLine size={14} strokeWidth={2.4} color="#fff" /> Point at your partner&apos;s pairing code
          </Text>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
          <Sparkles size={13} strokeWidth={2.4} color="#E9DEFF" />
          <Text style={styles.footerText}>
            The QR contains a one-time token — it never contains a password.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { ...ABSOLUTE_FILL, justifyContent: 'space-between' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'rgba(8,5,14,0.45)',
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  frameWrap: { alignItems: 'center', gap: 22 },
  frame: { width: 250, height: 250, borderRadius: 28 },
  corner: { position: 'absolute', width: 44, height: 44, borderColor: '#E9DEFF' },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 24 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 24 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 24 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 24 },
  laser: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#B79BFF',
    shadowColor: '#B79BFF',
    shadowOpacity: 0.9,
    shadowRadius: 12,
  },
  hint: { color: '#fff', fontSize: 13, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 30,
    paddingTop: 18,
    backgroundColor: 'rgba(8,5,14,0.45)',
  },
  footerText: { color: '#E9DEFF', fontSize: 11.5, fontWeight: '600', textAlign: 'center' },
  permissionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginBottom: 8 },
  permissionSub: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 20 },
  permissionBtn: { paddingHorizontal: 26, height: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  permissionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  backText: { fontSize: 13, fontWeight: '600', marginTop: 16 },
});
