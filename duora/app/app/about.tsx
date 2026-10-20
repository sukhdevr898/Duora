import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Application from 'expo-application';
import { Screen } from '../src/components/Screen';
import { DuoraTopBar } from '../src/components/DuoraTopBar';
import { DuoraLogo } from '../src/components/DuoraLogo';
import { SettingsRow } from '../src/components/SettingsRow';
import { useDuoraTheme } from '../src/theme/ThemeProvider';
import { config } from '../src/constants/config';
import { spacing, radii, typography } from '../src/theme/tokens';

function LegalModal({
  title,
  body,
  onClose,
}: {
  title: string;
  body: string;
  onClose: () => void;
}) {
  const { colors } = useDuoraTheme();
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderRadius: radii.xl }]}>
          <Text style={[typography.heading, { color: colors.text }]}>{title}</Text>
          <ScrollView style={{ marginVertical: spacing.lg }}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>{body}</Text>
          </ScrollView>
          <SettingsRow icon="close-outline" label="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const TERMS = `Duora is provided for private, lawful communication between two consenting adults. You are responsible for activity on your account and for keeping your credentials safe. The service is provided "as is" without warranty; availability depends on your own hosting and infrastructure.`;

const PRIVACY = `Duora stores your account, pairing, messages and call records on the server you configure. Passwords are hashed with bcrypt; refresh tokens are stored only as SHA-256 hashes. Push notifications travel through FCM and contain only the data your settings allow. You can unpair, log out or delete your account at any time. Duora does not include advertising or third-party analytics. End-to-end encryption is not claimed in this build: transport is protected by HTTPS/WSS, and server-side database encryption remains your hosting responsibility.`;

export default function AboutScreen() {
  const { colors } = useDuoraTheme();
  const [modal, setModal] = useState<'terms' | 'privacy' | null>(null);

  return (
    <Screen>
      <DuoraTopBar showBack title="About Duora" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl, alignItems: 'center' }}>
        <View style={{ marginVertical: spacing.xl }}>
          <DuoraLogo size={72} tagline />
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          Version {Application.nativeApplicationVersion ?? '1.0.0'} (build {Application.nativeBuildVersion ?? '1'})
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
          Environment: {config.env}
        </Text>

        <View style={[styles.list, { backgroundColor: colors.surface, borderRadius: radii.lg, alignSelf: 'stretch', marginTop: spacing.xl }]}>
          <SettingsRow icon="document-text-outline" label="Terms of service" onPress={() => setModal('terms')} />
          <SettingsRow icon="shield-checkmark-outline" label="Privacy policy" onPress={() => setModal('privacy')} />
        </View>
      </ScrollView>

      <LegalModal
        title={modal === 'terms' ? 'Terms of service' : 'Privacy policy'}
        body={modal === 'terms' ? TERMS : PRIVACY}
        onClose={() => setModal(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,5,14,0.6)' },
  modalCard: { padding: spacing.xl, maxHeight: '75%' },
  list: { overflow: 'hidden', paddingHorizontal: spacing.md },
});
