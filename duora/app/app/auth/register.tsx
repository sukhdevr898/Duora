import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { DuoraLogo } from '../../src/components/DuoraLogo';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { ErrorState } from '../../src/components/ErrorState';
import { useAuthStore } from '../../src/state/auth.store';
import { register as registerApi } from '../../src/features/auth/auth.api';
import { activateSession } from '../../src/hooks/useBootstrap';
import { registerForm } from '../../src/utils/validation';
import { ApiClientError } from '../../src/types/api';
import { spacing } from '../../src/theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    setFormError(null);
    const parsed = registerForm.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0]] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await registerApi(parsed.data);
      setSession(result.user, result.tokens);
      await activateSession();
      router.replace('/(tabs)/home');
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'Unable to create account. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen showOfflineBanner={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <DuoraLogo size={56} />
          <View style={{ marginTop: spacing.xl }}>
            <TextField
              label="Display name"
              value={form.displayName}
              onChangeText={set('displayName')}
              error={errors.displayName}
              placeholder="What should your partner call you?"
            />
            <TextField
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={form.email}
              onChangeText={set('email')}
              error={errors.email}
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              secure
              autoComplete="password-new"
              value={form.password}
              onChangeText={set('password')}
              error={errors.password}
              hint="At least 8 characters"
              placeholder="Create a strong password"
            />
          </View>

          {formError ? <ErrorState title="Registration failed" message={formError} /> : null}

          <PrimaryButton label="Create account" icon="person-add" loading={submitting} onPress={() => void onSubmit()} />
          <PrimaryButton label="Back to sign in" variant="ghost" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({ scroll: { flexGrow: 1, paddingTop: 16, paddingBottom: 32 } });
