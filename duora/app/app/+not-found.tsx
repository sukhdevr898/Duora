import { Screen } from '../src/components/Screen';
import { EmptyState } from '../src/components/EmptyState';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { useRouter } from 'expo-router';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen showOfflineBanner={false}>
      <EmptyState
        icon="compass-outline"
        title="Screen not found"
        description="The page you opened does not exist in this version of Duora."
        action={<PrimaryButton label="Go home" onPress={() => router.replace('/(tabs)/home')} />}
      />
    </Screen>
  );
}
