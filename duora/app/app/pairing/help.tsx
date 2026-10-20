import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { DuoraTopBar } from '../../src/components/DuoraTopBar';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { spacing } from '../../src/theme/tokens';

const STEPS = [
  ['1. Create an invitation', 'One of you generates a short-lived code and QR. The invitation expires in minutes and can only be used once.'],
  ['2. Share or scan', 'The other person enters the DUO-XXXXXX code or scans the QR with Duora’s camera.'],
  ['3. Confirm', 'Duora shows who invited you. Pairing only completes after you confirm and the server authorizes it.'],
  ['4. That’s it', 'Your private conversation, calls and shared space open automatically on both devices.'],
];

export default function PairingHelpScreen() {
  const { colors, typography, radii } = useDuoraTheme();
  return (
    <Screen>
      <DuoraTopBar showBack title="Pairing help" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl, gap: spacing.md }}>
        {STEPS.map(([title, body]) => (
          <View
            key={title}
            style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg }]}
          >
            <Text style={[typography.bodyStrong, { color: colors.text }]}>{title}</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>{body}</Text>
          </View>
        ))}
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          Lost the code? Generate a new one — older invitations are revoked automatically. If you pair with someone
          new, your previous pairing ends first.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({ card: {} });
