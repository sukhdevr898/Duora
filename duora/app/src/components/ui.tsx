import { memo, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { LucideIcon } from 'lucide-react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { ABSOLUTE_FILL, radii } from '../theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* ------------------------------------------------------------------ */
/* Pressable with spring feedback (`.press`)                           */
/* ------------------------------------------------------------------ */
export const PressableScale = memo(function PressableScale({
  children,
  onPress,
  style,
  disabled,
  accessibilityLabel,
  accessibilityState,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityState?: { disabled?: boolean; busy?: boolean; checked?: boolean };
}) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      onPressIn={() => {
        scale.value = withSpring(0.955, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 320 });
      }}
      style={[animated, style]}
    >
      {children}
    </AnimatedPressable>
  );
});

/* ------------------------------------------------------------------ */
/* Buttons (.btn)                                                     */
/* ------------------------------------------------------------------ */
type BtnVariant = 'primary' | 'soft' | 'ghost' | 'outline';

/**
 * A soft light band that travels across the button while it is busy - the
 * same "something is happening" cue every native app uses.
 */
function LoadingShimmer({ width }: { width: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1250, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { skewX: '-18deg' },
      { translateX: -170 + progress.value * (width + 340) },
    ],
  }));

  return <Animated.View pointerEvents="none" style={[styles.shimmer, style]} />;
}

export const Btn = memo(function Btn({
  label,
  onPress,
  icon: Icon,
  variant = 'primary',
  block = true,
  disabled,
  loading,
  style,
  textStyle,
}: {
  label: string;
  onPress?: () => void;
  icon?: LucideIcon;
  variant?: BtnVariant;
  block?: boolean;
  disabled?: boolean;
  /** Shows a spinner and blocks further presses. */
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const { t, shadow } = useDuoraTheme();
  const blocked = Boolean(disabled || loading);
  const [width, setWidth] = useState(0);

  const content = (
    <View style={styles.btnRow}>
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#fff' : t.primaryDeep} />
      ) : Icon ? (
        <Icon size={18} strokeWidth={2.6} color={variant === 'primary' ? '#fff' : t.primaryDeep} />
      ) : null}
      <Text
        numberOfLines={1}
        style={[
          styles.btnLabel,
          { color: variant === 'primary' ? '#fff' : t.primaryDeep },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );

  const body =
    variant === 'primary' ? (
      <LinearGradient
        colors={[t.primary2, t.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[styles.btn, block && styles.block, shadow('primary'), style]}
      >
        {content}
        {loading && width > 0 ? <LoadingShimmer width={width} /> : null}
      </LinearGradient>
    ) : (
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[
          styles.btn,
          block && styles.block,
          variant === 'soft' && {
            backgroundColor: t.card,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.cardBorder,
          },
          variant === 'outline' && {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: t.lineStrong,
          },
          variant === 'ghost' && { backgroundColor: 'transparent' },
          style,
        ]}
      >
        {content}
        {loading && width > 0 ? <LoadingShimmer width={width} /> : null}
      </View>
    );

  return (
    <PressableScale
      onPress={onPress}
      disabled={blocked}
      accessibilityState={{ disabled: blocked, busy: Boolean(loading) }}
      style={block ? { width: '100%' } : undefined}
    >
      <View style={disabled && !loading ? { opacity: 0.55 } : undefined}>{body}</View>
    </PressableScale>
  );
});

/* ------------------------------------------------------------------ */
/* Icon button (.icon-btn)                                            */
/* ------------------------------------------------------------------ */
export const IconButton = memo(function IconButton({
  icon: Icon,
  onPress,
  variant = 'ghost',
  size = 38,
  accessibilityLabel,
  color,
}: {
  icon: LucideIcon;
  onPress?: () => void;
  variant?: 'ghost' | 'soft';
  size?: number;
  accessibilityLabel?: string;
  color?: string;
}) {
  const { t } = useDuoraTheme();
  return (
    <PressableScale onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <View
        style={[
          styles.iconBtn,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: variant === 'soft' ? t.primarySoft : 'transparent',
          },
        ]}
      >
        <Icon size={size * 0.5} strokeWidth={2.3} color={color ?? (variant === 'soft' ? t.primary : t.text)} />
      </View>
    </PressableScale>
  );
});

/* ------------------------------------------------------------------ */
/* Chip (.chip)                                                       */
/* ------------------------------------------------------------------ */
export const Chip = memo(function Chip({
  label,
  active,
  onPress,
  icon: Icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
}) {
  const { t, shadow } = useDuoraTheme();
  const inner = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: active ? t.primary : t.chipBg,
          borderColor: active ? 'transparent' : t.line,
          ...(active ? shadow('sm') : null),
        },
      ]}
    >
      {Icon ? (
        <Icon size={13} strokeWidth={2.4} color={active ? '#fff' : t.text2} />
      ) : null}
      <Text style={[styles.chipText, { color: active ? '#fff' : t.text2 }]}>{label}</Text>
    </View>
  );
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label}>
      {inner}
    </PressableScale>
  );
});


/* ------------------------------------------------------------------ */
/* Segmented control (.segmented)                                     */
/* ------------------------------------------------------------------ */

export const Segmented = memo(function Segmented({
  options,
  value,
  onChange,
  style,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { t, shadow } = useDuoraTheme();

  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: t.fieldBg, borderColor: t.line },
        style,
      ]}
      accessibilityRole="tablist"
    >
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={styles.segment}
          >
            {active ? (
              <Animated.View
                entering={FadeIn.duration(180)}
                style={[styles.segmentPill, { backgroundColor: t.card }, shadow('xs')]}
              />
            ) : null}
            <Text
              style={[
                styles.segmentLabel,
                { color: active ? t.primaryDeep : t.text3 },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

/* ------------------------------------------------------------------ */
/* Card (.card)                                                       */
/* ------------------------------------------------------------------ */
export const Card = memo(function Card({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const { t, shadow } = useDuoraTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.card,
          borderRadius: radii.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.cardBorder,
        },
        shadow('sm'),
        padded && { padding: 16 },
        style,
      ]}
    >
      {children}
    </View>
  );
});

/* ------------------------------------------------------------------ */
/* Section header (.section-head)                                     */
/* ------------------------------------------------------------------ */
export const SectionHead = memo(function SectionHead({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { t } = useDuoraTheme();
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: t.text }]}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text style={[styles.sectionLink, { color: t.primary }]}>{actionLabel} ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  btn: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  block: {
    width: '100%',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  btnLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 110,
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  iconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 15,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionLink: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },
  segmentPill: {
    ...ABSOLUTE_FILL,
    borderRadius: 999,
  },
  segmentLabel: { fontSize: 13, fontWeight: '800' },
});
