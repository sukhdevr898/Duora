import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { IconButton } from './IconButton';
import { touchTarget } from '../theme/tokens';

interface MenuItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: (router: ReturnType<typeof useRouter>) => void;
}

const MENU_ITEMS: MenuItem[] = [
  { key: 'pairing', label: 'Pairing', icon: 'people-outline', action: (r) => r.push('/pairing') },
  {
    key: 'theme',
    label: 'Theme',
    icon: 'color-palette-outline',
    action: (r) => r.push({ pathname: '/(tabs)/settings', params: { section: 'appearance' } }),
  },
  { key: 'server', label: 'Server Settings', icon: 'server-outline', action: (r) => r.push('/server-settings') },
  { key: 'profile', label: 'Profile', icon: 'person-outline', action: (r) => r.push('/profile') },
  { key: 'dev', label: 'Developer Info', icon: 'code-slash-outline', action: (r) => r.push('/developer-info') },
  { key: 'about', label: 'About Duora', icon: 'information-circle-outline', action: (r) => r.push('/about') },
];

export function DuoraOverflowMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { colors, spacing, radii, typography } = useDuoraTheme();

  return (
    <>
      <IconButton
        name="ellipsis-vertical"
        label="Open more options"
        onPress={() => setOpen(true)}
      />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close menu">
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xs },
            ]}
          >
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="menuitem"
                accessibilityLabel={item.label}
                style={({ pressed }) => [
                  styles.item,
                  { minHeight: touchTarget, borderRadius: radii.md, opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => {
                  setOpen(false);
                  item.action(router);
                }}
              >
                <Ionicons name={item.icon} size={20} color={colors.primary} />
                <Text style={[typography.body, { color: colors.text, marginLeft: spacing.md }]}>{item.label}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,5,14,0.45)', alignItems: 'flex-end' },
  sheet: { marginTop: 56, marginRight: 12, minWidth: 240 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
});
