import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useDuoraTheme } from '../theme/ThemeProvider';

interface DuoraLogoProps {
  size?: number;
  showWordmark?: boolean;
  tagline?: boolean;
}

/** Two interlocking hearts — the Duora mark (primary + secondary brand colors). */
function HeartMark({ size, colors }: { size: number; colors: ReturnType<typeof useDuoraTheme>['colors'] }) {
  const heart =
    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={heart} fill={colors.secondary} opacity={0.85} transform="translate(-2.6 1.4) scale(0.92)" />
        <Path d={heart} fill={colors.primary} transform="translate(2.6 -1.4) scale(0.92)" />
      </Svg>
    </View>
  );
}

export function DuoraLogo({ size = 72, showWordmark = true, tagline = false }: DuoraLogoProps) {
  const { colors, typography, spacing } = useDuoraTheme();
  return (
    <View style={styles.container}>
      <HeartMark size={size} colors={colors} />
      {showWordmark ? (
        <Text
          style={[
            typography.display,
            { color: colors.text, marginTop: spacing.md, letterSpacing: 1 },
          ]}
        >
          Duora
        </Text>
      ) : null}
      {tagline ? (
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          Two hearts. One private space.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});
