import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Camera, Info, MessageCircle, PhoneOff, Video } from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { PageBackground } from '../../src/components/PageBackground';
import { PressableScale } from '../../src/components/ui';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useStore } from '../../src/state/store';

export default function VideoCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();
  const conversations = useStore((s) => s.conversations);
  const home = useStore((s) => s.home);
  const activeCall = useStore((s) => s.activeCall);
  const endCall = useStore((s) => s.endCall);
  const observedCall = useRef(false);
  const ending = useRef(false);
  const partner = home?.partner ?? conversations[0]?.partner ?? null;
  const partnerName = partner?.nickname ?? partner?.displayName ?? 'Partner';

  useEffect(() => {
    if (activeCall?.kind === 'video' && activeCall.state === 'active') {
      observedCall.current = true;
      return;
    }
    if (activeCall?.state === 'ended' && observedCall.current && !ending.current) router.back();
  }, [activeCall, router]);

  const exit = async () => {
    ending.current = true;
    if (activeCall?.callId) await endCall(activeCall.callId);
    router.back();
  };

  return (
    <View style={styles.root}>
      <PageBackground />
      <LinearGradient colors={[t.primaryGhost, 'transparent']} style={styles.topGlow} pointerEvents="none" />
      <View style={[styles.appbar, { paddingTop: insets.top + 9 }]}>
        <PressableScale onPress={() => void exit()} accessibilityLabel="Back">
          <View style={[styles.backButton, { backgroundColor: t.card }]}><ArrowLeft size={19} color={t.text} strokeWidth={2.3} /></View>
        </PressableScale>
        <View style={{ flex: 1 }}>
          <Text style={[styles.appbarTitle, { color: t.text }]}>Video call</Text>
          <Text style={[styles.appbarSub, { color: t.text3 }]}>Media unavailable</Text>
        </View>
        <View style={[styles.kindIcon, { backgroundColor: t.primarySoft }]}><Video size={18} color={t.primary} /></View>
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom + 18 }]}>
        <Animated.View entering={FadeIn.duration(450)} style={[styles.stage, { borderColor: t.cardBorder }, shadow('md')]}>
          <LinearGradient colors={['#f8bfd3', '#e8769c', '#a94069']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.stageGlow} />
          <View style={styles.stageMark}><Camera size={29} color="#fff" strokeWidth={1.7} /></View>
          <Text style={styles.stageTitle}>Video is not connected</Text>
          <Text style={styles.stageText}>This build has no camera stream or media transport, so no live video is shown.</Text>
          <View style={styles.avatarRow}>
            <Avatar src={partner?.avatarUrl ?? null} size={46} alt={partnerName} />
            <View style={styles.heartBridge}><Video size={14} color="#fff" /></View>
            <Avatar src={null} size={46} alt="You" />
          </View>
          <Text style={styles.stageNames}>{partnerName} · You</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(450).delay(100)} style={[styles.infoCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('xs')]}>
          <View style={[styles.infoIcon, { backgroundColor: t.primarySoft }]}><Info size={17} color={t.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: t.text }]}>{activeCall?.kind === 'video' && activeCall.state === 'active' ? 'Request accepted · video unavailable' : 'Video calling needs a media service'}</Text>
            <Text style={[styles.infoText, { color: t.text2 }]}>Call signalling can notify the other device, but this app version cannot transmit camera or microphone media.</Text>
          </View>
        </Animated.View>

        <View style={styles.actions}>
          {activeCall?.callId ? (
            <PressableScale onPress={() => void exit()} accessibilityLabel="End video call request" style={[styles.endButton, { backgroundColor: t.danger }, shadow('sm')]}>
              <PhoneOff size={22} color="#fff" strokeWidth={2.2} />
            </PressableScale>
          ) : (
            <PressableScale onPress={() => router.push(home?.linked ? '/chat' : '/pairing')} accessibilityLabel={home?.linked ? 'Back to chat' : 'Pair with your partner'} style={[styles.primaryAction, { backgroundColor: t.primary }, shadow('primary')]}>
              <MessageCircle size={17} color="#fff" strokeWidth={2.2} />
              <Text style={styles.primaryActionText}>{home?.linked ? 'Back to chat' : 'Pair with your partner'}</Text>
            </PressableScale>
          )}
          {activeCall?.callId ? <Text style={[styles.endLabel, { color: t.text2 }]}>End call request</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 10 },
  backButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  appbarTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  appbarSub: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  kindIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 18, gap: 14 },
  stage: { minHeight: 370, borderRadius: 28, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25 },
  stageGlow: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.14)', top: -95, right: -55 },
  stageMark: { width: 62, height: 62, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.19)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  stageTitle: { color: '#fff', fontSize: 22, lineHeight: 27, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  stageText: { color: 'rgba(255,255,255,0.88)', fontSize: 11.5, lineHeight: 17, textAlign: 'center', marginTop: 7, maxWidth: 270 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 27 },
  heartBridge: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  stageNames: { color: 'rgba(255,255,255,0.92)', fontSize: 10.5, fontWeight: '700', marginTop: 10 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  infoIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 12.5, lineHeight: 17, fontWeight: '800' },
  infoText: { fontSize: 10.5, lineHeight: 15, marginTop: 4 },
  actions: { alignItems: 'center', paddingTop: 6, gap: 8 },
  endButton: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  endLabel: { fontSize: 10.5, fontWeight: '700' },
  primaryAction: { minHeight: 51, borderRadius: 18, paddingHorizontal: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryActionText: { color: '#fff', fontSize: 12.5, fontWeight: '800' },
});
