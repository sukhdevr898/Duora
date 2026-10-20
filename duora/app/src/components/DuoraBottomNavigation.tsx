import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { touchTarget } from '../theme/tokens';

interface TabRoute {
  key: string;
  name: string;
}

interface TabBarProps {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
  };
}

const TAB_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  home: { icon: 'heart-outline', label: 'Home' },
  chat: { icon: 'chatbubbles-outline', label: 'Chat' },
  settings: { icon: 'settings-outline', label: 'Settings' },
};

/** Custom tab bar — exactly three tabs: Home, Chat, Settings. */
export function DuoraBottomNavigation({ state, navigation }: TabBarProps) {
  const { colors, typography } = useDuoraTheme();

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {state.routes.map((route: TabRoute, index: number) => {
        const meta = TAB_META[route.name] ?? { icon: 'ellipse-outline' as const, label: route.name };
        const focused = state.index === index;
        const color = focused ? colors.primary : colors.textSecondary;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={meta.label}
            accessibilityState={{ selected: focused }}
            style={styles.tab}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          >
            <Ionicons
              name={focused ? (meta.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : meta.icon}
              size={22}
              color={color}
            />
            <Text style={[typography.caption, { color, marginTop: 2, fontSize: 11 }]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 8, paddingTop: 6 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: touchTarget },
});
