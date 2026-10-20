import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Application from 'expo-application';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { DuoraTopBar } from '../../src/components/DuoraTopBar';
import { SettingsRow } from '../../src/components/SettingsRow';
import { ConfirmationDialog } from '../../src/components/ConfirmationDialog';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useSettingsStore } from '../../src/state/settings.store';
import { useNetworkStore } from '../../src/state/network.store';
import { useAuthStore } from '../../src/state/auth.store';
import { updateSettings as syncSettings, deleteAccount } from '../../src/features/settings/users.api';
import { logout as logoutApi } from '../../src/features/auth/auth.api';
import { deactivateSession, reconnectSocket } from '../../src/hooks/useBootstrap';
import { config } from '../../src/constants/config';
import { resetDatabase } from '../../src/database/sqlite';
import { spacing, radii, type ThemeMode } from '../../src/theme/tokens';

function SectionTitle({ children }: { children: string }) {
  const { colors, typography } = useDuoraTheme();
  return (
    <Text style={[typography.label, { color: colors.primary, marginTop: spacing.xl, marginBottom: spacing.xs }]}>
      {children}
    </Text>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, typography, mode } = useDuoraTheme();
  const settings = useSettingsStore();
  const socketState = useNetworkStore((s) => s.socketState);
  const lastConnectedAt = useNetworkStore((s) => s.lastConnectedAt);
  const refreshToken = useAuthStore((s) => s.tokens?.refreshToken);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const patch = async (partial: Parameters<typeof syncSettings>[0]) => {
    try {
      await syncSettings(partial);
    } catch {
      // Local preference still applies; server sync retries on next change.
    }
  };

  const themeOptions: Array<{ value: ThemeMode; label: string }> = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  const onLogout = async () => {
    try {
      if (refreshToken) await logoutApi(refreshToken);
    } catch {
      // Clear locally regardless of server reachability.
    }
    deactivateSession();
    useAuthStore.getState().clear();
    await resetDatabase();
    router.replace('/auth/login');
  };

  const onDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      deactivateSession();
      useAuthStore.getState().clear();
      await resetDatabase();
      router.replace('/auth/login');
    } catch (err) {
      Alert.alert('Could not delete account', err instanceof Error ? err.message : 'Try again later.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Screen>
      <DuoraTopBar title="Settings" showMenu />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <SectionTitle>Appearance</SectionTitle>
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg }]}>
          <View style={styles.themeRow}>
            {themeOptions.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: settings.theme === option.value }}
                onPress={() => {
                  settings.setTheme(option.value);
                  void patch({ theme: option.value });
                }}
                style={[
                  styles.themePill,
                  {
                    backgroundColor: settings.theme === option.value ? colors.primary : colors.elevated,
                    borderRadius: radii.pill,
                  },
                ]}
              >
                <Text
                  style={[
                    typography.bodyStrong,
                    { color: settings.theme === option.value ? '#1A1330' : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary, padding: spacing.md }]}>
            Current system scheme: {mode}
          </Text>
        </View>

        <SectionTitle>Notifications</SectionTitle>
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: spacing.md }]}>
          <SettingsRow
            icon="chatbubble-ellipses-outline"
            label="Message notifications"
            toggle={{
              value: settings.messageNotifications,
              onChange: (v) => {
                settings.patch({ messageNotifications: v });
                void patch({ messageNotifications: v });
              },
            }}
          />
          <SettingsRow
            icon="call-outline"
            label="Incoming call notifications"
            toggle={{
              value: settings.callNotifications,
              onChange: (v) => {
                settings.patch({ callNotifications: v });
                void patch({ callNotifications: v });
              },
            }}
          />
          <SettingsRow
            icon="volume-medium-outline"
            label="Vibration"
            toggle={{
              value: settings.vibration,
              onChange: (v) => {
                settings.patch({ vibration: v });
                void patch({ vibration: v });
              },
            }}
          />
          <SettingsRow
            icon="eye-off-outline"
            label="Hide message previews"
            toggle={{
              value: settings.hidePreview,
              onChange: (v) => {
                settings.patch({ hidePreview: v });
                void patch({ hidePreview: v });
              },
            }}
          />
        </View>

        <SectionTitle>Connection</SectionTitle>
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: spacing.md }]}>
          <SettingsRow icon="globe-outline" label="API server" value={config.env} onPress={() => router.push('/server-settings')} />
          <SettingsRow
            icon="pulse"
            label="WebSocket"
            value={socketState}
            onPress={() => void reconnectSocket()}
          />
          <SettingsRow
            icon="speedometer-outline"
            label="Low-data mode"
            toggle={{
              value: settings.lowData,
              onChange: (v) => {
                settings.patch({ lowData: v });
                void patch({ lowData: v });
              },
            }}
          />
          <SettingsRow
            icon="git-network-outline"
            label="Diagnostics"
            value={lastConnectedAt ? 'Available' : 'Limited'}
            onPress={() => router.push('/developer-info')}
          />
        </View>

        <SectionTitle>Privacy & account</SectionTitle>
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: spacing.md }]}>
          <SettingsRow icon="people-outline" label="Pairing" onPress={() => router.push('/pairing')} />
          <SettingsRow icon="person-outline" label="Profile" onPress={() => router.push('/profile')} />
          <SettingsRow icon="log-out-outline" label="Log out" onPress={onLogout} />
          <SettingsRow icon="trash-outline" label="Delete account" danger onPress={() => setConfirmDelete(true)} />
        </View>

        <SectionTitle>About</SectionTitle>
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg, paddingHorizontal: spacing.md }]}>
          <SettingsRow
            icon="information-circle-outline"
            label="About Duora"
            value={`v${Application.nativeApplicationVersion ?? '1.0.0'}`}
            onPress={() => router.push('/about')}
          />
          <SettingsRow icon="code-slash-outline" label="Developer info" onPress={() => router.push('/developer-info')} />
          <SettingsRow icon="server-outline" label="Server settings" onPress={() => router.push('/server-settings')} />
        </View>
      </ScrollView>

      <ConfirmationDialog
        visible={confirmDelete}
        title="Delete account?"
        message="This closes your account and revokes all sessions. Pairing and messages are removed per the server retention policy."
        confirmLabel="Delete forever"
        destructive
        loading={deleting}
        onConfirm={() => void onDeleteAccount()}
        onCancel={() => setConfirmDelete(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' },
  themeRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  themePill: { flex: 1, minHeight: 40, justifyContent: 'center', alignItems: 'center' },
});
