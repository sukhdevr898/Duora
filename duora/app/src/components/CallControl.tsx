import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { PressableScale } from './ui';

/** Native-style call control with an explicit disabled state for unimplemented media. */
export const CallControl = memo(function CallControl({
  icon: Icon,
  label,
  onPress,
  disabled = false,
  active = false,
}: {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const { t } = useDuoraTheme();
  const unavailable = disabled || !onPress;
  const accessibilityLabel = unavailable
    ? `${label}, unavailable in this build`
    : label;

  return (
    <PressableScale
      onPress={onPress}
      disabled={unavailable}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: unavailable }}
      style={[styles.control, unavailable && styles.unavailable]}
    >
      <View
        style={[
          styles.circle,
          { backgroundColor: active ? t.primary : t.card },
          !active && { borderColor: t.cardBorder },
        ]}
      >
        <Icon size={20} strokeWidth={2.15} color={active ? '#fff' : unavailable ? t.text3 : t.text2} />
      </View>
      <Text style={[styles.label, { color: unavailable ? t.text3 : t.text2 }]} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  control: { minWidth: 70, alignItems: 'center', justifyContent: 'center', gap: 6 },
  unavailable: { opacity: 0.54 },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { maxWidth: 82, fontSize: 9.5, lineHeight: 12, fontWeight: '700', textAlign: 'center' },
});
