import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { touchTarget } from '../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface PrimaryButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
}

export function PrimaryButton({
  label,
  variant = 'primary',
  loading = false,
  icon,
  fullWidth = true,
  disabled,
  ...rest
}: PrimaryButtonProps) {
  const { colors, mode, radii, spacing, typography } = useDuoraTheme();

  const palette = {
    primary: { bg: colors.primary, fg: mode === 'dark' ? '#1A1330' : '#FFFFFF' },
    secondary: { bg: colors.secondary, fg: mode === 'dark' ? '#2A1220' : '#FFFFFF' },
    ghost: { bg: 'transparent', fg: colors.primary },
    danger: { bg: colors.error, fg: '#1F0B12' },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: loading }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderRadius: radii.lg,
          borderColor: variant === 'ghost' ? colors.border : 'transparent',
          borderWidth: variant === 'ghost' ? 1 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: spacing.xl,
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={palette.fg} style={styles.icon} /> : null}
          <Text style={[typography.button, { color: palette.fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: touchTarget, justifyContent: 'center', alignItems: 'center', marginVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 8 },
});
