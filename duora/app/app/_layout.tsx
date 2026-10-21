import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { ThemeProvider, useDuoraTheme } from '../src/theme/ThemeProvider';
import { ToastProvider } from '../src/components/Overlay';
import { useStore, installSessionGuard } from '../src/state/store';

export default function RootLayout() {
  const [loaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    GreatVibes_400Regular,
  });

  useEffect(() => {
    installSessionGuard();
    void useStore.getState().bootstrap();
  }, []);

  if (!loaded) return <View style={{ flex: 1 }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemedRoot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Keeps the connection to the API alive.
 *
 * The Render free tier sleeps after 15 minutes, so the first request after
 * that hits a waking instance. We ping it every few seconds while it is down
 * and every 30 s once it is healthy, which keeps the connection pill honest.
 */
function ServerHeartbeat() {
  const status = useStore((s) => s.server.status);
  const autoReconnect = useStore((s) => s.server.autoReconnect);
  const checkServer = useStore((s) => s.checkServer);

  useEffect(() => {
    if (!autoReconnect) return;
    const interval = setInterval(
      () => {
        if (useStore.getState().server.status !== 'online') {
          void useStore.getState().checkServer();
        }
      },
      status === 'online' ? 30_000 : 8_000,
    );
    return () => clearInterval(interval);
  }, [autoReconnect, status, checkServer]);

  return null;
}

function ThemedRoot() {
  const themePreference = useStore((s) => s.themePreference);
  const accent = useStore((s) => s.accent);
  const loveMode = useStore((s) => s.loveMode);
  const heartMotion = useStore((s) => s.heartMotion);
  const glass = useStore((s) => s.glass);
  const setThemePreference = useStore((s) => s.setThemePreference);
  const setAccent = useStore((s) => s.setAccent);
  const setLoveMode = useStore((s) => s.setLoveMode);
  const setHeartMotion = useStore((s) => s.setHeartMotion);
  const setGlass = useStore((s) => s.setGlass);

  return (
    <ThemeProvider
      controller={{
        themePreference,
        accent,
        loveMode,
        heartMotion,
        glass,
        setThemePreference,
        setAccent,
        setLoveMode,
        setHeartMotion,
        setGlass,
      }}
    >
      <AppShell />
    </ThemeProvider>
  );
}

function AppShell() {
  const { mode, t } = useDuoraTheme();

  return (
    <ToastProvider>
      <ServerHeartbeat />
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="pairing/index" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="pairing/scan" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="call/audio" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="call/video" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </ToastProvider>
  );
}
