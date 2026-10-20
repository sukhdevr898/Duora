import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { spacing, touchTarget } from '../theme/tokens';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  secure?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, secure = false, style, ...rest },
  ref,
) {
  const { colors, radii, typography } = useDuoraTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);

  return (
    <View style={styles.wrap}>
      <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.xs }]}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          {
            borderColor: error ? colors.error : focused ? colors.primary : colors.border,
            backgroundColor: colors.surface,
            borderRadius: radii.md,
          },
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[typography.body, styles.input, { color: colors.text }, style]}
          {...rest}
        />
        {secure ? (
          <Text
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((v) => !v)}
            style={[typography.caption, { color: colors.primary, paddingHorizontal: spacing.sm }]}
          >
            {hidden ? 'Show' : 'Hide'}
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text style={[typography.caption, { color: colors.error, marginTop: spacing.xs }]}>{error}</Text>
      ) : hint ? (
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, minHeight: touchTarget },
  input: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
