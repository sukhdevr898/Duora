import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { ArrowLeft, Headphones, Info, PhoneOff, Wifi } from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { PageBackground } from '../../src/components/PageBackground';
import { PressableScale } from '../../src/components/ui';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useStore } from '../../src/state/store';

 type RequestState = 'checking' | 'ringing' | 'accepted' | 'unpaired' | 'failed';

export default function AudioCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();
  const conversations = useStore((s) => s.conversations);
  const home = useStore((s) => s.home);
  const activeCall = useStore((s) => s.activeCall);
  const startCall = useStore((s) => s.startCall);
  const endCall = useStore((s) => s.endCall);
  const [requestState, setRequestState] = useState<RequestState>('checking');
  const callId = useRef<string | null>(null);
  const started = useRef(false);
  const observedCall = useRef(false);
  const ending = useRef(false);
  const paired = Boolean(home?.linked || conversations.some((conversation) => conversation.partner));
  const partner = home?.partner ?? conversations[0]?.partner ?? null;
  const partnerName = partner?.nickname ?? partner?.displayName ?? 'Partner';

  useEffect(() => {
    if (activeCall?.state === 'active' || activeCall?.state === 'ringing') {
      started.current = true;
      observedCall.current = true;
      callId.current = activeCall.callId;
      setRequestState(activeCall.state === 'active' ? 'accepted' : 'ringing');
      return;
    }
    if (activeCall?.state === 'ended' && observedCall.current && !ending.current) {
      router.back();
      return;
    }
    if (started.current) return;
    if (!paired) {
      setRequestState(home ? 'unpaired' : 'checking');
      void useStore.getState().loadHome();
      void useStore.getState().loadConversations();
      return;
    }
    started.current = true;
    let mounted = true;
    void startCall('voice').then((id) => {
      if (!mounted) return;
      callId.current = id;
      setRequestState(id ? 'ringing' : 'failed');
    });
    return () => { mounted = false; };
  }, [activeCall, home, paired, router, startCall]);

  const end = async () => {
    ending.current = true;
    const id = callId.current ?? activeCall?.callId;
    if (id) await endCall(id);
    router.back();
  };

  const statusText = requestState === 'ringing'
    ? `Call request sent to ${partnerName}`
    : requestState === 'accepted'
      ? 'Request accepted'
      : requestState === 'unpaired'
        ? 'Connect a partner before starting a call'
        : requestState === 'failed'
          ? 'Could not send the call request'
          : 'Checking your connection…';

  return (
    <View style={styles.root}>
      <PageBackground />
      <LinearGradient colors={[t.primaryGhost, 'transparent']} style={styles.topGlow} pointerEvents="none" />
      <View style={[styles.appbar, { paddingTop: insets.top + 8 }]}>
        <PressableScale onPress={() => void end()} accessibilityLabel="End call request" style={[styles.backButton, { backgroundColor: t.card }]}>
          <ArrowLeft size={19} strokeWidth={2.3} color={t.text} />
        </PressableScale>
        <View style={{ flex: 1 }}>
          <Text style={[styles.appbarTitle, { color: t.text }]}>Voice call</Text>
          <Text style={[styles.appbarSub, { color: t.text3 }]}>Call request</Text>
        </View>
        <View style={[styles.callKind, { backgroundColor: t.primarySoft }]}><Headphones size={17} color={t.primary} /></View>
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 18 }]}>
        <Animated.View entering={FadeIn.duration(450)} style={[styles.callCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('md')]}>
          <View style={styles.avatarStage}>
            <PulseRing active={requestState === 'ringing'} color={t.primary} />
            <View style={[styles.avatarHalo, { backgroundColor: t.primarySoft }]}>
              <Avatar src={partner?.avatarUrl ?? null} size={112} ring online={partner?.online} alt={partnerName} />
            </View>
            <View style={[styles.callGlyph, { backgroundColor: t.primary }]}><Headphones size={17} color="#fff" /></View>
          </View>
          <Text style={[styles.partnerName, { color: t.text }]} numberOfLines={1}>{partnerName}</Text>
          <View style={styles.statusLine}>
            <View style={[styles.statusDot, { backgroundColor: requestState === 'ringing' ? t.primary : requestState === 'accepted' ? t.mint : t.text3 }]} />
            <Text style={[styles.statusText, { color: t.text2 }]}>{statusText}</Text>
          </View>
          <View style={[styles.infoCard, { backgroundColor: t.primarySoft }]}>
            <Info size={16} color={t.primary} strokeWidth={2.2} />
            <Text style={[styles.infoText, { color: t.text2 }]}>Call signalling works, but this build has no audio media transport. No microphone sound is transmitted.</Text>
          </View>
          {requestState === 'failed' ? (
            <PressableScale onPress={() => router.push('/server')} accessibilityLabel="Check server health" style={[styles.secondaryAction, { borderColor: t.lineStrong }]}>
              <Wifi size={15} color={t.primary} />
              <Text style={[styles.secondaryActionText, { color: t.primary }]}>Check server health</Text>
            </PressableScale>
          ) : null}
          {requestState === 'unpaired' ? (
            <PressableScale onPress={() => router.push('/pairing')} accessibilityLabel="Pair with partner" style={[styles.secondaryAction, { borderColor: t.lineStrong }]}>
              <Text style={[styles.secondaryActionText, { color: t.primary }]}>Open pairing</Text>
            </PressableScale>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(450).delay(100)} style={styles.bottom}>
          <PressableScale onPress={() => void end()} accessibilityLabel="End call request" style={[styles.endButton, { backgroundColor: t.danger }, shadow('sm')]}>
            <PhoneOff size={23} strokeWidth={2.2} color="#fff" />
          </PressableScale>
          <Text style={[styles.endLabel, { color: t.text2 }]}>{requestState === 'ringing' || requestState === 'accepted' ? 'End call request' : 'Close'}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

function PulseRing({ active, color }: { active: boolean; color: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    if (!active) { progress.value = 0; return; }
    progress.value = withRepeat(withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 0 })), -1, false);
  }, [active, progress]);
  const animated = useAnimatedStyle(() => ({ opacity: active ? (1 - progress.value) * 0.45 : 0, transform: [{ scale: 1 + progress.value * 0.45 }] }));
  return <Animated.View pointerEvents="none" style={[styles.pulse, { borderColor: color }, animated]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 230 },
  appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 8 },
  backButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  appbarTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  appbarSub: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  callKind: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 26 },
  callCard: { width: '100%', maxWidth: 420, alignItems: 'center', borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, padding: 22 },
  avatarStage: { width: 158, height: 158, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  avatarHalo: { width: 138, height: 138, borderRadius: 69, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 148, height: 148, borderRadius: 74, borderWidth: 2 },
  callGlyph: { position: 'absolute', right: 6, bottom: 9, width: 34, height: 34, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  partnerName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6, marginTop: 13 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11.5, fontWeight: '700' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 12, borderRadius: 15, marginTop: 19 },
  infoText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '600' },
  secondaryAction: { minHeight: 42, paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 99, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 13 },
  secondaryActionText: { fontSize: 11.5, fontWeight: '800' },
  bottom: { alignItems: 'center', gap: 8 },
  endButton: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  endLabel: { fontSize: 10.5, fontWeight: '700' },
});
