/**
 * The launch screen.
 *
 * Expo keeps the native splash up until the app is ready; on top of it we
 * draw our own animated splash so the icon the user picked (Duora, clock,
 * weather, calculator or notes) is the first thing they see.
 *
 * Everything here runs on the UI thread: a spring for the icon, a slow
 * conic shimmer behind it, floating hearts, rising particles and a soft
 * breathing glow. Nothing re-renders while it plays.
 */
import { memo, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppIcon, type PrivacyIconKey } from '../privacy/icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { ABSOLUTE_FILL } from '../theme/tokens';

type ParticleSpec = {
  /** percentage from the left */
  x: number;
  /** percentage from the top */
  y: number;
  size: number;
  delay: number;
  drift: number;
  hue: 'primary' | 'pink';
};

const PARTICLES: ParticleSpec[] = [
  { x: 16, y: 74, size: 5, delay: 120, drift: 22, hue: 'primary' },
  { x: 28, y: 84, size: 3, delay: 420, drift: 34, hue: 'pink' },
  { x: 68, y: 80, size: 4, delay: 240, drift: 28, hue: 'primary' },
  { x: 82, y: 70, size: 3, delay: 560, drift: 18, hue: 'pink' },
  { x: 46, y: 90, size: 6, delay: 680, drift: 40, hue: 'primary' },
  { x: 90, y: 86, size: 4, delay: 320, drift: 30, hue: 'primary' },
];

export const SplashScreen = memo(function SplashScreen({
  icon,
  visible,
}: {
  icon: PrivacyIconKey;
  visible: boolean;
}) {
  const { t, mode } = useDuoraTheme();
  const dark = mode === 'dark';

  const [mounted, setMounted] = useState(true);
  const fade = useSharedValue(1);
  const scale = useSharedValue(0.72);
  const glow = useSharedValue(0);
  const spin = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const wordmark = useSharedValue(0);

  // Everything on this screen runs on the UI thread, and it all starts once
  // so a re-render never restarts the motion.
  useEffect(() => {
    // The icon settles in with a soft spring.
    scale.value = withSpring(1, { damping: 13, stiffness: 110, mass: 0.75 });
    // The halo behind it breathes.
    glow.value = withDelay(
      120,
      withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }), -1, true),
    );
    // The light sweeps around the icon.
    spin.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1, false);
    // A highlight travels across the wordmark.
    shimmer.value = withDelay(
      700,
      withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }), -1, false),
    );
    // The wordmark breathes gently.
    wordmark.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [scale, glow, spin, shimmer, wordmark]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.22 + glow.value * 0.34,
    transform: [{ scale: 0.86 + glow.value * 0.42 }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: spin.value * 26 - 13 }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: 0.82 + wordmark.value * 0.18,
    transform: [{ scale: 0.985 + wordmark.value * 0.015 }],
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${8 + shimmer.value * 92}%`,
  }));

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  // The splash eases away instead of snapping off, and it stops catching
  // touches the moment it starts to fade so the app is never blocked.
  useEffect(() => {
    if (visible) {
      setMounted(true);
      fade.value = 1;
      return;
    }
    fade.value = withTiming(0, { duration: 420, easing: Easing.out(Easing.ease) });
    const timer = setTimeout(() => setMounted(false), 440);
    return () => clearTimeout(timer);
  }, [visible, fade]);

  if (!mounted) return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.root, { backgroundColor: dark ? '#0F0B1B' : t.bg }, fadeStyle]}
    >
      <Image
        source={require('../../assets/images/note-1.jpg')}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={dark
          ? ['rgba(15,11,27,0.62)', 'rgba(15,11,27,0.48)', 'rgba(15,11,27,0.82)']
          : ['rgba(255,248,250,0.28)', 'rgba(255,238,244,0.5)', 'rgba(255,226,236,0.88)']}
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* soft light behind the icon */}
      <View style={styles.backdrop} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="splashGlow" cx="0.5" cy="0.42" rx="0.62" ry="0.42">
              <Stop offset="0%" stopColor={t.primary} stopOpacity={dark ? 0.42 : 0.24} />
              <Stop offset="100%" stopColor={t.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#splashGlow)" />
        </Svg>
      </View>

      {/* the halo that breathes behind the icon */}
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="halo" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
              <Stop offset="0%" stopColor={t.primary} stopOpacity={0.85} />
              <Stop offset="55%" stopColor={t.primary2} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={t.primary2} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#halo)" />
        </Svg>
      </Animated.View>

      {/* a light that sweeps around the icon */}
      <Animated.View style={[styles.sweep, sweepStyle]} pointerEvents="none">
        <View style={[styles.sweepDot, { backgroundColor: t.primary }]} />
      </Animated.View>

      {/* rising hearts and sparkles */}
      <View style={styles.particles} pointerEvents="none">
        {PARTICLES.map((p) => (
          <Particle key={`${p.x}-${p.y}`} {...p} color={p.hue === 'pink' ? t.pink : t.primary} />
        ))}
      </View>

      <Animated.View entering={FadeIn.duration(500)} style={styles.center}>
        <Animated.View style={iconStyle}>
          <AppIcon icon={icon} size={108} />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(220).duration(600)} style={styles.brand}>
          <Animated.View style={wordmarkStyle}>
            <Text style={[styles.wordmark, { color: t.text }]}>Duora</Text>
          </Animated.View>
          <Text style={[styles.tagline, { color: dark ? t.text2 : '#75475a' }]}>Always Together</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(420).duration(600)} style={styles.heartRow}>
          <View style={[styles.heartLine, { backgroundColor: t.line }]} />
          <Animated.View style={waveStyle}>
            <Heart size={13} fill={t.primary} color={t.primary} />
          </Animated.View>
          <View style={[styles.heartLine, { backgroundColor: t.line }]} />
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(600).duration(600)} style={styles.footer}>
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <Pulse key={i} delay={i * 220} color={t.primary} />
          ))}
        </View>
        <Text style={[styles.footerText, { color: dark ? t.text2 : "#75475a" }]}>Bringing you closer</Text>
        <View style={[styles.track, { backgroundColor: t.line }]}>
          <Animated.View style={[styles.fill, { backgroundColor: t.primary }, progressStyle]} />
        </View>
      </Animated.View>
    </Animated.View>
  );
});

function Particle({
  x,
  y,
  size,
  delay,
  drift,
  color,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
  drift: number;
  color: string;
}) {
  const value = useSharedValue(0);
  useEffect(() => {
    value.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, value]);
  const style = useAnimatedStyle(() => ({
    opacity: value.value < 0.1 ? value.value * 10 : (1 - value.value) * 0.85,
    transform: [
      { translateY: -value.value * drift },
      { scale: 0.6 + value.value * 0.8 },
    ],
  }));
  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: `${x}%` as `${number}%`,
          top: `${y}%` as `${number}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function Pulse({ delay, color }: { delay: number; color: string }) {
  const value = useSharedValue(0);
  useEffect(() => {
    value.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 620, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 620, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, value]);
  const style = useAnimatedStyle(() => ({ opacity: 0.25 + value.value * 0.75 }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  root: { ...ABSOLUTE_FILL, alignItems: 'center', justifyContent: 'center', zIndex: 99 },
  backdrop: { ...ABSOLUTE_FILL },
  glow: {
    position: 'absolute',
    top: '24%',
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
  },
  sweep: {
    position: 'absolute',
    top: '22%',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
  },
  sweepDot: {
    position: 'absolute',
    top: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.85,
  },
  particles: { ...ABSOLUTE_FILL },
  particle: { position: 'absolute' },
  center: { alignItems: 'center' },
  brand: { alignItems: 'center', marginTop: 22 },
  wordmark: { fontSize: 34, fontWeight: '800', letterSpacing: -1.2 },
  tagline: { fontSize: 12.5, fontWeight: '700', letterSpacing: 2.4, marginTop: 6, textTransform: 'uppercase' },
  heartRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  heartLine: { width: 34, height: StyleSheet.hairlineWidth },
  footer: { position: 'absolute', bottom: 54, alignItems: 'center', gap: 12, width: '100%' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  footerText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  track: { width: 132, height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  fill: { height: 3, borderRadius: 2 },
});
