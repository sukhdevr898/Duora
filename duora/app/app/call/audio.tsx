import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  Grid3x3,
  Heart,
  Mic,
  MicOff,
  MoreHorizontal,
  Phone,
  PhoneOff,
  Plus,
  Video,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { Sheet, useToast } from '../../src/components/Overlay';
import { PressableScale } from '../../src/components/ui';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { ABSOLUTE_FILL } from '../../src/theme/tokens';
import { useStore } from '../../src/state/store';

const format = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

export default function AudioCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useDuoraTheme();
  const { toast } = useToast();

  const conversations = useStore((s) => s.conversations);
  const home = useStore((s) => s.home);
  const activeCall = useStore((s) => s.activeCall);
  const startCall = useStore((s) => s.startCall);
  const endCall = useStore((s) => s.endCall);

  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const callId = useRef<string | null>(null);
  const started = useRef(false);

  const partnerName =
    conversations[0]?.partner?.nickname ?? conversations[0]?.partner?.displayName ?? home?.partner?.nickname ?? 'your partner';
  const partnerPhoto = conversations[0]?.partner?.avatarUrl ?? home?.partner?.avatarUrl ?? null;

  // The call is real: the server creates the session, the partner's device
  // starts ringing, and the timer only runs once they pick up.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Answering an incoming call already created the session.
    if (activeCall?.state === 'active') {
      callId.current = activeCall.callId;
      return;
    }
    void startCall('voice').then((id) => {
      callId.current = id;
    });
  }, [startCall, activeCall]);

  const connected = activeCall?.state === 'active';

  useEffect(() => {
    if (!connected) return;
    setSeconds(0);
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [connected]);

  // A declined call closes the screen on its own.
  useEffect(() => {
    if (activeCall && activeCall.state === 'ended') {
      toast('The call ended');
      router.back();
    }
  }, [activeCall, router, toast]);

  const end = () => {
    if (callId.current) void endCall(callId.current);
    else if (activeCall) void endCall(activeCall.callId);
    router.back();
    toast('Call ended');
  };

  const bars = Array.from({ length: 19 });

  return (
    <LinearGradient
      colors={['#3B2A63', '#241A44', '#160F2C']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.root}
    >
      <View style={styles.hearts} pointerEvents="none">
        {[
          { left: '12%' as const, size: 14, delay: 0 },
          { left: '26%' as const, size: 9, delay: 3500 },
          { left: '72%' as const, size: 12, delay: 1400 },
          { left: '86%' as const, size: 8, delay: 5200 },
          { left: '48%' as const, size: 10, delay: 7500 },
        ].map((h, i) => (
          <FloatingHeart key={i} left={h.left} size={h.size} delay={h.delay} />
        ))}
      </View>

      <View style={[styles.body, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.topGroup}>
          <Animated.View entering={FadeIn.duration(500)} style={styles.avatar}>
            {/* the ring pulses while the call is still ringing */}
            <PulseRing active={!connected} color="#C9B3FF" />
            <Avatar src={partnerPhoto} size={130} alt={partnerName} />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(150).duration(400)} style={{ alignItems: 'center' }}>
            <Text style={styles.name}>{partnerName}</Text>
            <Text style={styles.timer}>
              {connected ? format(seconds) : '••:••'}
              <Text style={styles.state}>
                {connected ? 'Connected · Voice call' : 'Ringing…'}
              </Text>
            </Text>
            {!connected ? (
              <Text style={styles.hint}>Waiting for {partnerName} to pick up</Text>
            ) : null}
          </Animated.View>

          <View style={styles.waveform}>
            {bars.map((_, i) => (
              <WaveBar key={i} index={i} live={connected} />
            ))}
          </View>
        </View>

        <View style={styles.bottomGroup}>
          <View style={styles.grid}>
            <CallControl
              label={muted ? 'Unmute' : 'Mute'}
              active={muted}
              onPress={() => setMuted((v) => !v)}
              icon={muted ? <MicOff size={23} strokeWidth={2} /> : <Mic size={23} strokeWidth={2} />}
            />
            <CallControl
              label="Keypad"
              onPress={() => toast('The keypad is not part of this build yet')}
              icon={<Grid3x3 size={22} strokeWidth={2} />}
            />
            <CallControl
              label="Speaker"
              active={speaker}
              onPress={() => setSpeaker((v) => !v)}
              icon={speaker ? <Volume2 size={23} strokeWidth={2} /> : <VolumeX size={23} strokeWidth={2} />}
            />
            <CallControl
              label="Add Call"
              onPress={() => toast('Duora keeps it to two — always two of us')}
              icon={<Plus size={24} strokeWidth={2} />}
            />
            <CallControl
              label="Video Call"
              onPress={() => router.replace('/call/video')}
              icon={<Video size={22} strokeWidth={2} />}
            />
            <CallControl
              label="More"
              onPress={() => setMoreOpen(true)}
              icon={<MoreHorizontal size={24} strokeWidth={2} />}
            />
          </View>

          <PressableScale onPress={end} accessibilityLabel="End call" style={styles.endCall}>
            <PhoneOff size={26} strokeWidth={2.2} color="#fff" />
          </PressableScale>
        </View>
      </View>

      <Sheet
        visible={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Call options"
        subtitle="Keep the call comfortable for both of you."
      >
        <View style={{ gap: 8 }}>
          {[
            { key: 'hold', label: 'Put call on hold', icon: Phone },
            { key: 'rec', label: 'Record this moment', icon: Volume2 },
          ].map(({ key, label, icon: Icon }) => (
            <PressableScale
              key={key}
              onPress={() => {
                setMoreOpen(false);
                toast(`${label} is not part of this build yet`);
              }}
              accessibilityLabel={label}
              style={[styles.option, { backgroundColor: t.fieldBg }]}
            >
              <Icon size={16} strokeWidth={2.2} color={t.primary} />
              <Text style={[styles.optionLabel, { color: t.text }]}>{label}</Text>
            </PressableScale>
          ))}
        </View>
      </Sheet>
    </LinearGradient>
  );
}

function CallControl({
  label,
  icon,
  onPress,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <View style={styles.control}>
      <PressableScale onPress={onPress} accessibilityLabel={label}>
        <View style={[styles.controlBtn, active && styles.controlBtnOn]}>
          <View style={active ? styles.controlIconOn : undefined}>{icon}</View>
        </View>
      </PressableScale>
      <Text style={styles.controlLabel}>{label}</Text>
    </View>
  );
}

function FloatingHeart({
  left,
  size,
  delay,
}: {
  left: `${number}%`;
  size: number;
  delay: number;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 9000, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -progress.value * 700 },
      { translateX: Math.sin(progress.value * 6) * 18 },
    ],
    opacity: progress.value > 0.85 ? (1 - progress.value) * 6 : Math.min(1, progress.value * 6),
  }));

  return (
    <Animated.View style={[{ position: 'absolute', top: -20, left }, style]}>
      <Heart size={size} fill="#E3D4FF" color="#E3D4FF" />
    </Animated.View>
  );
}

/** A soft ring that breathes around the avatar while the phone is ringing. */
function PulseRing({ active, color }: { active: boolean; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [active, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: active ? (1 - progress.value) * 0.55 : 0,
    transform: [{ scale: 1 + progress.value * 0.55 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pulseRing, { borderColor: color }, style]}
    />
  );
}

function WaveBar({ index, live }: { index: number; live: boolean }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 + (index % 4) * 220, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.25, { duration: 700 + (index % 4) * 220, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    height: 6 + progress.value * 26,
    opacity: live ? 0.9 : 0.35,
  }));

  return <Animated.View style={[styles.bar, style]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hearts: { ...ABSOLUTE_FILL },
  body: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  topGroup: { alignItems: 'center' },
  bottomGroup: { alignItems: 'center' },
  avatar: { marginBottom: 18, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
  },
  hint: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '600', marginTop: 8 },
  name: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  timer: { color: 'rgba(255,255,255,0.72)', fontSize: 14, fontWeight: '600', marginTop: 6 },
  state: { color: 'rgba(233,222,255,0.85)', fontSize: 12, fontWeight: '700', marginLeft: 8 },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 42,
    marginTop: 26,
  },
  bar: { width: 3, borderRadius: 2, backgroundColor: '#C9B3FF' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 26,
    paddingHorizontal: 20,
  },
  control: { alignItems: 'center', width: 76 },
  controlBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnOn: { backgroundColor: '#fff' },
  controlIconOn: { transform: [{ scale: 1.02 }] },
  controlLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 10.5, fontWeight: '700', marginTop: 7 },
  endCall: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#e5484d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e5484d',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
  },
  optionLabel: { fontSize: 13.5, fontWeight: '600' },
});
