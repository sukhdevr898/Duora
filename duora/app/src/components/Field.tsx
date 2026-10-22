/**
 * A text field with a floating label — the Android-native feel: the label
 * sits inside the box and lifts out of it as soon as you type.
 */
import { memo, useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import type { LucideIcon } from 'lucide-react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';

export const Field = memo(function Field({
  label,
  value,
  onChangeText,
  error,
  hint,
  right,
  icon: Icon,
  style,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  hint?: string;
  right?: ReactNode;
  /** A small icon that sits inside the box, like on a native app. */
  icon?: LucideIcon;
  style?: TextInputProps['style'];
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'style'>) {
  const { t } = useDuoraTheme();
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;
  const borderColor = error ? t.danger : focused ? t.primary : t.line;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.box,
          { backgroundColor: t.fieldBg, borderColor },
        ]}
      >
        {Icon ? (
          <Icon
            size={17}
            strokeWidth={2.2}
            color={error ? t.danger : focused ? t.primary : t.text3}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={lifted ? '' : label}
          placeholderTextColor={t.text3}
          style={[styles.input, { color: t.text }, style]}
          accessibilityLabel={label}
          {...rest}
        />
        {right}
      </View>

      {/* the label floats above the box once there is content */}
      {lifted ? (
        <Animated.Text
          style={[
            styles.floating,
            { color: error ? t.danger : focused ? t.primary : t.text3 },
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
      ) : null}

      {error ? (
        <Text style={[styles.error, { color: t.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: t.text3 }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

/** The little round button inside a field (show / hide password). */
export const FieldAction = memo(function FieldAction({
  onPress,
  children,
  label,
}: {
  onPress: () => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={styles.action} hitSlop={8}>
      {children}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  box: {
    height: 56,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: { marginTop: 2 },
  input: { flex: 1, fontSize: 15, fontWeight: '600', padding: 0 },
  floating: {
    position: 'absolute',
    top: -7,
    left: 14,
    paddingHorizontal: 6,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    backgroundColor: 'transparent',
  },
  error: { fontSize: 11.5, fontWeight: '600', marginTop: 6, marginLeft: 4 },
  hint: { fontSize: 11, fontWeight: '500', marginTop: 6, marginLeft: 4 },
  action: { padding: 6 },
});
