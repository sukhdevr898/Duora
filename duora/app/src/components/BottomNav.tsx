import { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, MessageCircle, Phone, StickyNote, Settings, type LucideIcon } from 'lucide-react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';

export type TabKey = 'home' | 'chat' | 'calls' | 'notes' | 'settings';

const ITEMS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'chat', label: 'Chat', icon: MessageCircle },
  { key: 'calls', label: 'Calls', icon: Phone },
  { key: 'notes', label: 'Notes', icon: StickyNote },
  { key: 'settings', label: 'Settings', icon: Settings },
];

type Props = {
  active: TabKey;
  onChange: (key: TabKey) => void;
};

/** Compact native-style navigation: quiet when idle, rose-accented when active. */
export const BottomNav = memo(function BottomNav({ active, onChange }: Props) {
  const { t } = useDuoraTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: t.navBg,
          borderTopColor: t.navBorder,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 6),
        },
      ]}
    >
      {ITEMS.map(({ key, label, icon: Icon }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
            onPress={() => !isActive && onChange(key)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View
              style={[
                styles.iconWrap,
                isActive && { backgroundColor: t.primarySoft },
              ]}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.9}
                color={isActive ? t.primary : t.text3}
              />
            </View>
            <Text style={[styles.label, { color: isActive ? t.primaryDeep : t.text3 }]}>
              {label}
            </Text>
            {isActive ? <View style={[styles.activeDot, { backgroundColor: t.primary }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 7,
    paddingHorizontal: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#65283f',
    shadowOpacity: 0.06,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -7 },
    elevation: 10,
  },
  item: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 2,
    gap: 3,
  },
  iconWrap: {
    width: 42,
    height: 30,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  activeDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    bottom: -3,
  },
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
});
