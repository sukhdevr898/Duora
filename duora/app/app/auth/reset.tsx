import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { DuoraTopBar } from '../../src/components/DuoraTopBar';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { http } from '../../src/services/httpClient';
import { emailSchema } from '../../src/utils/validation';
import { ApiClientError } from '../../src/types/api';
import { spacing } from '../../src/theme/tokens';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors, typography } = useDuoraTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid email');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      // Generic 202 whether or not the account exists (no account enumeration).
      await http.post('/auth/reset-password', { email: parsed.data }, { auth: false });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Request failed. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen showOfflineBanner={false}>
      <DuoraTopBar showBack title="Reset password" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {sent ? (
          <View style={{ marginTop: spacing.xxxl }}>
            <Text style={[typography.heading, { color: colors.text }]}>Check your inbox</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
              If an account exists for {email}, a password reset link is on its way. The link expires shortly.
            </Text>
            <View style={{ marginTop: spacing.xl }}>
              <PrimaryButton label="Back to sign in" onPress={() => router.replace('/auth/login')} />
            </View>
          </View>
        ) : (
          <>
            <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
              Enter your account email and we’ll send reset instructions.
            </Text>
            <TextField
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={error ?? undefined}
              placeholder="you@example.com"
            />
            <PrimaryButton label="Send reset link" icon="mail" loading={submitting} onPress={() => void onSubmit()} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({ scroll: { flexGrow: 1, paddingTop: spacing.lg } });
