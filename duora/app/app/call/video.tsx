import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  MoreHorizontal,
  PhoneOff,
  SwitchCamera,
} from 'lucide-react-native';
import { Sheet, useToast } from '../../src/components/Overlay';
import { PressableScale } from '../../src/components/ui';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useStore } from '../../src/state/store';

const format = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

export default function VideoCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useDuoraTheme();
  const { toast } = useToast();

  const conversations = useStore((s) => s.conversations);
  const home = useStore((s) => s.home);
  const user = useStore((s) => s.user);
  const startCall = useStore((s) => s.startCall);
  const endCall = useStore((s) => s.endCall);

  const [videoOn, setVideoOn] = useState(true);
  const [muted, setMuted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const callId = useRef<string | null>(null);
  const started = useRef(false);

  const partnerName =
    conversations[0]?.partner?.nickname ?? conversations[0]?.partner?.displayName ?? home?.partner?.nickname ?? 'ruhi';
  const partnerPhoto = conversations[0]?.partner?.avatarUrl ?? home?.partner?.avatarUrl ?? null;
  const myPhoto = user?.avatarUrl ?? null;

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void startCall('video').then((id) => {
      callId.current = id;
    });
    const timer = setTimeout(() => setConnected(true), 2200);
    return () => clearTimeout(timer);
  }, [startCall]);

  useEffect(() => {
    if (!connected) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [connected]);

  const end = () => {
    if (callId.current) void endCall(callId.current);
    router.back();
    toast('Video call ended');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#4A3580', '#2A1F50', '#15102A']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {partnerPhoto ? (
        <Image source={{ uri: partnerPhoto }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      <LinearGradient
        colors={['rgba(10,6,22,0.55)', 'rgba(10,6,22,0.15)', 'rgba(10,6,22,0.8)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <PressableScale onPress={() => router.back()} accessibilityLabel="Back">
          <View style={styles.vcBtn}>
            <ArrowLeft size={19} strokeWidth={2.4} color="#fff" />
          </View>
        </PressableScale>
      </View>

      <Animated.View entering={FadeInDown.delay(200).springify().damping(20)} style={styles.pip}>
        {myPhoto ? (
          <Image source={{ uri: myPhoto }} style={styles.pipImage} resizeMode="cover" />
        ) : (
          <View style={[styles.pipImage, styles.pipFallback]} />
        )}
        <View style={styles.pipTag}>
          <Text style={styles.pipTagText}>You</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(300)} style={[styles.info, { bottom: insets.bottom + 150 }]}>
        <Text style={styles.infoName}>{partnerName}</Text>
        <Text style={styles.infoTimer}>{connected ? format(seconds) : 'Connecting…'}</Text>
        <View style={styles.hdBadge}>
          <Text style={styles.hdText}>HD · {connected ? 'Secure' : 'Establishing'}</Text>
        </View>
      </Animated.View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 26 }]}>
        <PressableScale
          onPress={() => setVideoOn((v) => !v)}
          accessibilityLabel={videoOn ? 'Turn camera off' : 'Turn camera on'}
        >
          <View style={styles.vcBtn}>
            {videoOn ? (
              <Camera size={22} strokeWidth={2} color="#fff" />
            ) : (
              <CameraOff size={22} strokeWidth={2} color="#fff" />
            )}
          </View>
        </PressableScale>

        <PressableScale onPress={end} accessibilityLabel="End video call">
          <View style={[styles.vcBtn, styles.vcEnd]}>
            <PhoneOff size={26} strokeWidth={2.2} color="#fff" />
          </View>
        </PressableScale>

        <PressableScale
          onPress={() => setMuted((v) => !v)}
          accessibilityLabel={muted ? 'Unmute' : 'Mute'}
        >
          <View style={[styles.vcBtn, muted && styles.vcOn]}>
            {muted ? (
              <MicOff size={22} strokeWidth={2} color={muted ? '#1a1030' : '#fff'} />
            ) : (
              <Mic size={22} strokeWidth={2} color="#fff" />
            )}
          </View>
        </PressableScale>

        <PressableScale onPress={() => setMoreOpen(true)} accessibilityLabel="More options">
          <View style={styles.vcBtn}>
            <MoreHorizontal size={22} strokeWidth={2} color="#fff" />
          </View>
        </PressableScale>
      </View>

      <Sheet
        visible={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Video options"
        subtitle="Switch, share or change how you appear."
      >
        <View style={{ gap: 8 }}>
          {[
            { key: 'flip', label: 'Flip camera', icon: SwitchCamera },
            { key: 'fx', label: 'Camera effects', icon: Camera },
          ].map(({ key, label, icon: Icon }) => (
            <PressableScale
              key={key}
              onPress={() => {
                setMoreOpen(false);
                toast(key === 'flip' ? 'Camera flipped' : 'Camera effects coming soon');
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#15102A' },
  top: { flexDirection: 'row', paddingHorizontal: 18 },
  vcBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vcEnd: { backgroundColor: '#e5484d', width: 62, height: 62, borderRadius: 31 },
  vcOn: { backgroundColor: '#fff' },
  pip: {
    position: 'absolute',
    top: 96,
    right: 18,
    width: 104,
    height: 148,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  pipImage: { width: '100%', height: '100%' },
  pipFallback: { backgroundColor: 'rgba(255,255,255,0.16)' },
  pipTag: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(10,6,22,0.55)',
  },
  pipTagText: { color: '#fff', fontSize: 9.5, fontWeight: '700' },
  info: { position: 'absolute', left: 24, alignItems: 'flex-start' },
  infoName: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  infoTimer: { color: 'rgba(255,255,255,0.78)', fontSize: 13.5, fontWeight: '600', marginTop: 4 },
  hdBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  hdText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16 },
  optionLabel: { fontSize: 13.5, fontWeight: '600' },
});
