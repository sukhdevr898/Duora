import { useId } from 'react';

const HEART = 'M50 88 C 20 66, 6 48, 6 33 C 6 18, 18 8, 31 8 C 40 8, 47 13, 50 19 C 53 13, 60 8, 69 8 C 82 8, 94 18, 94 33 C 94 48, 80 66, 50 88 Z';

type Tint = [string, string];

const HEART_TINTS: Record<string, Tint> = {
  '❤️': ['#FF8A80', '#EF3B31'],
  '❤': ['#FF8A80', '#EF3B31'],
  '💖': ['#FFB4D6', '#F5498B'],
  '💜': ['#B79BFF', '#6D4BF6'],
  '🩷': ['#FFC9DE', '#F58BBF'],
  '💗': ['#FFC2DF', '#F574A8'],
  '💞': ['#C4A6FF', '#8F6BFF'],
  '💘': ['#C7B0FF', '#7C51F5'],
};

const SPARKLES = new Set(['✨', '💫']);
const MOONS = new Set(['🌙']);
const STARS = new Set(['⭐', '🌟']);

function EmojiHeart({ char, size }: { char: string; size: number }) {
  const uid = useId().replace(/:/g, '');
  const [light, dark] = HEART_TINTS[char] ?? ['#FFB4D6', '#F5498B'];
  const iconSize = size * 0.95;
  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 100 92"
      aria-label={char}
      role="img"
      style={{ display: 'inline-block', verticalAlign: '-0.14em', margin: '0 0.06em' }}
    >
      <defs>
        <linearGradient id={`eh-${uid}`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      <path d={HEART} fill={`url(#eh-${uid})`} />
      <ellipse cx="34" cy="27" rx="9" ry="5" fill="#fff" opacity="0.45" transform="rotate(-28 34 27)" />
    </svg>
  );
}

function EmojiSparkle({ size, stroke }: { size: number; stroke: string }) {
  return (
    <svg
      width={size * 0.9}
      height={size * 0.9}
      viewBox="0 0 24 24"
      aria-label="sparkle"
      role="img"
      style={{ display: 'inline-block', verticalAlign: '-0.1em', margin: '0 0.08em' }}
    >
      <path
        d="M12 0c.7 6.4 4.9 10.6 11.3 11.3C16.9 12 12.7 16.2 12 22.6 11.3 16.2 7.1 12 .7 11.3 7.1 10.6 11.3 6.4 12 0z"
        fill={stroke}
      />
    </svg>
  );
}

function EmojiMoon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size * 0.9}
      height={size * 0.9}
      viewBox="0 0 24 24"
      aria-label="moon"
      role="img"
      style={{ display: 'inline-block', verticalAlign: '-0.1em', margin: '0 0.08em' }}
    >
      <path
        d="M21 14.5A9 9 0 1 1 9.7 3.3a7.4 7.4 0 0 0 11.3 11.2z"
        fill={color}
      />
    </svg>
  );
}

function EmojiStar({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size * 0.9}
      height={size * 0.9}
      viewBox="0 0 24 24"
      aria-label="star"
      role="img"
      style={{ display: 'inline-block', verticalAlign: '-0.1em', margin: '0 0.08em' }}
    >
      <path
        d="M12 1.8l3 6.4 7 .9-5.1 4.8 1.3 6.9-6.2-3.4-6.2 3.4 1.3-6.9L2 8.9l7-.9z"
        fill={color}
      />
    </svg>
  );
}

type Props = {
  text: string;
  /** font size in px used to scale inline glyphs */
  size?: number;
  /** colours for sparkles */
  sparkleColor?: string;
};

/**
 * Renders text with brand-styled inline SVG hearts / sparkles / moons instead of
 * platform emoji, so the romantic accents look identical on every device.
 */
export function RichText({ text, size = 14, sparkleColor = '#C4A6FF' }: Props) {
  const tokens = Array.from(text).reduce<string[]>((acc, ch) => {
    const last = acc[acc.length - 1];
    // keep variation selector with its base glyph (e.g. ❤️)
    if (ch === '\uFE0F' && last !== undefined) {
      acc[acc.length - 1] = last + ch;
      return acc;
    }
    acc.push(ch);
    return acc;
  }, []);

  return (
    <span className="rich-text">
      {tokens.map((token, i) => {
        if (HEART_TINTS[token]) return <EmojiHeart key={i} char={token} size={size} />;
        if (SPARKLES.has(token)) return <EmojiSparkle key={i} size={size} stroke={sparkleColor} />;
        if (MOONS.has(token)) return <EmojiMoon key={i} size={size} color="#F5CE74" />;
        if (STARS.has(token)) return <EmojiStar key={i} size={size} color="#FFC44D" />;
        return <span key={i}>{token}</span>;
      })}
    </span>
  );
}
