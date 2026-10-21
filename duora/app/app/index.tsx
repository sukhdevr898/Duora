import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ArrowRight, Heart } from 'lucide-react-native';
import { HeartOrb, WelcomeWaves } from '../src/components/Brand';
import { LogoLockup } from '../src/components/BrandWordmark';
import { Btn, PressableScale } from '../src/components/ui';
import { Sheet } from '../src/components/Overlay';
import { useDuoraTheme } from '../src/theme/ThemeProvider';
import { fonts } from '../src/theme/fonts';
import { ABSOLUTE_FILL } from '../src/theme/tokens';
import { useStore } from '../src/state/store';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, mode } = useDuoraTheme();
  const authStatus = useStore((s) => s.authStatus);
  const authBusy = useStore((s) => s.authBusy);
  const authError = useStore((s) => s.authError);
  const login = useStore((s) => s.login);
  const register = useStore((s) => s.register);

  const [authOpen, setAuthOpen] = useState(false);
  const [mode_, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('sukhdev@duora.app');
  const [password, setPassword] = useState('love1234');
  const [name, setName] = useState('');

  const dark = mode === 'dark';

  useEffect(() => {
    if (authStatus === 'authenticated') router.replace('/(tabs)');
  }, [authStatus, router]);

  const submit = async () => {
    const ok =
      mode_ === 'login'
        ? await login(email.trim(), password)
        : await register(email.trim(), password, name.trim() || 'Duora');
    if (ok) setAuthOpen(false);
  };

  if (authStatus === 'authenticated') return null;

  return (
    <View style={styles.root}>
      {/* background */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="welcomeBg" x1="0" y1="0" x2="0.3" y2="1">
            <Stop offset="0%" stopColor={dark ? '#1a1233' : '#f6f0ff'} />
            <Stop offset="42%" stopColor={dark ? '#221641' : '#ece0ff'} />
            <Stop offset="74%" stopColor={dark ? '#2d1b52' : '#dcc8ff'} />
            <Stop offset="100%" stopColor={dark ? '#3a1f58' : '#e3c8f7'} />
          </LinearGradient>
          <RadialGradient id="welcomePink" cx="0.88" cy="1" rx="0.7" ry="0.46">
            <Stop offset="0%" stopColor={dark ? '#7a3a8c' : '#f79bc4'} stopOpacity={dark ? 0.55 : 0.55} />
            <Stop offset="62%" stopColor={dark ? '#7a3a8c' : '#f79bc4'} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="welcomeViolet" cx="0" cy="0.96" rx="0.8" ry="0.52">
            <Stop offset="0%" stopColor={dark ? '#5332aa' : '#a076ff'} stopOpacity={dark ? 0.6 : 0.55} />
            <Stop offset="64%" stopColor={dark ? '#5332aa' : '#a076ff'} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="cloudFill" cx="0.4" cy="0.4" rx="0.6" ry="0.6">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <Stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#welcomeBg)" />
        <Rect width="100%" height="100%" fill="url(#welcomePink)" />
        <Rect width="100%" height="100%" fill="url(#welcomeViolet)" />

        {/* clouds */}
        <Ellipse cx="41" cy="110" rx="95" ry="65" fill="url(#cloudFill)" opacity={dark ? 0.18 : 0.75} />
        <Ellipse cx="345" cy="177" rx="75" ry="50" fill="url(#cloudFill)" opacity={dark ? 0.18 : 0.6} />
        <Ellipse cx="255" cy="50" rx="115" ry="75" fill="url(#cloudFill)" opacity={dark ? 0.18 : 0.35} />
      </Svg>

      {/* lockup */}
      <Animated.View entering={FadeIn.duration(800)} style={styles.content}>
        <LogoLockup size={46} />
      </Animated.View>

      <Animated.View
        entering={FadeIn.duration(700).delay(250)}
        style={[styles.floatingHeart, { right: '16%', top: '30%' }]}
      >
        <HeartOrb size={54} tone="pink" />
      </Animated.View>
      <Animated.View
        entering={FadeIn.duration(700).delay(400)}
        style={[styles.floatingHeart, { left: '13%', top: '47%' }]}
      >
        <HeartOrb size={34} tone="violet" />
      </Animated.View>

      <WelcomeWaves />

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 26 }]}>
        <Animated.View entering={FadeInDown.duration(700).delay(450)}>
          <Text style={[styles.script, { color: dark ? '#d9c8ff' : '#5e3ac9' }]}>
            Closer
            {'\n'}
            Every Day
          </Text>
          <View style={styles.scriptHeart}>
            <Heart size={14} fill={dark ? '#bda6ff' : '#6b45d8'} color={dark ? '#bda6ff' : '#6b45d8'} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(700).delay(600)} style={styles.actions}>
          <PressableScale onPress={() => setAuthOpen(true)} accessibilityLabel="Enter my space">
            <Svg width="100%" height={54} style={styles.cta}>
              <Defs>
                <LinearGradient id="ctaGrad" x1="0" y1="0" x2="0.35" y2="1">
                  <Stop offset="0%" stopColor={dark ? '#2a2150' : '#fdfbff'} />
                  <Stop offset="100%" stopColor={dark ? '#241b45' : '#f4ebff'} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="54" rx="27" fill="url(#ctaGrad)" />
            </Svg>
            <View style={styles.ctaInner}>
              <Text style={[styles.ctaText, { color: dark ? '#e9e2ff' : '#4a2bd0' }]}>Enter my space</Text>
              <ArrowRight size={18} strokeWidth={2.6} color={dark ? '#e9e2ff' : '#4a2bd0'} />
            </View>
          </PressableScale>
          <Text style={[styles.ghost, { color: dark ? '#a99ed0' : '#5d4a86' }]}>
            Private · just the two of you
          </Text>
        </Animated.View>
      </View>

      <Sheet
        visible={authOpen}
        onClose={() => setAuthOpen(false)}
        title={mode_ === 'login' ? 'Welcome back' : 'Create your space'}
        subtitle="Your account keeps the two of you connected."
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {mode_ === 'register' ? (
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={t.text3}
                style={[styles.input, { backgroundColor: t.fieldBg, color: t.text, borderColor: t.line }]}
                accessibilityLabel="Your name"
              />
            ) : null}

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={t.text3}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { backgroundColor: t.fieldBg, color: t.text, borderColor: t.line }]}
              accessibilityLabel="Email"
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={t.text3}
              secureTextEntry
              style={[styles.input, { backgroundColor: t.fieldBg, color: t.text, borderColor: t.line }]}
              accessibilityLabel="Password"
            />

            {authError ? (
              <Text style={[styles.error, { color: t.danger }]}>{authError}</Text>
            ) : null}

            <Btn
              label={mode_ === 'login' ? 'Sign in' : 'Create account'}
              onPress={() => void submit()}
              disabled={authBusy}
              block
            />

            <PressableScale
              onPress={() => setMode(mode_ === 'login' ? 'register' : 'login')}
              accessibilityLabel="Switch mode"
            >
              <Text style={[styles.switch, { color: t.text2 }]}>
                {mode_ === 'login' ? 'New here? Create an account' : 'Already have a space? Sign in'}
              </Text>
            </PressableScale>

            <Text style={[styles.hint, { color: t.text3 }]}>
              Demo account · sukhdev@duora.app / love1234
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f6f0ff', overflow: 'hidden' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 18,
  },
  floatingHeart: { position: 'absolute', zIndex: 2 },
  bottom: {
    paddingHorizontal: 30,
    paddingTop: 18,
    zIndex: 3,
    alignItems: 'center',
    gap: 18,
  },
  script: {
    fontFamily: fonts.script,
    fontSize: 36,
    lineHeight: 38,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 24,
  },
  scriptHeart: { alignItems: 'center', marginTop: 2 },
  actions: { width: '100%', maxWidth: 320, gap: 10 },
  cta: { shadowColor: '#4c28a8', shadowOpacity: 0.22, shadowRadius: 34, shadowOffset: { width: 0, height: 18 }, elevation: 8 },
  ctaInner: {
    ...ABSOLUTE_FILL,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaText: { fontSize: 15.5, fontWeight: '700' },
  ghost: { textAlign: 'center', fontSize: 13, fontWeight: '700', padding: 8 },
  input: {
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  error: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  switch: { textAlign: 'center', fontSize: 13, fontWeight: '600', marginTop: 14 },
  hint: { textAlign: 'center', fontSize: 12, marginTop: 10 },
});
