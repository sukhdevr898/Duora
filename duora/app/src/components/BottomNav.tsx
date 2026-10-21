import { memo, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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

/** Bottom tab bar with the animated active pill (mirrors `.bottom-nav`). */
export const BottomNav = memo(function BottomNav({ active, onChange }: Props) {
  const { t } = useDuoraTheme();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const index = ITEMS.findIndex((item) => item.key === active);
  const offset = useSharedValue(index);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const pillStyle = useAnimatedStyle(() => {
    const itemWidth = (width - 16) / ITEMS.length;
    const target = offset.value * itemWidth + (itemWidth - 46) / 2;
    return {
      transform: [{ translateX: withSpring(target, { damping: 20, stiffness: 240 }) }],
    };
  }, [width]);

  useEffect(() => {
    offset.value = index;
  }, [index, offset]);

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.bar,
        {
          backgroundColor: t.navBg,
          borderTopColor: t.navBorder,
          paddingBottom: insets.bottom + 8,
        },
      ]}
    >
      <View style={styles.pillLayer} pointerEvents="none">
        <Animated.View style={[styles.pill, pillStyle]}>
          <LinearGradient
            colors={[t.primary2, t.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pillGradient}
          />
        </Animated.View>
      </View>

      {ITEMS.map(({ key, label, icon: Icon }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
            onPress={() => !isActive && onChange(key)}
            style={styles.item}
          >
            <View style={styles.iconWrap}>
              <Icon
                size={21}
                strokeWidth={isActive ? 2.4 : 1.9}
                color={isActive ? '#ffffff' : t.text3}
              />
            </View>
            <Text style={[styles.label, { color: isActive ? t.primaryDeep : t.text3 }]}>{label}</Text>
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
    paddingTop: 8,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#362078',
    shadowOpacity: 0.06,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 12,
  },
  pillLayer: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 12,
    height: 32,
  },
  pill: {
    position: 'absolute',
    left: 0,
    width: 46,
    height: 32,
  },
  pillGradient: {
    width: 46,
    height: 32,
    borderRadius: 13,
    shadowColor: '#6d4bf6',
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Platform.OS === 'android' ? 6 : 4,
    gap: 5,
  },
  iconWrap: {
    width: 40,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
