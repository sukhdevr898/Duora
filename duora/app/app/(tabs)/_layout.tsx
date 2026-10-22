import { usePathname, useRouter } from 'expo-router';
import { Tabs } from 'expo-router';
import { BottomNav, type TabKey } from '../../src/components/BottomNav';

const ROUTES: Record<TabKey, string> = {
  home: '/(tabs)',
  chat: '/chat',
  calls: '/calls',
  notes: '/notes',
  settings: '/settings',
};

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);
  const active: TabKey = segments.includes('chat')
    ? 'chat'
    : segments.includes('calls')
      ? 'calls'
      : segments.includes('notes')
        ? 'notes'
        : segments.includes('settings')
          ? 'settings'
          : 'home';

  return (
    <Tabs
      screenOptions={{ headerShown: false, animation: 'none' }}
      tabBar={() => (
        <BottomNav
          active={active}
          onChange={(key) => router.replace(ROUTES[key] as never)}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="calls" options={{ title: 'Calls' }} />
      <Tabs.Screen name="notes" options={{ title: 'Notes' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
