import { useEffect, useMemo, useState } from 'react';
import { AppState, View, type AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
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
import { SplashScreen as DuoraSplash } from '../src/components/Splash';
import { IncomingCallOverlay } from '../src/components/IncomingCall';
import { useStore, installSessionGuard } from '../src/state/store';
import { usePrivacy } from '../src/state/privacy';

// Keep the native splash up until our own splash has been drawn.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsReady] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    GreatVibes_400Regular,
  });

  const privacyReady = usePrivacy((s) => s.ready);
  const hydratePrivacy = usePrivacy((s) => s.hydrate);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    installSessionGuard();
    void hydratePrivacy();
    void useStore.getState().bootstrap();
  }, [hydratePrivacy]);

  // Hold the native splash for a beat so the animation is not a flash.
  useEffect(() => {
    if (!fontsReady || !privacyReady) return;
    const timer = setTimeout(() => {
      setBooting(false);
      void SplashScreen.hideAsync();
    }, 1100);
    return () => clearTimeout(timer);
  }, [fontsReady, privacyReady]);

  if (!fontsReady) return <View style={{ flex: 1 }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemedRoot booting={booting} />
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
 *
 * When the app is in the background the heartbeat and the realtime socket
 * are paused — no point burning the battery on a phone that is in a pocket.
 */
function ServerHeartbeat() {
  const status = useStore((s) => s.server.status);
  const autoReconnect = useStore((s) => s.server.autoReconnect);
  const connectRealtime = useStore((s) => s.connectRealtime);
  const authStatus = useStore((s) => s.authStatus);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const foreground = next === 'active';
      setActive(foreground);
      if (foreground) {
        void useStore.getState().checkServer();
        if (useStore.getState().authStatus === 'authenticated') {
          useStore.getState().connectRealtime();
        }
      } else {
        useStore.getState().disconnectRealtime();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!autoReconnect || !active) return;
    const interval = setInterval(
      () => {
        if (useStore.getState().server.status !== 'online') {
          void useStore.getState().checkServer();
        }
      },
      status === 'online' ? 30_000 : 8_000,
    );
    return () => clearInterval(interval);
  }, [autoReconnect, active, status]);

  useEffect(() => {
    if (authStatus === 'authenticated' && active) connectRealtime();
  }, [authStatus, active, connectRealtime]);

  return null;
}

function ThemedRoot({ booting }: { booting: boolean }) {
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

  // A stable controller keeps the theme context (and therefore the whole
  // tree of themed views) from re-rendering on every parent render.
  const controller = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  return (
    <ThemeProvider controller={controller}>
      <AppShell booting={booting} />
    </ThemeProvider>
  );
}

function AppShell({ booting }: { booting: boolean }) {
  const { mode, t } = useDuoraTheme();
  const privacyIcon = usePrivacy((s) => s.icon);

  return (
    <ToastProvider>
      <View style={{ flex: 1 }}>
        {/* The splash lives inside the theme provider so it can follow the
            light/dark choice, and it covers the whole app while it plays. */}
        <DuoraSplash visible={booting} icon={privacyIcon} />
        <ServerHeartbeat />
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: t.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="privacy-icon" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="pairing/index" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="pairing/scan" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="call/audio" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="call/video" options={{ animation: 'slide_from_bottom' }} />
          </Stack>
        </View>
        <IncomingCallOverlay />
      </View>
    </ToastProvider>
  );
}
