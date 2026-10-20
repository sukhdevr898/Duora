import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { touchTarget } from '../theme/tokens';

interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export function IconButton({ name, onPress, label, size = 24, color, style, disabled }: IconButtonProps) {
  const { colors } = useDuoraTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.button,
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color ?? colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minWidth: touchTarget, minHeight: touchTarget, justifyContent: 'center', alignItems: 'center' },
});
