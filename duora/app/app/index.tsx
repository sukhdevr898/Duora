import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ArrowRight, Eye, EyeOff, Heart, ServerCog } from 'lucide-react-native';
import { HeartOrb, WelcomeWaves } from '../src/components/Brand';
import { LogoLockup } from '../src/components/BrandWordmark';
import { Btn, PressableScale } from '../src/components/ui';
import { Sheet } from '../src/components/Overlay';
import { ErrorCard, InlineNote, StatusPill } from '../src/components/Feedback';
import { useDuoraTheme } from '../src/theme/ThemeProvider';
import { fonts } from '../src/theme/fonts';
import { ABSOLUTE_FILL } from '../src/theme/tokens';
import { useStore } from '../src/state/store';

const DEMO_EMAIL = 'sukhdev@duora.app';
const DEMO_PASSWORD = 'love1234';

type FieldErrors = { name?: string; email?: string; password?: string };

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, mode } = useDuoraTheme();
  const authStatus = useStore((s) => s.authStatus);
  const authBusy = useStore((s) => s.authBusy);
  const authError = useStore((s) => s.authError);
  const clearAuthError = useStore((s) => s.clearAuthError);
  const login = useStore((s) => s.login);
  const register = useStore((s) => s.register);
  const serverStatus = useStore((s) => s.server.status);
  const serverUrl = useStore((s) => s.serverUrl);
  const checkServer = useStore((s) => s.checkServer);

  const [authOpen, setAuthOpen] = useState(false);
  const [mode_, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [reveal, setReveal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);

  const dark = mode === 'dark';

  useEffect(() => {
    if (authStatus === 'authenticated') router.replace('/(tabs)');
  }, [authStatus, router]);

  // Know straight away whether the Duora server is answering — a broken
  // deployment is the number one reason signing in does not work.
  useEffect(() => {
    void checkServer();
  }, [checkServer]);

  const endpoint = serverUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  const statusLabel = useMemo(() => {
    if (serverStatus === 'online') return `Connected · ${endpoint}`;
    if (serverStatus === 'connecting') return 'Waking the server…';
    return `Cannot reach ${endpoint}`;
  }, [serverStatus, endpoint]);

  const openAuth = useCallback(
    (next: 'login' | 'register') => {
      setMode(next);
      setFieldErrors({});
      setTouched(false);
      clearAuthError();
      setAuthOpen(true);
    },
    [clearAuthError],
  );

  const validate = useCallback((): FieldErrors => {
    const errors: FieldErrors = {};
    const mail = email.trim();
    if (!mail) errors.email = 'Enter your email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) errors.email = 'That email does not look right';
    if (!password) errors.password = 'Enter your password';
    else if (mode_ === 'register' && password.length < 8)
      errors.password = 'Use at least 8 characters';
    if (mode_ === 'register' && !name.trim()) errors.name = 'Tell us your name';
    return errors;
  }, [email, password, name, mode_]);

  const submit = async () => {
    const errors = validate();
    setFieldErrors(errors);
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    const ok =
      mode_ === 'login'
        ? await login(email.trim(), password)
        : await register(email.trim(), password, name.trim());
    if (ok) {
      setAuthOpen(false);
      setPassword('');
    }
  };

  const useDemo = () => {
    setMode('login');
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setFieldErrors({});
    clearAuthError();
  };

  if (authStatus === 'authenticated') return null;

  const showFieldError = (key: keyof FieldErrors) =>
    touched ? fieldErrors[key] : undefined;

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
        {serverStatus === 'offline' ? (
          <PressableScale onPress={() => void checkServer()} accessibilityLabel="Reconnect to the server">
            <View style={[styles.offline, { backgroundColor: `${t.danger}1f`, borderColor: `${t.danger}45` }]}>
              <Text style={[styles.offlineText, { color: t.text2 }]}>
                The Duora server is not answering. Tap to try again.
              </Text>
            </View>
          </PressableScale>
        ) : null}

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
          <PressableScale onPress={() => openAuth('login')} accessibilityLabel="Enter my space">
            <Svg width="100%" height={54} style={styles.cta}>
              <Defs>
                <LinearGradient id="ctaGrad" x1="0" y1="0" x2="0.35" y2="1">
                  <Stop offset="0%" stopColor={dark ? '#2a2150' : '#fdfbff'} />
                  <Stop offset="100%" stopColor={dark ? '#241b45' : '#f4ebff'} />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height={54} rx={27} fill="url(#ctaGrad)" />
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
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.statusRow}>
              <StatusPill
                status={serverStatus}
                label={statusLabel}
                onPress={() => void checkServer()}
              />
            </View>

            {authError ? (
              <ErrorCard
                error={authError}
                onRetry={() => {
                  // "Already taken" is not worth retrying — offer the sign in.
                  if (authError.kind === 'conflict') {
                    setMode('login');
                    setFieldErrors({});
                    clearAuthError();
                    return;
                  }
                  void submit();
                }}
                onSecondary={
                  authError.kind === 'offline' || authError.kind === 'waking'
                    ? () => {
                        setAuthOpen(false);
                        router.push('/server');
                      }
                    : undefined
                }
                secondaryLabel="Change server"
              />
            ) : null}

            {mode_ === 'register' ? (
              <View style={styles.field}>
                <TextInput
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="Your name"
                  placeholderTextColor={t.text3}
                  autoCapitalize="words"
                  editable={!authBusy}
                  style={[
                    styles.input,
                    {
                      backgroundColor: t.fieldBg,
                      color: t.text,
                      borderColor: showFieldError('name') ? t.danger : t.line,
                    },
                  ]}
                  accessibilityLabel="Your name"
                />
                {showFieldError('name') ? (
                  <Text style={[styles.fieldError, { color: t.danger }]}>{fieldErrors.name}</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.field}>
              <TextInput
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="Email"
                placeholderTextColor={t.text3}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!authBusy}
                style={[
                  styles.input,
                  {
                    backgroundColor: t.fieldBg,
                    color: t.text,
                    borderColor: showFieldError('email') ? t.danger : t.line,
                  },
                ]}
                accessibilityLabel="Email"
              />
              {showFieldError('email') ? (
                <Text style={[styles.fieldError, { color: t.danger }]}>{fieldErrors.email}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <View
                style={[
                  styles.passwordWrap,
                  {
                    backgroundColor: t.fieldBg,
                    borderColor: showFieldError('password') ? t.danger : t.line,
                  },
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  placeholder="Password"
                  placeholderTextColor={t.text3}
                  secureTextEntry={!reveal}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!authBusy}
                  style={[styles.input, styles.passwordInput, { color: t.text }]}
                  accessibilityLabel="Password"
                />
                <PressableScale
                  onPress={() => setReveal((v) => !v)}
                  accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
                  style={styles.reveal}
                >
                  {reveal ? (
                    <EyeOff size={17} strokeWidth={2.2} color={t.text3} />
                  ) : (
                    <Eye size={17} strokeWidth={2.2} color={t.text3} />
                  )}
                </PressableScale>
              </View>
              {showFieldError('password') ? (
                <Text style={[styles.fieldError, { color: t.danger }]}>{fieldErrors.password}</Text>
              ) : null}
            </View>

            <Btn
              label={
                authBusy
                  ? mode_ === 'login'
                    ? 'Signing in…'
                    : 'Creating your space…'
                  : mode_ === 'login'
                    ? 'Sign in'
                    : 'Create account'
              }
              onPress={() => void submit()}
              loading={authBusy}
              block
            />

            <PressableScale
              onPress={() => openAuth(mode_ === 'login' ? 'register' : 'login')}
              accessibilityLabel="Switch mode"
            >
              <Text style={[styles.switch, { color: t.text2 }]}>
                {mode_ === 'login' ? 'New here? Create an account' : 'Already have a space? Sign in'}
              </Text>
            </PressableScale>

            <InlineNote
              text={`Demo account · ${DEMO_EMAIL} / ${DEMO_PASSWORD}`}
              actionLabel="Use it"
              onAction={useDemo}
            />

            <PressableScale
              onPress={() => {
                setAuthOpen(false);
                router.push('/server');
              }}
              accessibilityLabel="Change the server address"
              style={styles.serverLink}
            >
              <ServerCog size={14} strokeWidth={2.3} color={t.text3} />
              <Text style={[styles.serverLinkText, { color: t.text3 }]}>
                {serverStatus === 'online' ? 'Server settings' : 'Cannot reach the server — fix it'}
              </Text>
            </PressableScale>
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
  offline: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 320,
  },
  offlineText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  statusRow: { flexDirection: 'row', marginBottom: 14 },
  field: { marginBottom: 10 },
  input: {
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: StyleSheet.hairlineWidth,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingRight: 6,
  },
  passwordInput: { flex: 1, borderWidth: 0, backgroundColor: 'transparent' },
  reveal: { padding: 10 },
  fieldError: { fontSize: 11.5, fontWeight: '600', marginTop: 5, marginLeft: 4 },
  switch: { textAlign: 'center', fontSize: 13, fontWeight: '600', marginTop: 14 },
  serverLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 6,
  },
  serverLinkText: { fontSize: 12, fontWeight: '600' },
});
