import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { PrimaryButton } from './PrimaryButton';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  const { colors, typography, spacing } = useDuoraTheme();
  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.error} />
      <Text style={[typography.heading, { color: colors.text, marginTop: spacing.md }]}>{title}</Text>
      <Text
        style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}
      >
        {message}
      </Text>
      {onRetry ? (
        <View style={{ alignSelf: 'stretch', marginTop: spacing.lg }}>
          <PrimaryButton label="Try again" icon="refresh" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
});
