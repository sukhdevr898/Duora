import { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, MessageCircle, Phone, StickyNote, Settings, type LucideIcon } from 'lucide-react-native';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { useStore } from '../state/store';

export type TabKey = 'home' | 'chat' | 'calls' | 'notes' | 'settings';

const ITEMS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'chat', label: 'Chat', icon: MessageCircle },
  { key: 'calls', label: 'Call', icon: Phone },
  { key: 'notes', label: 'Notes', icon: StickyNote },
  { key: 'settings', label: 'Settings', icon: Settings },
];

type Props = {
  active: TabKey;
  onChange: (key: TabKey) => void;
};

/** Compact, native bottom navigation; unread badges are driven by the API. */
export const BottomNav = memo(function BottomNav({ active, onChange }: Props) {
  const { t } = useDuoraTheme();
  const insets = useSafeAreaInsets();
  const conversations = useStore((s) => s.conversations);
  const unreadCount = conversations.reduce((count, conversation) => count + conversation.unreadCount, 0);

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
        const badge = key === 'chat' ? unreadCount : 0;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={badge ? `${label}, ${badge} unread` : label}
            onPress={() => !isActive && onChange(key)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View style={styles.iconStage}>
              <Icon
                size={21}
                strokeWidth={isActive ? 2.45 : 1.9}
                color={isActive ? t.primary : t.text3}
              />
              {badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color: isActive ? t.primaryDeep : t.text3 }]}>
              {label}
            </Text>
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
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -7 },
    elevation: 10,
  },
  item: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 3,
    gap: 4,
  },
  iconStage: {
    width: 32,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#ef4668',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 8, lineHeight: 10, fontWeight: '800' },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
});
