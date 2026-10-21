import { usePathname, useRouter } from 'expo-router';
import { Tabs } from 'expo-router';
import { BottomNav, type TabKey } from '../../src/components/BottomNav';

const ROUTES: Record<TabKey, string> = {
  home: '/home',
  chat: '/chat',
  calls: '/calls',
  notes: '/notes',
  settings: '/settings',
};

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const active = (pathname.split('/').filter(Boolean).pop() ?? 'home') as TabKey;

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
