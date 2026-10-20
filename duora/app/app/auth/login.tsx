import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { DuoraLogo } from '../../src/components/DuoraLogo';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { ErrorState } from '../../src/components/ErrorState';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useAuthStore } from '../../src/state/auth.store';
import { login as loginApi } from '../../src/features/auth/auth.api';
import { activateSession } from '../../src/hooks/useBootstrap';
import { loginForm } from '../../src/utils/validation';
import { ApiClientError } from '../../src/types/api';
import { spacing } from '../../src/theme/tokens';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, typography } = useDuoraTheme();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async () => {
    setFormError(null);
    const parsed = loginForm.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0]] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await loginApi(parsed.data);
      setSession(result.user, result.tokens);
      await activateSession();
      router.replace('/(tabs)/home');
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Unable to sign in. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen showOfflineBanner={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <DuoraLogo size={64} tagline />
          <Text style={[typography.title, { color: colors.text, marginTop: spacing.xxxl, marginBottom: spacing.lg }]}>
            Welcome back
          </Text>

          {formError ? <ErrorState title="Sign in failed" message={formError} /> : null}

          <TextField
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            secure
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            placeholder="Your password"
            onSubmitEditing={onSubmit}
          />

          <View style={{ marginTop: spacing.lg }}>
            <PrimaryButton label="Sign in" icon="log-in" loading={submitting} onPress={() => void onSubmit()} />
          </View>

          <View style={styles.links}>
            <Text
              accessibilityRole="link"
              style={[typography.body, { color: colors.primary }]}
              onPress={() => router.push('/auth/reset')}
            >
              Forgot password?
            </Text>
            <Text
              accessibilityRole="link"
              style={[typography.body, { color: colors.primary }]}
              onPress={() => router.push('/auth/register')}
            >
              Create account
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingTop: 24, paddingBottom: 32 },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl },
});
