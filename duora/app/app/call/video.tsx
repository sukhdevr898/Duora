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
  Camera,
  Info,
  MessageCircle,
  MicOff,
  Phone,
  PhoneOff,
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

export default function VideoCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();
  const conversations = useStore((s) => s.conversations);
  const home = useStore((s) => s.home);
  const user = useStore((s) => s.user);
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
  const hasVideoRequest = activeCall?.kind === 'video' && activeCall.state !== 'ended';

  useEffect(() => {
    if (activeCall?.kind === 'video' && (activeCall.state === 'active' || activeCall.state === 'ringing')) {
      started.current = true;
      observedCall.current = true;
      callId.current = activeCall.callId;
      setRequestState(activeCall.state === 'active' ? 'accepted' : 'ringing');
      return;
    }
    if (activeCall?.kind === 'video' && activeCall.state === 'ended' && observedCall.current && !ending.current) {
      router.back();
      return;
    }
    if (activeCall && activeCall.state !== 'ended' && activeCall.kind !== 'video') {
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
    void startCall('video').then((id) => {
      if (!mounted) return;
      callId.current = id;
      setRequestState(id ? 'ringing' : 'failed');
    });
    return () => { mounted = false; };
  }, [activeCall, home, paired, router, serverStatus, startCall]);

  const end = async () => {
    ending.current = true;
    const id = callId.current ?? (activeCall?.kind === 'video' ? activeCall.callId : null);
    if (id) await endCall(id);
    router.back();
  };

  const switchToVoice = async () => {
    ending.current = true;
    const id = callId.current ?? (activeCall?.kind === 'video' ? activeCall.callId : null);
    if (id) await endCall(id);
    router.replace('/call/audio');
  };

  const statusText = requestState === 'ringing'
    ? 'Request sent · waiting for a response'
    : requestState === 'accepted'
      ? 'Request accepted · video is unavailable'
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
        <PressableScale onPress={() => void end()} accessibilityLabel="Close video request" style={[styles.backButton, { backgroundColor: t.card }]}>
          <ArrowLeft size={19} strokeWidth={2.3} color={t.text} />
        </PressableScale>
        <View style={styles.headerCopy}>
          <Text style={[styles.appbarTitle, { color: t.text }]} numberOfLines={1}>{partnerName}</Text>
          <Text style={[styles.appbarSub, { color: t.text3 }]}>Video call request</Text>
        </View>
        <View style={[styles.kindIcon, { backgroundColor: t.primarySoft }]}><Video size={18} color={t.primary} /></View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(420)} style={[styles.stage, { borderColor: t.cardBorder }, shadow('md')]}>
          <LinearGradient colors={['#f5d3df', '#ec9bb7', '#d76b93']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.stageGlow} />
          <View style={styles.stageHeader}>
            <View style={styles.liveLabel}>
              <View style={[styles.liveDot, { backgroundColor: requestState === 'ringing' ? '#fff' : 'rgba(255,255,255,0.68)' }]} />
              <Text style={styles.liveLabelText}>{requestState === 'ringing' ? 'REQUEST PENDING' : 'VIDEO UNAVAILABLE'}</Text>
            </View>
            <Camera size={17} color="rgba(255,255,255,0.9)" />
          </View>

          <View style={styles.partnerStage}>
            <View style={styles.partnerRings}>
              <RequestRing active={requestState === 'ringing'} color="#fff" />
              <View style={styles.partnerAvatarFrame}>
                <Avatar src={partner?.avatarUrl ?? null} size={112} ring online={partnerOnline || partner?.online} alt={`${partnerName} profile photo`} />
              </View>
            </View>
            <Text style={styles.stageName} numberOfLines={1}>{partnerName}</Text>
            <Text style={styles.stageSubtitle}>Partner profile photo · not live video</Text>
          </View>

          <View style={[styles.selfPreview, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.62)' }]}>
            <Avatar src={user?.avatarUrl ?? null} size={46} alt="Your profile photo" />
            <View style={styles.selfPreviewCopy}>
              <Text style={styles.selfPreviewTitle}>Your profile</Text>
              <Text style={styles.selfPreviewSub}>Camera not connected</Text>
            </View>
          </View>
          <View style={styles.stageFooter}>
            <View style={styles.cameraOffBadge}><Camera size={13} color="#fff" /></View>
            <Text style={styles.stageFooterText}>No live camera stream in this build</Text>
          </View>
        </Animated.View>

        <View style={styles.callStatus}>
          {requestState === 'checking' ? (
            <ActivityIndicator size="small" color={t.primary} />
          ) : (
            <View style={[styles.statusDot, { backgroundColor: requestState === 'ringing' ? t.primary : requestState === 'accepted' ? t.mint : requestState === 'failed' ? t.danger : t.text3 }]} />
          )}
          <Text style={[styles.statusText, { color: t.text2 }]}>{statusText}</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(380).delay(70)} style={[styles.infoCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('xs')]}>
          <View style={[styles.infoIcon, { backgroundColor: t.primarySoft }]}><Info size={16} color={t.primary} strokeWidth={2.2} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: t.text }]}>Camera and audio controls are unavailable</Text>
            <Text style={[styles.infoText, { color: t.text2 }]}>This request uses Duora signalling only. It does not access your camera or transmit video or microphone audio.</Text>
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

        <View style={styles.controls}>
          <CallControl icon={MicOff} label="Microphone" disabled />
          <CallControl icon={Volume2} label="Speaker" disabled />
          <CallControl icon={Camera} label="Camera" disabled />
          <CallControl icon={Video} label="Flip camera" disabled />
          <CallControl icon={MessageCircle} label="Chat" onPress={() => router.push('/chat')} />
          <CallControl icon={Phone} label="Switch to voice" onPress={() => void switchToVoice()} disabled={!hasVideoRequest} />
        </View>

        <Animated.View entering={FadeInDown.duration(400).delay(140)} style={styles.endArea}>
          <PressableScale onPress={() => void end()} accessibilityLabel={hasVideoRequest ? 'End video call request' : 'Close'} style={[styles.endButton, { backgroundColor: t.danger }, shadow('sm')]}>
            <PhoneOff size={22} strokeWidth={2.2} color="#fff" />
          </PressableScale>
          <Text style={[styles.endLabel, { color: t.text2 }]}>{hasVideoRequest ? 'End call request' : 'Close'}</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function RequestRing({ active, color }: { active: boolean; color: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    if (!active) { progress.value = 0; return; }
    progress.value = withRepeat(withSequence(withTiming(1, { duration: 1600 }), withTiming(0, { duration: 0 })), -1, false);
  }, [active, progress]);
  const animated = useAnimatedStyle(() => ({ opacity: active ? (1 - progress.value) * 0.45 : 0, transform: [{ scale: 1 + progress.value * 0.42 }] }));
  return <Animated.View pointerEvents="none" style={[styles.requestRing, { borderColor: color }, animated]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 4 },
  backButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0 },
  appbarTitle: { fontSize: 17, lineHeight: 22, fontWeight: '800', letterSpacing: -0.4 },
  appbarSub: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  kindIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  body: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 18, paddingTop: 12, gap: 13 },
  stage: { width: '100%', minHeight: 390, borderRadius: 28, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, padding: 16, justifyContent: 'space-between' },
  stageGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -105, right: -72, backgroundColor: 'rgba(255,255,255,0.18)' },
  stageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 99, backgroundColor: 'rgba(76,20,46,0.16)', paddingHorizontal: 10, paddingVertical: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveLabelText: { color: '#fff', fontSize: 8.5, lineHeight: 11, fontWeight: '800', letterSpacing: 1 },
  partnerStage: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 4 },
  partnerRings: { width: 158, height: 158, alignItems: 'center', justifyContent: 'center' },
  requestRing: { position: 'absolute', width: 148, height: 148, borderRadius: 74, borderWidth: 2 },
  partnerAvatarFrame: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.23)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.74)' },
  stageName: { color: '#fff', fontSize: 21, lineHeight: 27, fontWeight: '800', letterSpacing: -0.5, marginTop: 10 },
  stageSubtitle: { color: 'rgba(255,255,255,0.86)', fontSize: 9.5, lineHeight: 13, fontWeight: '600', marginTop: 3 },
  selfPreview: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, borderWidth: 1, padding: 8, paddingRight: 12, marginBottom: 13 },
  selfPreviewCopy: { gap: 2 },
  selfPreviewTitle: { color: '#fff', fontSize: 9.5, lineHeight: 13, fontWeight: '800' },
  selfPreviewSub: { color: 'rgba(255,255,255,0.84)', fontSize: 8.5, lineHeight: 11, fontWeight: '600' },
  stageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  cameraOffBadge: { width: 22, height: 22, borderRadius: 8, backgroundColor: 'rgba(76,20,46,0.18)', alignItems: 'center', justifyContent: 'center' },
  stageFooterText: { color: 'rgba(255,255,255,0.88)', fontSize: 9, lineHeight: 12, fontWeight: '700' },
  callStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 10.5, lineHeight: 15, fontWeight: '700', textAlign: 'center' },
  infoCard: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  infoIcon: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 11.5, lineHeight: 16, fontWeight: '800' },
  infoText: { fontSize: 10, lineHeight: 14.5, marginTop: 3 },
  secondaryAction: { minHeight: 43, alignSelf: 'stretch', borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryActionText: { fontSize: 11, fontWeight: '800' },
  controls: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', rowGap: 13, paddingTop: 3 },
  endArea: { alignItems: 'center', gap: 6, paddingTop: 1 },
  endButton: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  endLabel: { fontSize: 9.5, fontWeight: '700' },
});
