import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { PrimaryButton } from './PrimaryButton';
import { registerDevicePushToken } from '../features/notifications/notifications.service';

export function NotificationPermissionCard() {
  const { colors, spacing, radii, typography } = useDuoraTheme();
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    void Notifications.getPermissionsAsync().then((p) => setGranted(p.granted));
  }, []);

  if (granted) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.elevated, borderRadius: radii.lg, padding: spacing.lg }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Ionicons name="notifications-outline" size={20} color={colors.primary} />
        <Text style={[typography.bodyStrong, { color: colors.text }]}>Enable notifications</Text>
      </View>
      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>
        Get alerts for new messages and incoming calls, even when Duora is in the background.
      </Text>
      <View style={{ marginTop: spacing.md }}>
        <PrimaryButton
          label="Allow notifications"
          icon="notifications"
          fullWidth={false}
          onPress={async () => {
            const result = await Notifications.requestPermissionsAsync();
            setGranted(result.granted);
            if (result.granted) await registerDevicePushToken();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ card: { marginVertical: 8 } });
