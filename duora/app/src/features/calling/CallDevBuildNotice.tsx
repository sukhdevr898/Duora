import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../../theme/ThemeProvider';
import { PrimaryButton } from '../../components/PrimaryButton';
import { getExecutionRuntime } from './runtime';
import { spacing } from '../../theme/tokens';

/** Honest fallback shown inside Expo Go where native WebRTC cannot load. */
export function CallDevBuildNotice({ onBack }: { onBack: () => void }) {
  const { colors, typography } = useDuoraTheme();
  return (
    <View style={styles.wrap}>
      <Ionicons name="construct-outline" size={44} color={colors.warning} />
      <Text style={[typography.title, { color: colors.text, marginTop: spacing.lg, textAlign: 'center' }]}>
        Calls need a development build
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
        You are running {getExecutionRuntime() === 'expo-go' ? 'Expo Go' : 'a build without native WebRTC'}. Real
        audio and video calling uses react-native-webrtc, native foreground services and picture-in-picture, which
        Expo Go cannot host. See docs/android-build.md for the development-build workflow.
      </Text>
      <View style={{ alignSelf: 'stretch', marginTop: spacing.xl }}>
        <PrimaryButton label="Back" variant="ghost" onPress={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
});
