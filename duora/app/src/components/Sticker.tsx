import { memo } from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

type Eyes = 'dot' | 'soft' | 'closed' | 'heart' | 'star' | 'wink' | 'sparkle';
type Mouth = 'smile' | 'open' | 'kiss' | 'flat' | 'wavy' | 'grin';

export type FaceSticker = {
  id: string;
  kind?: 'face';
  bg: [string, string];
  eyes: Eyes;
  mouth: Mouth;
  blush?: boolean;
  tears?: boolean;
  zzz?: boolean;
  hearts?: boolean;
};

export type HeartSticker = {
  id: string;
  kind: 'heart';
  bg: [string, string];
  face?: boolean;
};

export type StickerSpec = FaceSticker | HeartSticker;

/** The same 14 stickers as the web UI — identical geometry and colours. */
export const stickers: StickerSpec[] = [
  { id: 'heart-pink', kind: 'heart', bg: ['#FFC2DE', '#F4629F'], face: true },
  { id: 'heart-violet', kind: 'heart', bg: ['#C4A6FF', '#6D4BF6'], face: true },
  { id: 'happy', kind: 'face', bg: ['#FFE7A8', '#FFC44D'], eyes: 'soft', mouth: 'smile', blush: true },
  { id: 'love', kind: 'face', bg: ['#FFD1E4', '#F98BB8'], eyes: 'heart', mouth: 'open', blush: true, hearts: true },
  { id: 'kiss', kind: 'face', bg: ['#FFD9C7', '#FF9E7A'], eyes: 'closed', mouth: 'kiss', blush: true },
  { id: 'shy', kind: 'face', bg: ['#EFE3FF', '#B79BFF'], eyes: 'sparkle', mouth: 'kiss', blush: true },
  { id: 'wink', kind: 'face', bg: ['#D5F2E3', '#64D6A4'], eyes: 'wink', mouth: 'grin', blush: true },
  { id: 'star', kind: 'face', bg: ['#E3DBFF', '#9C7BFF'], eyes: 'star', mouth: 'open' },
  { id: 'laugh', kind: 'face', bg: ['#FFE9B5', '#FFB958'], eyes: 'closed', mouth: 'open', tears: true },
  { id: 'sleepy', kind: 'face', bg: ['#DFE9FF', '#8FB4FF'], eyes: 'closed', mouth: 'flat', zzz: true },
  { id: 'heart-red', kind: 'heart', bg: ['#FF9F97', '#EF3B31'] },
  { id: 'heart-lilac', kind: 'heart', bg: ['#E4D3FF', '#A98BFF'] },
  { id: 'heart-mint', kind: 'heart', bg: ['#BFF2DD', '#3FCB94'] },
  { id: 'heart-peach', kind: 'heart', bg: ['#FFD9B8', '#FF9B6A'] },
];

const HEART = 'M50 88 C 20 66, 6 48, 6 33 C 6 18, 18 8, 31 8 C 40 8, 47 13, 50 19 C 53 13, 60 8, 69 8 C 82 8, 94 18, 94 33 C 94 48, 80 66, 50 88 Z';
const MINI_HEART =
  'M0 3.2C0 1.4 1.4 0 3.2 0 4.3 0 5.3.5 6 1.4 6.7.5 7.7 0 8.8 0 10.6 0 12 1.4 12 3.2c0 6-6 8.4-6 8.4S0 9 .0 3.2z';

function EyesShape({ kind }: { kind: Eyes }) {
  const dark = '#3A2E4F';
  switch (kind) {
    case 'dot':
    case 'soft':
      return (
        <>
          <Ellipse cx="24" cy="29" rx="3.1" ry="3.6" fill={dark} />
          <Ellipse cx="40" cy="29" rx="3.1" ry="3.6" fill={dark} />
          <Circle cx="25" cy="27.6" r="1" fill="#fff" />
          <Circle cx="41" cy="27.6" r="1" fill="#fff" />
        </>
      );
    case 'closed':
      return (
        <>
          <Path d="M19.5 29.5c2.6-3 6.4-3 9 0" stroke={dark} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <Path d="M35.5 29.5c2.6-3 6.4-3 9 0" stroke={dark} strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </>
      );
    case 'wink':
      return (
        <>
          <Path d="M19.5 29.5c2.6-3 6.4-3 9 0" stroke={dark} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <Ellipse cx="40" cy="28.5" rx="3.1" ry="3.6" fill={dark} />
          <Circle cx="41" cy="27.1" r="1" fill="#fff" />
        </>
      );
    case 'heart':
      return (
        <>
          <Path d={MINI_HEART} transform="translate(18 23.5)" fill="#E8455F" />
          <Path d={MINI_HEART} transform="translate(34 23.5)" fill="#E8455F" />
        </>
      );
    case 'star':
      return (
        <>
          <Path
            d="M6 0l1.7 3.7L12 4.3 8.9 7.1l.8 4.1L6 9.2 2.3 11.2l.8-4.1L0 4.3l4.3-.6z"
            transform="translate(18 23.6) scale(1.05)"
            fill="#F0A93C"
          />
          <Path
            d="M6 0l1.7 3.7L12 4.3 8.9 7.1l.8 4.1L6 9.2 2.3 11.2l.8-4.1L0 4.3l4.3-.6z"
            transform="translate(34 23.6) scale(1.05)"
            fill="#F0A93C"
          />
        </>
      );
    case 'sparkle':
      return (
        <>
          <Path
            d="M6 0c.4 3.6 2.7 5.9 6.3 6.3C8.7 6.7 6.4 9 6 12.6 5.6 9 3.3 6.7-.3 6.3 3.3 5.9 5.6 3.6 6 0z"
            transform="translate(18 22.5)"
            fill="#5B43C6"
          />
          <Path
            d="M6 0c.4 3.6 2.7 5.9 6.3 6.3C8.7 6.7 6.4 9 6 12.6 5.6 9 3.3 6.7-.3 6.3 3.3 5.9 5.6 3.6 6 0z"
            transform="translate(34 22.5)"
            fill="#5B43C6"
          />
        </>
      );
    default:
      return null;
  }
}

function MouthShape({ kind }: { kind: Mouth }) {
  const dark = '#3A2E4F';
  switch (kind) {
    case 'smile':
      return (
        <Path
          d="M24 38c2.6 3.6 5.9 5.4 9.4 5.4S40 41.6 42.6 38"
          stroke={dark}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'grin':
      return <Path d="M23 37h19c-.6 5.6-4.4 8.8-9.5 8.8S23.6 42.6 23 37z" fill={dark} opacity="0.92" />;
    case 'open':
      return (
        <>
          <Path d="M24.5 37.5h17c-.4 5.8-3.8 9.5-8.5 9.5s-8.1-3.7-8.5-9.5z" fill="#5B3352" />
          <Path d="M29.5 43.8c1.8 1.7 7.2 1.7 9 0-1 3.2-7.9 3.4-9 0z" fill="#F0798F" />
        </>
      );
    case 'kiss':
      return (
        <Path
          d="M28 40.5c1.6-1.6 3.2-1.6 4-.4 0.8-1.2 2.4-1.2 4 0.4-1.6 2.4-3.2 3.4-4 4-0.8-.6-2.4-1.6-4-4z"
          fill="#E8607B"
        />
      );
    case 'flat':
      return <Path d="M26 41.5h12" stroke={dark} strokeWidth="2.4" strokeLinecap="round" />;
    case 'wavy':
      return (
        <Path
          d="M24.5 41.5c2.6-2.4 5.2 2.4 7.8 0s5.2 2.4 7.8 0"
          stroke={dark}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      );
    default:
      return null;
  }
}

function Face({ spec }: { spec: FaceSticker }) {
  return (
    <Svg viewBox="0 0 64 64" width="100%" height="100%">
      <Defs>
        <LinearGradient id="stickerBg" x1="0.2" y1="0" x2="0.8" y2="1">
          <Stop offset="0%" stopColor={spec.bg[0]} />
          <Stop offset="100%" stopColor={spec.bg[1]} />
        </LinearGradient>
        <RadialGradient id="stickerSpec" cx="0.32" cy="0.24" r="0.55">
          <Stop offset="0%" stopColor="#fff" stopOpacity="0.65" />
          <Stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="32" cy="32" r="29" fill="url(#stickerBg)" />
      <Circle cx="32" cy="32" r="29" fill="url(#stickerSpec)" />
      <Circle cx="32" cy="32" r="29" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.2" />
      {spec.blush ? (
        <>
          <Ellipse cx="16.5" cy="36.5" rx="4.6" ry="3" fill="#F0709A" opacity="0.38" />
          <Ellipse cx="47.5" cy="36.5" rx="4.6" ry="3" fill="#F0709A" opacity="0.38" />
        </>
      ) : null}
      <EyesShape kind={spec.eyes} />
      <MouthShape kind={spec.mouth} />
      {spec.tears ? (
        <>
          <Path d="M14 32c-2.4 3.4-2.4 5.4 0 5.4s2.4-2 0-5.4z" fill="#7FB8FF" />
          <Path d="M50 32c-2.4 3.4-2.4 5.4 0 5.4s2.4-2 0-5.4z" fill="#7FB8FF" />
        </>
      ) : null}
      {spec.zzz ? (
        <G fill="#5E6CA8">
          <SvgText x="44" y="19" fontSize="9" fontWeight="800">
            z
          </SvgText>
          <SvgText x="49" y="13" fontSize="7" fontWeight="800">
            z
          </SvgText>
        </G>
      ) : null}
      {spec.hearts ? (
        <>
          <Path d={MINI_HEART} transform="translate(44 6) scale(0.9) rotate(12)" fill="#F2527A" />
          <Path d={MINI_HEART} transform="translate(6 8) scale(0.65) rotate(-14)" fill="#F2527A" opacity="0.85" />
        </>
      ) : null}
    </Svg>
  );
}

function HeartFace({ spec }: { spec: HeartSticker }) {
  return (
    <Svg viewBox="0 0 100 92" width="100%" height="100%">
      <Defs>
        <LinearGradient id="stickerHeart" x1="0.15" y1="0" x2="0.85" y2="1">
          <Stop offset="0%" stopColor={spec.bg[0]} />
          <Stop offset="100%" stopColor={spec.bg[1]} />
        </LinearGradient>
      </Defs>
      <Path d={HEART} fill="url(#stickerHeart)" />
      <Ellipse cx="33" cy="26" rx="10" ry="6" fill="#fff" opacity="0.45" transform="rotate(-28 33 26)" />
      {spec.face ? (
        <G>
          <Path d="M38 42c1.6-1.8 4-1.8 5.6 0" stroke="#3A2E4F" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <Path d="M56 42c1.6-1.8 4-1.8 5.6 0" stroke="#3A2E4F" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <Path d="M46 51c1.8 2.4 4 3.6 6 3.6s4.2-1.2 6-3.6" stroke="#3A2E4F" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        </G>
      ) : null}
    </Svg>
  );
}

export const Sticker = memo(function Sticker({ id, size = 44 }: { id: string; size?: number }) {
  const spec = stickers.find((s) => s.id === id);
  if (!spec) return null;
  return (
    <View style={{ width: size, height: size }}>
      {spec.kind === 'heart' ? <HeartFace spec={spec} /> : <Face spec={spec} />}
    </View>
  );
});
