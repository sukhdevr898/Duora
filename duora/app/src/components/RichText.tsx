import { memo } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

/**
 * Text with the Duora romantic accents.
 *
 * On React Native the platform ships a full colour-emoji font (Android and
 * iOS both render 💖 💜 ✨ 🌙 natively), so the accents keep their real colours
 * without bundling a 5 MB emoji webfont. The API mirrors the web component so
 * every screen reads identically in both apps.
 */
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
  const parts = sparkleColor ? text.split(/(\u2728)/g) : [text];

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
      {parts.map((part, index) =>
        part === '\u2728' ? (
          <Text key={index} style={{ color: sparkleColor }}>
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
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
