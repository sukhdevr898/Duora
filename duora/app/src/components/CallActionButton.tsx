import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { touchTarget } from '../theme/tokens';

interface CallActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export function CallActionButton({
  icon,
  label,
  active = false,
  destructive = false,
  disabled = false,
  onPress,
}: CallActionButtonProps) {
  const { colors, typography } = useDuoraTheme();
  const background = destructive
    ? colors.error
    : active
      ? colors.primary
      : colors.elevated;
  const foreground = active ? '#1A1330' : destructive ? '#1F0B12' : colors.text;

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.circle,
          { backgroundColor: background, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        ]}
      >
        <Ionicons name={icon} size={26} color={foreground} />
      </Pressable>
      <Text style={[typography.caption, styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 76 },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget,
  },
  label: { marginTop: 8, textAlign: 'center' },
});
