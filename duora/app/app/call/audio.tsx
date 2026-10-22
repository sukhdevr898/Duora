import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Hash,
  Headphones,
  Info,
  MessageCircle,
  MicOff,
  PhoneOff,
  UserPlus,
  Video,
  Volume2,
  Wifi,
} from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { CallControl } from '../../src/components/CallControl';
import { PageBackground } from '../../src/components/PageBackground';
import { PressableScale } from '../../src/components/ui';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useStore } from '../../src/state/store';

type RequestState = 'checking' | 'ringing' | 'accepted' | 'unpaired' | 'failed' | 'busy';

export default function AudioCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();
  const conversations = useStore((s) => s.conversations);
  const home = useStore((s) => s.home);
  const activeCall = useStore((s) => s.activeCall);
  const serverStatus = useStore((s) => s.server.status);
  const partnerOnline = useStore((s) => s.partnerOnline);
  const startCall = useStore((s) => s.startCall);
  const endCall = useStore((s) => s.endCall);
  const [requestState, setRequestState] = useState<RequestState>('checking');
  const callId = useRef<string | null>(null);
  const started = useRef(false);
  const observedCall = useRef(false);
  const pairingCheckStarted = useRef(false);
  const ending = useRef(false);
  const paired = Boolean(home?.linked || conversations.some((conversation) => conversation.partner));
  const partner = home?.partner ?? conversations[0]?.partner ?? null;
  const partnerName = partner?.nickname ?? partner?.displayName ?? 'Partner';
  const hasVoiceRequest = activeCall?.kind === 'voice' && activeCall.state !== 'ended';

  useEffect(() => {
    if (activeCall?.kind === 'voice' && (activeCall.state === 'active' || activeCall.state === 'ringing')) {
      started.current = true;
      observedCall.current = true;
      callId.current = activeCall.callId;
      setRequestState(activeCall.state === 'active' ? 'accepted' : 'ringing');
      return;
    }
    if (activeCall?.kind === 'voice' && activeCall.state === 'ended' && observedCall.current && !ending.current) {
      router.back();
      return;
    }
    if (activeCall && activeCall.state !== 'ended' && activeCall.kind !== 'voice') {
      setRequestState('busy');
      return;
    }
    if (started.current) return;
    if (!paired) {
      setRequestState(serverStatus === 'offline' ? 'failed' : home ? 'unpaired' : 'checking');
      if (!pairingCheckStarted.current) {
        pairingCheckStarted.current = true;
        void useStore.getState().loadHome();
        void useStore.getState().loadConversations();
      }
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
  }, [activeCall, home, paired, router, serverStatus, startCall]);

  const end = async () => {
    ending.current = true;
    const id = callId.current ?? (activeCall?.kind === 'voice' ? activeCall.callId : null);
    if (id) await endCall(id);
    router.back();
  };

  const switchToVideo = async () => {
    ending.current = true;
    const id = callId.current ?? (activeCall?.kind === 'voice' ? activeCall.callId : null);
    if (id) await endCall(id);
    router.replace('/call/video');
  };

  const statusText = requestState === 'ringing'
    ? 'Request sent · waiting for a response'
    : requestState === 'accepted'
      ? 'Request accepted · audio is unavailable'
      : requestState === 'unpaired'
        ? 'Connect a partner before calling'
        : requestState === 'busy'
          ? 'Another call request is already active'
          : requestState === 'failed'
            ? 'Could not reach the call service'
            : 'Checking your connection…';

  return (
    <View style={styles.root}>
      <PageBackground />
      <LinearGradient colors={[t.primaryGhost, 'transparent']} style={styles.topGlow} pointerEvents="none" />
      <View style={[styles.appbar, { paddingTop: insets.top + 8 }]}>
        <PressableScale onPress={() => void end()} accessibilityLabel="Close call request" style={[styles.backButton, { backgroundColor: t.card }]}>
          <ArrowLeft size={19} strokeWidth={2.3} color={t.text} />
        </PressableScale>
        <View style={styles.headerCopy}>
          <Text style={[styles.appbarTitle, { color: t.text }]} numberOfLines={1}>{partnerName}</Text>
          <Text style={[styles.appbarSub, { color: t.text3 }]}>Voice call request</Text>
        </View>
        <View style={[styles.kindIcon, { backgroundColor: t.primarySoft }]}><Headphones size={18} color={t.primary} /></View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(420)} style={styles.identity}>
          <Text style={[styles.kicker, { color: t.primary }]}>DUORA VOICE REQUEST</Text>
          <View style={styles.avatarStage}>
            <View style={[styles.staticRing, styles.outerRing, { borderColor: t.primarySoft }]} />
            <View style={[styles.staticRing, styles.innerRing, { borderColor: t.primarySoft }]} />
            <PulseRing active={requestState === 'ringing'} color={t.primary} />
            <View style={[styles.avatarHalo, { backgroundColor: t.card }, shadow('md')]}>
              <Avatar src={partner?.avatarUrl ?? null} size={112} ring online={partnerOnline || partner?.online} alt={partnerName} />
            </View>
            <View style={[styles.callGlyph, { backgroundColor: t.primary }]}><Headphones size={17} color="#fff" /></View>
          </View>
          <Text style={[styles.partnerName, { color: t.text }]} numberOfLines={1}>{partnerName}</Text>
          <View style={styles.statusLine}>
            {requestState === 'checking' ? (
              <ActivityIndicator size="small" color={t.primary} />
            ) : (
              <View style={[styles.statusDot, { backgroundColor: requestState === 'ringing' ? t.primary : requestState === 'accepted' ? t.mint : requestState === 'failed' ? t.danger : t.text3 }]} />
            )}
            <Text style={[styles.statusText, { color: t.text2 }]}>{statusText}</Text>
          </View>
          {requestState === 'ringing' || requestState === 'accepted' ? (
            <View style={[styles.requestPill, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
              <View style={[styles.requestDot, { backgroundColor: requestState === 'ringing' ? t.primary : t.mint }]} />
              <Text style={[styles.requestPillText, { color: t.text2 }]}>{requestState === 'ringing' ? 'Signalling request pending' : 'Partner accepted the request'}</Text>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(380).delay(70)} style={[styles.infoCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('xs')]}>
          <View style={[styles.infoIcon, { backgroundColor: t.primarySoft }]}><Info size={16} color={t.primary} strokeWidth={2.2} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: t.text }]}>Audio media isn’t connected</Text>
            <Text style={[styles.infoText, { color: t.text2 }]}>Duora can send this call request, but this build has no audio transport. Microphone and speaker controls are unavailable.</Text>
          </View>
        </Animated.View>

        {requestState === 'failed' ? (
          <PressableScale onPress={() => router.push('/server')} accessibilityLabel="Check server health" style={[styles.secondaryAction, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <Wifi size={15} color={t.primary} />
            <Text style={[styles.secondaryActionText, { color: t.primary }]}>Check server health</Text>
          </PressableScale>
        ) : null}
        {requestState === 'unpaired' ? (
          <PressableScale onPress={() => router.push('/pairing')} accessibilityLabel="Pair with partner" style={[styles.secondaryAction, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <Text style={[styles.secondaryActionText, { color: t.primary }]}>Connect with your partner</Text>
          </PressableScale>
        ) : null}

        <View style={styles.controlBlock}>
          <Text style={[styles.controlHeading, { color: t.text3 }]}>CALL CONTROLS</Text>
          <View style={styles.controlGrid}>
            <CallControl icon={MicOff} label="Microphone" disabled />
            <CallControl icon={Volume2} label="Speaker" disabled />
            <CallControl icon={UserPlus} label="Add call" disabled />
            <CallControl icon={Video} label="Switch to video" onPress={() => void switchToVideo()} disabled={!hasVoiceRequest} />
            <CallControl icon={Hash} label="Keypad" disabled />
            <CallControl icon={MessageCircle} label="Chat" onPress={() => router.push('/chat')} />
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(400).delay(140)} style={styles.endArea}>
          <PressableScale onPress={() => void end()} accessibilityLabel={hasVoiceRequest ? 'End call request' : 'Close'} style={[styles.endButton, { backgroundColor: t.danger }, shadow('sm')]}>
            <PhoneOff size={22} strokeWidth={2.2} color="#fff" />
          </PressableScale>
          <Text style={[styles.endLabel, { color: t.text2 }]}>{hasVoiceRequest ? 'End call request' : 'Close'}</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function PulseRing({ active, color }: { active: boolean; color: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    if (!active) { progress.value = 0; return; }
    progress.value = withRepeat(withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 0 })), -1, false);
  }, [active, progress]);
  const animated = useAnimatedStyle(() => ({ opacity: active ? (1 - progress.value) * 0.42 : 0, transform: [{ scale: 1 + progress.value * 0.35 }] }));
  return <Animated.View pointerEvents="none" style={[styles.pulse, { borderColor: color }, animated]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 235 },
  appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 4 },
  backButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0 },
  appbarTitle: { fontSize: 17, lineHeight: 22, fontWeight: '800', letterSpacing: -0.4 },
  appbarSub: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  kindIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, gap: 15 },
  identity: { width: '100%', alignItems: 'center', paddingTop: 3 },
  kicker: { fontSize: 9, lineHeight: 12, fontWeight: '800', letterSpacing: 1.6 },
  avatarStage: { width: 184, height: 184, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  staticRing: { position: 'absolute', borderWidth: 1.2, borderRadius: 999 },
  outerRing: { width: 178, height: 178, opacity: 0.55 },
  innerRing: { width: 151, height: 151, opacity: 0.75 },
  pulse: { position: 'absolute', width: 145, height: 145, borderRadius: 73, borderWidth: 2 },
  avatarHalo: { width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center' },
  callGlyph: { position: 'absolute', right: 20, bottom: 23, width: 34, height: 34, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  partnerName: { maxWidth: '90%', fontSize: 23, lineHeight: 29, fontWeight: '800', letterSpacing: -0.65, marginTop: 2 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7, minHeight: 18 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, lineHeight: 16, fontWeight: '700', textAlign: 'center' },
  requestPill: { minHeight: 29, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: StyleSheet.hairlineWidth, borderRadius: 99, paddingHorizontal: 11, marginTop: 10 },
  requestDot: { width: 6, height: 6, borderRadius: 3 },
  requestPillText: { fontSize: 9.5, lineHeight: 13, fontWeight: '700' },
  infoCard: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  infoIcon: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 11.5, lineHeight: 16, fontWeight: '800' },
  infoText: { fontSize: 10, lineHeight: 14.5, marginTop: 3 },
  secondaryAction: { minHeight: 43, alignSelf: 'stretch', borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryActionText: { fontSize: 11, fontWeight: '800' },
  controlBlock: { width: '100%', paddingTop: 1 },
  controlHeading: { fontSize: 8.5, lineHeight: 11, fontWeight: '800', letterSpacing: 1.3, textAlign: 'center', marginBottom: 9 },
  controlGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: 13, columnGap: 4 },
  endArea: { alignItems: 'center', gap: 6, paddingTop: 2 },
  endButton: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  endLabel: { fontSize: 9.5, fontWeight: '700' },
});
