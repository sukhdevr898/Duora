import { Tabs } from 'expo-router';
import { DuoraBottomNavigation } from '../../src/components/DuoraBottomNavigation';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <DuoraBottomNavigation {...(props as unknown as Parameters<typeof DuoraBottomNavigation>[0])} />
      )}
      screenOptions={{ headerShown: false, freezeOnBlur: true }}
      backBehavior="history"
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
