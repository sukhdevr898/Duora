import { StyleSheet, View } from 'react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';

export function PresenceIndicator({ online }: { online: boolean }) {
  const { colors } = useDuoraTheme();
  return (
    <View
      accessibilityLabel={online ? 'Online' : 'Offline'}
      style={[
        styles.dot,
        {
          backgroundColor: online ? colors.success : colors.textSecondary,
          borderColor: colors.surface,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
});
