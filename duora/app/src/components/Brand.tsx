import { memo } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

/** The Duora heart path — identical to the web UI's Brand.tsx. */
export const HEART_PATH =
  'M50 88 C 20 66, 6 48, 6 33 C 6 18, 18 8, 31 8 C 40 8, 47 13, 50 19 C 53 13, 60 8, 69 8 C 82 8, 94 18, 94 33 C 94 48, 80 66, 50 88 Z';

type LogoProps = { size?: number };

/** Duora two-hearts mark — pink heart behind, violet heart in front. */
export const LogoHearts = memo(function LogoHearts({ size = 30 }: LogoProps) {
  return (
    <View style={{ width: size, height: size * 0.86 }}>
      <Svg viewBox="0 0 100 92" width="100%" height="100%">
        <Defs>
          <LinearGradient id="logoPink" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#FFB3D6" />
            <Stop offset="55%" stopColor="#F283B9" />
            <Stop offset="100%" stopColor="#D8558F" />
          </LinearGradient>
          <LinearGradient id="logoViolet" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#A98BFF" />
            <Stop offset="45%" stopColor="#7C51F5" />
            <Stop offset="100%" stopColor="#4B28C9" />
          </LinearGradient>
          <LinearGradient id="logoShine" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fff" stopOpacity="0.75" />
            <Stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <G transform="translate(-6 8) scale(0.86) rotate(-8 50 48)">
          <Path d={HEART_PATH} fill="url(#logoPink)" />
        </G>
        <G transform="translate(16 -2) scale(0.9) rotate(6 50 48)">
          <Path d={HEART_PATH} fill="url(#logoViolet)" />
          <Path
            d="M31 18 C 22 20, 17 26, 17 34 C 17 40, 22 38, 26 32 C 29 27, 31 22, 33 20 Z"
            fill="url(#logoShine)"
            opacity="0.55"
          />
        </G>
      </Svg>
    </View>
  );
});

type OrbProps = { size?: number; tone?: 'violet' | 'pink' };

/** Large glossy 3D heart used in empty states & the quote card. */
export const HeartOrb = memo(function HeartOrb({ size = 140, tone = 'violet' }: OrbProps) {
  const stops =
    tone === 'violet'
      ? [
          ['0%', '#C9B4FF'],
          ['35%', '#8F6BFF'],
          ['72%', '#6B40EC'],
          ['100%', '#4A21C4'],
        ]
      : [
          ['0%', '#FFD3E6'],
          ['40%', '#F9A9CD'],
          ['75%', '#EE7FB0'],
          ['100%', '#D9558F'],
        ];
  return (
    <View style={{ width: size, height: size * 0.95 }}>
      <Svg viewBox="0 0 120 112" width="100%" height="100%">
        <Defs>
          <LinearGradient id={`orb-${tone}`} x1="0.15" y1="0" x2="0.85" y2="1">
            {stops.map(([offset, color]) => (
              <Stop key={offset} offset={offset} stopColor={color} />
            ))}
          </LinearGradient>
          <RadialGradient id={`orbSpec-${tone}`} cx="0.34" cy="0.26" r="0.5">
            <Stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <Stop offset="60%" stopColor="#fff" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id={`orbRim-${tone}`} x1="0" y1="0" x2="0.4" y2="1">
            <Stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Ellipse cx="60" cy="100" rx="34" ry="9" fill={tone === 'violet' ? '#6B40EC' : '#D9558F'} opacity="0.28" />
        <G transform="translate(6 4) scale(1.08)">
          <Path d={HEART_PATH} fill={`url(#orb-${tone})`} />
          <Path d={HEART_PATH} fill={`url(#orbRim-${tone})`} />
          <Path d={HEART_PATH} fill={`url(#orbSpec-${tone})`} />
          <Ellipse cx="33" cy="26" rx="11" ry="6.5" fill="#fff" opacity="0.5" transform="rotate(-28 33 26)" />
          <Ellipse cx="30" cy="24" rx="4.5" ry="2.8" fill="#fff" opacity="0.9" transform="rotate(-28 30 24)" />
        </G>
      </Svg>
    </View>
  );
});

export const Sparkle = memo(function Sparkle({ size = 16, color = '#C4A6FF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 0c.7 6.4 4.9 10.6 11.3 11.3C16.9 12 12.7 16.2 12 22.6 11.3 16.2 7.1 12 .7 11.3 7.1 10.6 11.3 6.4 12 0z" fill={color} />
    </Svg>
  );
});

/** Soft organic wave stack for the welcome screen. */
export const WelcomeWaves = memo(function WelcomeWaves() {
  return (
    <Svg
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '62%' }}
      viewBox="0 0 420 420"
      preserveAspectRatio="none"
    >
      <Defs>
        <LinearGradient id="wave1" x1="0" y1="0" x2="0.3" y2="1">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
        </LinearGradient>
        <LinearGradient id="wave2" x1="0" y1="0" x2="0.7" y2="1">
          <Stop offset="0%" stopColor="#C9AEFF" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#A97BFF" stopOpacity="0.35" />
        </LinearGradient>
        <LinearGradient id="wave3" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#F4B7DE" stopOpacity="0.55" />
          <Stop offset="100%" stopColor="#C98CF5" stopOpacity="0.4" />
        </LinearGradient>
        <LinearGradient id="wave4" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </LinearGradient>
      </Defs>
      <Path d="M0 150 C 90 96 190 118 260 168 C 330 218 386 208 420 182 L420 420 L0 420 Z" fill="url(#wave1)" />
      <Path d="M0 218 C 96 168 170 208 250 236 C 330 264 380 246 420 214 L420 420 L0 420 Z" fill="url(#wave2)" />
      <Path d="M0 286 C 84 250 168 288 252 306 C 332 322 386 302 420 278 L420 420 L0 420 Z" fill="url(#wave3)" />
      <Path d="M0 344 C 120 316 210 356 300 366 C 356 372 396 364 420 354 L420 420 L0 420 Z" fill="url(#wave4)" />
    </Svg>
  );
});
