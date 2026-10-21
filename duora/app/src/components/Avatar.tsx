import { memo } from 'react';
import { Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { ABSOLUTE_FILL } from '../theme/tokens';

type Props = {
  src?: string | null;
  alt?: string;
  size?: number;
  ring?: boolean;
  online?: boolean;
  ringWidth?: number;
};

/** Circular avatar with an optional gradient ring + presence dot. */
export const Avatar = memo(function Avatar({
  src,
  alt = '',
  size = 44,
  ring = false,
  online = false,
  ringWidth = 2.5,
}: Props) {
  const { t } = useDuoraTheme();
  const inner = size - ringWidth * 2;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          padding: ring ? ringWidth : 0,
          backgroundColor: ring ? t.primary : 'transparent',
          overflow: 'visible',
        },
      ]}
      accessibilityLabel={alt}
    >
      <View
        style={{
          width: inner,
          height: inner,
          borderRadius: inner / 2,
          overflow: 'hidden',
          backgroundColor: t.surfaceSoft,
        }}
      >
        {src ? (
          <Image source={{ uri: src }} style={{ width: inner, height: inner }} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[t.primary2, t.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: inner, height: inner, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: Math.max(11, inner * 0.42),
                fontWeight: '800',
                letterSpacing: -0.3,
              }}
            >
              {(alt || 'D').trim().charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
      </View>
      {online ? (
        <View
          style={[
            ABSOLUTE_FILL,
            {
              backgroundColor: t.mint,
              width: Math.max(9, size * 0.24),
              height: Math.max(9, size * 0.24),
              borderRadius: Math.max(9, size * 0.24) / 2,
              top: 0,
              right: 0,
              borderWidth: 2,
              borderColor: t.surface,
            },
          ]}
        />
      ) : null}
    </View>
  );
});
