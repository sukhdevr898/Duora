import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { DuoraTopBar } from '../src/components/DuoraTopBar';
import { DuoraAvatar } from '../src/components/DuoraAvatar';
import { TextField } from '../src/components/TextField';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { useDuoraTheme } from '../src/theme/ThemeProvider';
import { useAuthStore } from '../src/state/auth.store';
import { updateProfile } from '../src/features/settings/users.api';
import { ApiClientError } from '../src/types/api';
import { spacing, typography } from '../src/theme/tokens';

export default function ProfileScreen() {
  const { colors } = useDuoraTheme();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [partnerNickname, setPartnerNickname] = useState(user?.partnerNickname ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    if (!displayName.trim()) {
      setMessage('Display name cannot be empty.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const { user: updated } = await updateProfile({
        displayName: displayName.trim(),
        partnerNickname: partnerNickname.trim() || null,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      setUser(updated);
      setMessage('Profile saved.');
    } catch (err) {
      setMessage(err instanceof ApiClientError ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <DuoraTopBar showBack title="Profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
        <View style={styles.header}>
          <DuoraAvatar name={displayName || 'You'} avatarUrl={avatarUrl || user?.avatarUrl} size={88} />
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            {user?.email}
          </Text>
        </View>

        <TextField label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
        <TextField
          label="Nickname for your partner"
          value={partnerNickname}
          onChangeText={setPartnerNickname}
          placeholder="Private nickname, visible only to you"
        />
        <TextField
          label="Avatar image URL"
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          placeholder="https://…"
          autoCapitalize="none"
          hint="Binary avatar upload is not part of this build; use a hosted image URL."
        />

        {message ? (
          <Text style={[typography.caption, { color: colors.success, marginBottom: spacing.md }]}>{message}</Text>
        ) : null}
        <PrimaryButton label="Save profile" icon="save-outline" loading={saving} onPress={() => void save()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginVertical: spacing.xl },
});
