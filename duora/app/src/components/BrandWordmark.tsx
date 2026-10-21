import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { LogoHearts } from './Brand';

/** Duora wordmark with the exact gradient used by `.brand__word`. */
export const BrandWordmark = memo(function BrandWordmark({
  size = 21,
  width,
}: {
  size?: number;
  width?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <LogoHearts size={28} />
      <Svg width={width ?? size * 3.1} height={size * 1.35}>
        <Defs>
          <LinearGradient id="wordmarkGrad" x1="0" y1="0" x2="1" y2="0.4">
            <Stop offset="0%" stopColor="#4a2bd0" />
            <Stop offset="46%" stopColor="#7f4ff5" />
            <Stop offset="100%" stopColor="#c46ae0" />
          </LinearGradient>
        </Defs>
        <SvgText
          x="0"
          y={size * 1.02}
          fontSize={size}
          fontWeight="800"
          letterSpacing={-size * 0.0435}
          fill="url(#wordmarkGrad)"
        >
          Duora
        </SvgText>
      </Svg>
    </View>
  );
});

/** Large centred wordmark used on the welcome screen. */
export const LogoLockup = memo(function LogoLockup({ size = 46 }: { size?: number }) {
  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <LogoHearts size={92} />
      <Svg width={size * 3.1} height={size * 1.25}>
        <Defs>
          <LinearGradient id="lockupGrad" x1="0" y1="0" x2="1" y2="0.3">
            <Stop offset="0%" stopColor="#4a2bd0" />
            <Stop offset="42%" stopColor="#7347f0" />
            <Stop offset="72%" stopColor="#a25be8" />
            <Stop offset="100%" stopColor="#c85c9e" />
          </LinearGradient>
        </Defs>
        <SvgText
          x="0"
          y={size * 0.98}
          fontSize={size}
          fontWeight="800"
          letterSpacing={-2}
          fill="url(#lockupGrad)"
        >
          Duora
        </SvgText>
      </Svg>
      <Text style={styles.tagline}>Just You &amp; Me</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7a719a',
    letterSpacing: 0.3,
    marginTop: -2,
  },
});
