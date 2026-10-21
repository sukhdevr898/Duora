/**
 * The incoming call screen.
 *
 * It floats above every other screen so a call always reaches the user, no
 * matter which tab they are on.
 */
import { memo, useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Phone, PhoneOff, Video } from 'lucide-react-native';

import { Avatar } from './Avatar';
import { PressableScale } from './ui';
import { useStore } from '../state/store';
import { realtime } from '../api/socket';

export const IncomingCallOverlay = memo(function IncomingCallOverlay() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const call = useStore((s) => s.incomingCall);
  const answer = useStore((s) => s.answerIncomingCall);
  const decline = useStore((s) => s.declineIncomingCall);

  useEffect(() => {
    if (!call) return;
    // Ring once, then every few seconds until the user answers.
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
    const id = setInterval(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }, 3500);
    return () => clearInterval(id);
  }, [call]);

  if (!call) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => void decline()}>
      <LinearGradient
        colors={['#2B1D55', '#17102C', '#0D0919']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.root}
      >
        <View style={[styles.body, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 48 }]}>
          <Text style={styles.kicker}>
            {call.kind === 'video' ? 'Incoming video call' : 'Incoming voice call'}
          </Text>
          <Text style={styles.name}>{call.fromName}</Text>
          <Text style={styles.hint}>Duora is ringing you</Text>

          <View style={styles.avatarWrap}>
            <PulseRing delay={0} />
            <PulseRing delay={700} />
            <Animated.View entering={undefined} style={styles.avatar}>
              <Avatar src={null} size={132} alt={call.fromName} />
            </Animated.View>
          </View>

          <View style={styles.actions}>
            <PressableScale
              onPress={() => void decline()}
              accessibilityLabel="Decline call"
              style={[styles.actionBtn, { backgroundColor: '#e5484d' }]}
            >
              <PhoneOff size={28} strokeWidth={2.2} color="#fff" />
            </PressableScale>
            <PressableScale
              onPress={() => {
                void answer();
                realtime.answerCall(call.callId);
                router.push(call.kind === 'video' ? '/call/video' : '/call/audio');
              }}
              accessibilityLabel="Accept call"
              style={[styles.actionBtn, { backgroundColor: '#22c55e' }]}
            >
              {call.kind === 'video' ? (
                <Video size={28} strokeWidth={2.2} color="#fff" />
              ) : (
                <Phone size={28} strokeWidth={2.2} color="#fff" />
              )}
            </PressableScale>
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );
});

function PulseRing({ delay }: { delay: number }) {
  const value = useSharedValue(0);
  value.value = withDelay(
    delay,
    withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    ),
  );
  const style = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - value.value),
    transform: [{ scale: 1 + value.value * 0.6 }],
  }));
  return <Animated.View style={[styles.ring, style]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: 'rgba(233,222,255,0.7)', fontSize: 12.5, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  name: { color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: -0.8, marginTop: 8 },
  hint: { color: 'rgba(233,222,255,0.66)', fontSize: 13, fontWeight: '600', marginTop: 6 },
  avatarWrap: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#8F6BFF',
  },
  avatar: { borderRadius: 66, overflow: 'hidden' },
  actions: { flexDirection: 'row', gap: 46 },
  actionBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
