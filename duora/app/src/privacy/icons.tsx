/**
 * Privacy icons.
 *
 * Duora is a private app, so the launcher icon can be swapped for something
 * innocent — a clock, the weather, a calculator, a notepad — while the
 * Duora hearts stay one tap away inside the app.
 *
 * Every icon is drawn by hand with react-native-svg (no image assets, no
 * font dependency) so it stays crisp on every Android density.
 */
import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

export type PrivacyIconKey = 'duora' | 'clock' | 'weather' | 'calculator' | 'notes';

export type PrivacyIconInfo = {
  key: PrivacyIconKey;
  label: string;
  blurb: string;
  /** Launcher background gradient. */
  bg: readonly [string, string];
  /** Glyph colour. */
  fg: string;
};

export const PRIVACY_ICONS: PrivacyIconInfo[] = [
  {
    key: 'duora',
    label: 'Duora',
    blurb: 'The real thing — two hearts and your name.',
    bg: ['#8F6BFF', '#5B34E0'],
    fg: '#FFFFFF',
  },
  {
    key: 'clock',
    label: 'Clock',
    blurb: 'Looks like a plain clock app.',
    bg: ['#2F3350', '#171A2B'],
    fg: '#E9ECFF',
  },
  {
    key: 'weather',
    label: 'Weather',
    blurb: 'A weather app nobody will ever open.',
    bg: ['#4FA8F5', '#1E63C7'],
    fg: '#FFFFFF',
  },
  {
    key: 'calculator',
    label: 'Calculator',
    blurb: 'Numbers outside, us on the inside.',
    bg: ['#3C4257', '#1B1F2E'],
    fg: '#F2F5FF',
  },
  {
    key: 'notes',
    label: 'Notes',
    blurb: 'A to-do list that is really a love letter.',
    bg: ['#FFB35C', '#F0762F'],
    fg: '#FFFFFF',
  },
];

export const privacyIconInfo = (key: PrivacyIconKey): PrivacyIconInfo =>
  PRIVACY_ICONS.find((icon) => icon.key === key) ?? PRIVACY_ICONS[0];

/* ------------------------------------------------------------------ */
/* Glyphs                                                             */
/* ------------------------------------------------------------------ */

const DuoraGlyph = memo(function DuoraGlyph({ fg }: { fg: string }) {
  return (
    <G>
      <Path
        d="M50 84 C 26 66, 14 51, 14 38 C 14 26, 24 17, 35 17 C 42 17, 47 21, 50 27 C 53 21, 58 17, 65 17 C 76 17, 86 26, 86 38 C 86 51, 74 66, 50 84 Z"
        fill={fg}
        opacity={0.45}
        transform="translate(-6, 0) scale(0.94)"
      />
      <Path
        d="M58 84 C 36 67, 25 53, 25 41 C 25 30, 34 22, 44 22 C 50 22, 55 25, 58 31 C 61 25, 66 22, 72 22 C 82 22, 91 30, 91 41 C 91 53, 80 67, 58 84 Z"
        fill={fg}
      />
    </G>
  );
});

const ClockGlyph = memo(function ClockGlyph({ fg }: { fg: string }) {
  return (
    <G>
      <Circle cx="50" cy="52" r="30" fill="none" stroke={fg} strokeWidth="5" opacity={0.9} />
      <Line x1="50" y1="52" x2="50" y2="33" stroke={fg} strokeWidth="5" strokeLinecap="round" />
      <Line x1="50" y1="52" x2="65" y2="60" stroke={fg} strokeWidth="5" strokeLinecap="round" />
      <Rect x="45" y="12" width="10" height="8" rx="3" fill={fg} />
    </G>
  );
});

const WeatherGlyph = memo(function WeatherGlyph({ fg }: { fg: string }) {
  return (
    <G>
      <Circle cx="40" cy="38" r="15" fill={fg} opacity={0.95} />
      <Path
        d="M34 72 C 22 72, 14 64, 14 54 C 14 45, 21 38, 30 36 C 33 27, 41 21, 50 21 C 61 21, 70 29, 71 40 C 78 42, 83 48, 83 55 C 83 64, 75 72, 65 72 Z"
        fill={fg}
        opacity={0.95}
      />
    </G>
  );
});

const CalculatorGlyph = memo(function CalculatorGlyph({ fg }: { fg: string }) {
  const dots: { x: number; y: number }[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      dots.push({ x: 30 + col * 14, y: 52 + row * 13 });
    }
  }
  return (
    <G>
      <Rect x="19" y="16" width="62" height="68" rx="12" fill="none" stroke={fg} strokeWidth="5" />
      <Rect x="28" y="25" width="44" height="16" rx="5" fill={fg} opacity={0.9} />
      {dots.map((d) => (
        <Circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r="4" fill={fg} opacity={0.9} />
      ))}
    </G>
  );
});

const NotesGlyph = memo(function NotesGlyph({ fg }: { fg: string }) {
  return (
    <G>
      <Path
        d="M24 18 H66 L78 30 V82 H24 Z"
        fill="none"
        stroke={fg}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <Path d="M66 18 V30 H78" fill="none" stroke={fg} strokeWidth="5" strokeLinejoin="round" />
      <Line x1="35" y1="45" x2="67" y2="45" stroke={fg} strokeWidth="4.5" strokeLinecap="round" />
      <Line x1="35" y1="58" x2="67" y2="58" stroke={fg} strokeWidth="4.5" strokeLinecap="round" />
      <Line x1="35" y1="71" x2="55" y2="71" stroke={fg} strokeWidth="4.5" strokeLinecap="round" />
    </G>
  );
});

const GLYPHS: Record<PrivacyIconKey, (props: { fg: string }) => React.ReactNode> = {
  duora: DuoraGlyph,
  clock: ClockGlyph,
  weather: WeatherGlyph,
  calculator: CalculatorGlyph,
  notes: NotesGlyph,
};

/* ------------------------------------------------------------------ */
/* The launcher-style icon                                            */
/* ------------------------------------------------------------------ */

export const AppIcon = memo(function AppIcon({
  icon,
  size = 64,
  radius,
  style,
  shadow = true,
}: {
  icon: PrivacyIconKey;
  size?: number;
  /** Corner radius of the squircle (defaults to the Android 22 %). */
  radius?: number;
  style?: StyleProp<ViewStyle>;
  shadow?: boolean;
}) {
  const info = privacyIconInfo(icon);
  const Glyph = GLYPHS[icon];
  const r = radius ?? Math.round(size * 0.22);
  const glyphSize = size * 0.62;
  const glyphOffset = (size - glyphSize) / 2;

  return (
    <View
      style={[
        { width: size, height: size, borderRadius: r, overflow: 'hidden' },
        shadow && styles.shadow,
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`bg-${icon}`} x1="0" y1="0" x2="0.4" y2="1">
            <Stop offset="0%" stopColor={info.bg[0]} />
            <Stop offset="100%" stopColor={info.bg[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" rx="22" fill={`url(#bg-${icon})`} />
        <G transform={`translate(${glyphOffset} ${glyphOffset}) scale(${glyphSize / 100})`}>
          <Glyph fg={info.fg} />
        </G>
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#2A1A5E',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
