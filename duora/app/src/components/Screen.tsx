import type { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { OfflineBanner } from './OfflineBanner';

interface ScreenProps {
  children: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  showOfflineBanner?: boolean;
}

export function Screen({ children, style, contentStyle, showOfflineBanner = true }: ScreenProps) {
  const { colors, spacing } = useDuoraTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }, style]}>
      {showOfflineBanner ? <OfflineBanner /> : null}
      <View style={[styles.content, { padding: spacing.lg }, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1 },
});
