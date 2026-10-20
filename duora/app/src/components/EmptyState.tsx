import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'sparkles-outline', title, description, action }: EmptyStateProps) {
  const { colors, typography, spacing, radii } = useDuoraTheme();
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.elevated, borderRadius: radii.xl, padding: spacing.xl },
        ]}
      >
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={[typography.heading, { color: colors.text, marginTop: spacing.lg, textAlign: 'center' }]}>
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
          ]}
        >
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  iconWrap: { justifyContent: 'center', alignItems: 'center' },
});
