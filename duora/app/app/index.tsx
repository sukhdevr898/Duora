import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/state/auth.store';
import { useSettingsStore } from '../src/state/settings.store';
import { SplashScreenView } from './splash';

/** Startup router: onboarding → auth → main app, driven by persisted state. */
export default function Index() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const hasTokens = Boolean(useAuthStore((s) => s.tokens));
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);

  useEffect(() => {
    if (!hydrated) return;
    if (!hasOnboarded) {
      router.replace('/onboarding');
    } else if (!hasTokens) {
      router.replace('/auth/login');
    } else {
      router.replace('/(tabs)/home');
    }
  }, [hydrated, hasOnboarded, hasTokens, router]);

  return <SplashScreenView />;
}
