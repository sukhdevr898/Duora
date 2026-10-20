import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  const { colors, typography, spacing } = useDuoraTheme();
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
});
