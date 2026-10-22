import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Heart,
  LockKeyhole,
  Mail,
  ServerCog,
  UserRound,
} from 'lucide-react-native';
import { BrandWordmark } from '../src/components/BrandWordmark';
import { Btn, PressableScale, Segmented } from '../src/components/ui';
import { Field, FieldAction } from '../src/components/Field';
import { ErrorCard, StatusPill } from '../src/components/Feedback';
import { PageBackground } from '../src/components/PageBackground';
import { useDuoraTheme } from '../src/theme/ThemeProvider';
import { useToast } from '../src/components/Overlay';
import { useStore } from '../src/state/store';

 type FieldErrors = { name?: string; email?: string; password?: string };
type AuthMode = 'login' | 'register';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useDuoraTheme();
  const { toast } = useToast();
  const authStatus = useStore((s) => s.authStatus);
  const authBusy = useStore((s) => s.authBusy);
  const authError = useStore((s) => s.authError);
  const clearAuthError = useStore((s) => s.clearAuthError);
  const login = useStore((s) => s.login);
  const register = useStore((s) => s.register);
  const serverStatus = useStore((s) => s.server.status);
  const checkServer = useStore((s) => s.checkServer);

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [name, setName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (authStatus === 'authenticated') router.replace('/(tabs)');
  }, [authStatus, router]);

  useEffect(() => {
    void checkServer();
  }, [checkServer]);

  const statusLabel = useMemo(() => {
    if (serverStatus === 'online') return 'Duora server connected';
    if (serverStatus === 'connecting') return 'Connecting to Duora…';
    return 'Duora server is unavailable';
  }, [serverStatus]);

  const changeMode = useCallback(
    (next: string) => {
      setMode(next as AuthMode);
      setFieldErrors({});
      setTouched(false);
      clearAuthError();
    },
    [clearAuthError],
  );

  const validate = useCallback((): FieldErrors => {
    const errors: FieldErrors = {};
    const mail = email.trim();
    if (mode === 'register' && !name.trim()) errors.name = 'Enter your name';
    if (!mail) errors.email = 'Enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
      errors.email = 'Enter a valid email address';
    }
    if (!password) errors.password = 'Enter your password';
    else if (mode === 'register' && password.length < 8) {
      errors.password = 'Use at least 8 characters';
    }
    return errors;
  }, [email, password, name, mode]);

  const submit = async () => {
    const errors = validate();
    setFieldErrors(errors);
    setTouched(true);
    if (Object.keys(errors).length) return;

    const ok = mode === 'login'
      ? await login(email.trim(), password)
      : await register(email.trim(), password, name.trim());
    if (!ok) return;

    toast(mode === 'login' ? 'Welcome back' : 'Your account is ready', 'success');
    setPassword('');
  };

  if (authStatus === 'authenticated') return null;

  const errorFor = (key: keyof FieldErrors) => (touched ? fieldErrors[key] : undefined);

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <PageBackground />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(550)} style={styles.brandBlock}>
            <BrandWordmark size={34} />
            <Text style={[styles.tagline, { color: t.text3 }]}>Always Together</Text>
            <View style={[styles.brandHeart, { backgroundColor: t.primarySoft }]}>
              <Heart size={14} fill={t.primary} color={t.primary} />
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(550).delay(90)}
            style={[styles.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}
          >
            <View style={styles.cardHeading}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: t.text }]}>
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </Text>
                <Text style={[styles.subtitle, { color: t.text2 }]}>
                  {mode === 'login'
                    ? 'Sign in to continue to your Duora space.'
                    : 'Start building a little space for the two of you.'}
                </Text>
              </View>
              <View style={[styles.headingIcon, { backgroundColor: t.primarySoft }]}>
                <Heart size={20} fill={t.primary} color={t.primary} />
              </View>
            </View>

            <Segmented
              options={[
                { key: 'login', label: 'Login' },
                { key: 'register', label: 'Sign up' },
              ]}
              value={mode}
              onChange={changeMode}
              style={styles.segmented}
            />

            <StatusPill
              status={serverStatus}
              label={statusLabel}
              onPress={() => void checkServer()}
            />

            {authError ? (
              <ErrorCard
                error={authError}
                onRetry={() => {
                  if (authError.kind === 'conflict' && mode === 'register') {
                    changeMode('login');
                    return;
                  }
                  void submit();
                }}
                onSecondary={authError.kind === 'offline' || authError.kind === 'waking'
                  ? () => router.push('/server')
                  : undefined}
                secondaryLabel="Server settings"
              />
            ) : null}

            {mode === 'register' ? (
              <Field
                icon={UserRound}
                label="Your name"
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  if (fieldErrors.name) setFieldErrors((previous) => ({ ...previous, name: undefined }));
                }}
                error={errorFor('name')}
                editable={!authBusy}
                autoCapitalize="words"
                textContentType="name"
              />
            ) : null}

            <Field
              icon={Mail}
              label="Email address"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (fieldErrors.email) setFieldErrors((previous) => ({ ...previous, email: undefined }));
              }}
              error={errorFor('email')}
              editable={!authBusy}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />

            <Field
              icon={LockKeyhole}
              label="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (fieldErrors.password) setFieldErrors((previous) => ({ ...previous, password: undefined }));
              }}
              error={errorFor('password')}
              hint={mode === 'register' ? 'At least 8 characters' : undefined}
              editable={!authBusy}
              secureTextEntry={!reveal}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType={mode === 'register' ? 'newPassword' : 'password'}
              right={
                <FieldAction onPress={() => setReveal((value) => !value)} label={reveal ? 'Hide password' : 'Show password'}>
                  {reveal ? <EyeOff size={17} strokeWidth={2.2} color={t.text3} /> : <Eye size={17} strokeWidth={2.2} color={t.text3} />}
                </FieldAction>
              }
            />

            <Btn
              label={authBusy ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Login' : 'Create account')}
              icon={ArrowRight}
              onPress={() => void submit()}
              loading={authBusy}
              block
              style={styles.submit}
            />

            <View style={styles.switchLine}>
              <Text style={[styles.switchText, { color: t.text3 }]}>
                {mode === 'login' ? 'Don’t have an account?' : 'Already have an account?'}
              </Text>
              <PressableScale
                onPress={() => changeMode(mode === 'login' ? 'register' : 'login')}
                accessibilityLabel={mode === 'login' ? 'Create an account' : 'Sign in'}
              >
                <Text style={[styles.switchAction, { color: t.primary }]}>
                  {mode === 'login' ? 'Sign up' : 'Login'}
                </Text>
              </PressableScale>
            </View>
          </Animated.View>

          <PressableScale
            onPress={() => router.push('/server')}
            accessibilityLabel="Open server settings"
            style={styles.serverLink}
          >
            <ServerCog size={14} strokeWidth={2.2} color={t.text3} />
            <Text style={[styles.serverLinkText, { color: t.text3 }]}>
              {serverStatus === 'online' ? 'Server settings' : 'Having trouble connecting?'}
            </Text>
            <ArrowRight size={13} strokeWidth={2.2} color={t.text3} />
          </PressableScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, gap: 18 },
  brandBlock: { alignItems: 'center', paddingTop: 2, paddingBottom: 4 },
  tagline: { marginTop: 3, fontSize: 11, fontWeight: '700', letterSpacing: 2.6, textTransform: 'uppercase' },
  brandHeart: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 21,
    shadowColor: '#9d345c',
    shadowOpacity: 0.1,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
  },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 17 },
  title: { fontSize: 23, lineHeight: 28, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { fontSize: 13, lineHeight: 19, fontWeight: '500', marginTop: 5 },
  headingIcon: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  segmented: { marginBottom: 16 },
  submit: { marginTop: 4, minHeight: 56, borderRadius: 18 },
  switchLine: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 17 },
  switchText: { fontSize: 12.5, fontWeight: '600' },
  switchAction: { fontSize: 13, fontWeight: '800' },
  serverLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 6 },
  serverLinkText: { fontSize: 11.5, fontWeight: '600' },
});
