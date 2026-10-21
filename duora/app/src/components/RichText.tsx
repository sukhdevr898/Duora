import { memo } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

/**
 * Text with the Duora romantic accents.
 *
 * The hearts and sparkles are drawn with plain typographic glyphs instead of
 * colour-emoji characters: an emoji would need a colour-emoji font (a 5 MB
 * webfont on the web, and a tofu box wherever the font is missing). These
 * glyphs ship with every system font, so the accents look the same on
 * Android, on iOS and in the browser.
 */

type AccentTone = 'pink' | 'violet' | 'red' | 'gold' | 'moon';

/** emoji → { glyph, tone } */
const ACCENTS: Record<string, { glyph: string; tone: AccentTone }> = {
  '\u{1F496}': { glyph: '♥', tone: 'pink' }, // sparkling heart
  '\u{1F49C}': { glyph: '♥', tone: 'violet' }, // purple heart
  '\u{1F49B}': { glyph: '♥', tone: 'pink' }, // yellow heart
  '\u{1F49A}': { glyph: '♥', tone: 'red' }, // green heart
  '\u{1F495}': { glyph: '♥', tone: 'red' }, // two hearts
  '\u{1F497}': { glyph: '♥', tone: 'pink' }, // growing heart
  '\u{1F498}': { glyph: '♥', tone: 'violet' }, // heart with arrow
  '\u{1F49D}': { glyph: '♥', tone: 'pink' }, // heart with ribbon
  '\u{1F49E}': { glyph: '♥', tone: 'violet' }, // revolving hearts
  '\u{1F5A4}': { glyph: '♥', tone: 'red' }, // black heart
  '\u{1F90E}': { glyph: '♥', tone: 'pink' }, // pink heart
  '❤️': { glyph: '♥', tone: 'red' }, // red heart + variation selector
  '\u{1F48B}': { glyph: '♥', tone: 'pink' }, // kiss mark
  '\u{1F618}': { glyph: '♥', tone: 'pink' }, // face blowing a kiss
  '\u{1F970}': { glyph: '♥', tone: 'pink' }, // smiling with hearts
  '\u{1F60D}': { glyph: '♥', tone: 'pink' }, // smiling with heart eyes
  '\u{2728}': { glyph: '✦', tone: 'gold' }, // sparkles
  '\u{1F4AB}': { glyph: '✦', tone: 'gold' }, // dizzy
  '\u{1F31F}': { glyph: '✦', tone: 'gold' }, // glowing star
  '\u{2B50}': { glyph: '✦', tone: 'gold' }, // star
  '\u{1F319}': { glyph: '☾', tone: 'moon' }, // crescent moon
  '\u{1F525}': { glyph: '✦', tone: 'gold' }, // fire
  '\u{1F4AF}': { glyph: '✦', tone: 'gold' }, // hundred points
  '\u{1F389}': { glyph: '✦', tone: 'gold' }, // party popper
  '\u{1F339}': { glyph: '♥', tone: 'pink' }, // rose
  '\u{1F338}': { glyph: '♥', tone: 'pink' }, // cherry blossom
  '\u{1F490}': { glyph: '♥', tone: 'pink' }, // bouquet
};

/** Any other emoji-ish character gets a soft stand-in. */
const EMOJI_RE =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{23E9}-\u{23FA}\u{25AA}-\u{25FE}\u{FE0F}]/u;

const TONES = {
  pink: '#F0709F',
  violet: '#8B5CF6',
  red: '#E5484D',
  gold: '#E8A33D',
  moon: '#7C6BB0',
} as const;

export type RichTextProps = {
  text: string;
  size?: number;
  color?: string;
  fontWeight?: TextStyle['fontWeight'];
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  /** Colour for the ✨ sparkle accents (web parity with the React build). */
  sparkleColor?: string;
};

export const RichText = memo(function RichText({
  text,
  size = 14,
  color,
  fontWeight,
  style,
  numberOfLines,
  sparkleColor,
}: RichTextProps) {
  // Split the string into plain runs and accent runs.
  const parts: { key: string; value: string; accent?: AccentTone }[] = [];
  let buffer = '';

  const flush = () => {
    if (buffer) {
      parts.push({ key: `t${parts.length}`, value: buffer });
      buffer = '';
    }
  };

  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i += 1) {
    const one = chars[i];
    const two = i + 1 < chars.length ? one + chars[i + 1] : one;
    const known = ACCENTS[two] ?? ACCENTS[one];
    if (known) {
      flush();
      parts.push({ key: `a${parts.length}`, value: known.glyph, accent: known.tone });
      if (ACCENTS[two]) i += 1;
      continue;
    }
    // A leftover emoji - draw a stand-in so the screen never shows a tofu box.
    if (one !== '\uFE0F' && EMOJI_RE.test(one)) {
      flush();
      parts.push({ key: `a${parts.length}`, value: '✦', accent: 'gold' });
      continue;
    }
    if (one === '\uFE0F') continue; // a stray variation selector
    buffer += one;
  }
  flush();

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontSize: size,
          lineHeight: size * 1.45,
          color,
          fontWeight,
        },
        style,
      ]}
    >
      {parts.map((part) =>
        part.accent ? (
          <Text
            key={part.key}
            style={{
              color:
                part.accent === 'gold' && sparkleColor ? sparkleColor : TONES[part.accent],
              fontSize: size * 0.92,
            }}
          >
            {part.value}
          </Text>
        ) : (
          <Text key={part.key}>{part.value}</Text>
        ),
      )}
    </Text>
  );
});

/** Small decorative heart used inside chips and badges. */
export const HeartGlyph = memo(function HeartGlyph({
  size = 12,
  color = '#F58BBF',
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Text style={{ fontSize: size, lineHeight: size * 1.2, color }} allowFontScaling={false}>
      ♥
    </Text>
  );
});
