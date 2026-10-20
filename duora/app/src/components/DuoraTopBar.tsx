import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { DuoraOverflowMenu } from './DuoraOverflowMenu';
import { IconButton } from './IconButton';

interface DuoraTopBarProps {
  title?: string;
  branding?: boolean;
  showBack?: boolean;
  showMenu?: boolean;
  right?: ReactNode;
}

export function DuoraTopBar({ title, branding = false, showBack = false, showMenu = false, right }: DuoraTopBarProps) {
  const { colors, spacing, typography } = useDuoraTheme();
  const router = useRouter();

  return (
    <View style={[styles.bar, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
      <View style={styles.side}>
        {showBack ? <IconButton name="chevron-back" label="Go back" onPress={() => router.back()} /> : null}
      </View>
      <View style={styles.center}>
        {branding ? (
          <Text style={[typography.title, { color: colors.primary }]}>Duora</Text>
        ) : (
          <Text numberOfLines={1} style={[typography.heading, { color: colors.text }]}>
            {title}
          </Text>
        )}
      </View>
      <View style={[styles.side, styles.right]}>
        {right}
        {showMenu ? <DuoraOverflowMenu /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  side: { minWidth: 48, flexDirection: 'row', alignItems: 'center' },
  center: { flex: 1, alignItems: 'center' },
  right: { justifyContent: 'flex-end' },
});
