import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useDuoraTheme } from '../src/theme/ThemeProvider';
import { bootstrapApp } from '../src/hooks/useBootstrap';
import { useAppStateRefresh } from '../src/hooks/useAppState';
import { getDatabase } from '../src/database/sqlite';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function ThemedStack() {
  const { colors, mode } = useDuoraTheme();
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="pairing" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="conversation/[conversationId]" />
        <Stack.Screen name="call/incoming" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="call/audio" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="call/video" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useAppStateRefresh();

  useEffect(() => {
    let mounted = true;
    // Local persistence first; server checks inside bootstrap are best-effort.
    void (async () => {
      await getDatabase();
      await bootstrapApp(router);
      if (!mounted) return;
      setReady(true);
      await SplashScreen.hideAsync().catch(() => undefined);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          {ready ? <ThemedStack /> : null}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
