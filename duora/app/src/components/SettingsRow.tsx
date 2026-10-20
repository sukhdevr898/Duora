import { Pressable, StyleSheet, Switch, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { touchTarget } from '../theme/tokens';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: { value: boolean; onChange: (next: boolean) => void };
  danger?: boolean;
  style?: ViewStyle;
}

export function SettingsRow({ icon, label, value, onPress, toggle, danger = false, style }: SettingsRowProps) {
  const { colors, spacing, typography } = useDuoraTheme();
  const interactive = Boolean(onPress || toggle);

  const content = (
    <View style={[styles.row, { paddingVertical: spacing.md, borderBottomColor: colors.border }, style]}>
      <Ionicons name={icon} size={20} color={danger ? colors.error : colors.primary} style={{ marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: danger ? colors.error : colors.text }]}>{label}</Text>
      </View>
      {toggle ? (
        <Switch
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ true: colors.primary, false: colors.elevated }}
          thumbColor={colors.text}
          accessibilityLabel={label}
        />
      ) : (
        <View style={styles.trailing}>
          {value ? (
            <Text numberOfLines={1} style={[typography.caption, { color: colors.textSecondary, maxWidth: 150 }]}>
              {value}
            </Text>
          ) : null}
          {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} /> : null}
        </View>
      )}
    </View>
  );

  if (!interactive) return content;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
