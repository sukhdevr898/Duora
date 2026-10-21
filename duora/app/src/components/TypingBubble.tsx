/**
 * The typing indicator — three dots that breathe while your partner writes.
 */
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useDuoraTheme } from '../theme/ThemeProvider';

export const TypingBubble = memo(function TypingBubble({ visible }: { visible: boolean }) {
  const { t } = useDuoraTheme();
  if (!visible) return null;
  return (
    <View style={[styles.wrap, { backgroundColor: t.bubbleIn, borderColor: t.cardBorder }]}>
      {[0, 1, 2].map((index) => (
        <Dot key={index} index={index} color={t.text3} />
      ))}
    </View>
  );
});

function Dot({ index, color }: { index: number; color: string }) {
  const value = useSharedValue(0);
  value.value = withDelay(
    index * 160,
    withRepeat(
      withSequence(
        withTiming(1, { duration: 420, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 420, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    ),
  );
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -value.value * 4 }],
    opacity: 0.45 + value.value * 0.55,
  }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
