/**
 * Skeleton placeholders — the shimmering blocks that stand in for data
 * while the server answers. They keep the layout stable, so nothing jumps
 * when the real rows arrive.
 */
import { memo, useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useDuoraTheme } from '../theme/ThemeProvider';

export const Skeleton = memo(function Skeleton({
  width,
  height = 14,
  radius = 8,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { t } = useDuoraTheme();
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [value]);

  const animated = useAnimatedStyle(() => ({
    opacity: 0.45 + value.value * 0.35,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width ?? '100%',
          height,
          borderRadius: radius,
          backgroundColor: t.fieldBg,
        },
        animated,
        style,
      ]}
    />
  );
});

/** A chat thread that is still loading. */
export const ChatSkeleton = memo(function ChatSkeleton({ rows = 7 }: { rows?: number }) {
  const { t } = useDuoraTheme();
  return (
    <View style={styles.chat}>
      {Array.from({ length: rows }).map((_, index) => {
        const mine = index % 3 === 1;
        const width = 120 + ((index * 37) % 110);
        return (
          <View
            key={index}
            style={[styles.bubble, mine ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}
          >
            <Skeleton
              width={width}
              height={40}
              radius={18}
              style={{ backgroundColor: mine ? t.primarySoft : t.fieldBg }}
            />
          </View>
        );
      })}
    </View>
  );
});

/** A generic list of cards that is still loading. */
export const CardSkeleton = memo(function CardSkeleton({
  count = 3,
  height = 88,
}: {
  count?: number;
  height?: number;
}) {
  return (
    <View style={styles.cards}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} width="100%" height={height} radius={22} style={styles.card} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  chat: { paddingHorizontal: 14, paddingTop: 8 },
  bubble: { marginBottom: 10 },
  cards: { paddingHorizontal: 18, gap: 12 },
  card: {},
});
