import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useDuoraTheme } from '../src/theme/ThemeProvider';
import { DuoraLogo } from '../src/components/DuoraLogo';

export function SplashScreenView() {
  const { colors } = useDuoraTheme();
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) });
    opacity.value = withDelay(180, withTiming(1, { duration: 600 }));
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={animatedStyle}>
        <DuoraLogo size={96} showWordmark tagline />
      </Animated.View>
    </View>
  );
}

export default function SplashRoute() {
  return <SplashScreenView />;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
