import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { PresenceIndicator } from './PresenceIndicator';

interface DuoraAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  showPresence?: boolean;
  online?: boolean;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function DuoraAvatar({ name, avatarUrl, size = 48, showPresence = false, online = false }: DuoraAvatarProps) {
  const { colors, typography } = useDuoraTheme();
  const fontSize = Math.max(12, Math.round(size * 0.38));

  return (
    <View style={{ width: size, height: size }}>
      {avatarUrl ? (
        <Image
          source={avatarUrl}
          style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.elevated }]}
          contentFit="cover"
          accessibilityLabel={`${name} avatar`}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.initials,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.elevated,
            },
          ]}
        >
          <Text style={[typography.heading, { color: colors.primary, fontSize }]}>{initialsOf(name)}</Text>
        </View>
      )}
      {showPresence ? <PresenceIndicator online={online} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { overflow: 'hidden' },
  initials: { justifyContent: 'center', alignItems: 'center' },
});
