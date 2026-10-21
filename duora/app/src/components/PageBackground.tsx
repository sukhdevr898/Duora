import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Rect,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { useDuoraTheme } from '../theme/ThemeProvider';

/**
 * The soft page backdrop from the web UI's `.page-bg`:
 * two radial glows over a vertical shell→bg gradient.
 */
export const PageBackground = memo(function PageBackground() {
  const { t } = useDuoraTheme();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glowA" cx="82%" cy="-6%" rx="90%" ry="50%">
            <Stop offset="0%" stopColor={t.glowA} />
            <Stop offset="62%" stopColor={t.glowA} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="glowB" cx="8%" cy="4%" rx="80%" ry="44%">
            <Stop offset="0%" stopColor={t.glowB} />
            <Stop offset="60%" stopColor={t.glowB} stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="shell" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={t.shellTop} />
            <Stop offset="26%" stopColor={t.bg} />
            <Stop offset="100%" stopColor={t.bg} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#shell)" />
        <Ellipse cx="82%" cy="-6%" rx="90%" ry="50%" fill="url(#glowA)" />
        <Ellipse cx="8%" cy="4%" rx="80%" ry="44%" fill="url(#glowB)" />
      </Svg>
    </View>
  );
});
