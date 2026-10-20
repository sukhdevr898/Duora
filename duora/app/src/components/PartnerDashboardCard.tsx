import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDuoraTheme } from '../theme/ThemeProvider';
import { DuoraAvatar } from './DuoraAvatar';
import { ConnectionStatusChip } from './ConnectionStatusChip';
import { CallActionButton } from './CallActionButton';
import { usePairingStore } from '../state/pairing.store';
import { formatLastSeen } from '../utils/formatters';
import { isExpoGo } from '../features/calling/runtime';

export function PartnerDashboardCard() {
  const { colors, spacing, radii, typography } = useDuoraTheme();
  const router = useRouter();
  const { pairing, presence } = usePairingStore();

  if (pairing.status !== 'ACTIVE' || !pairing.partner) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl }]}>
        <Ionicons name="heart-circle-outline" size={36} color={colors.primary} />
        <Text style={[typography.heading, { color: colors.text, marginTop: spacing.md }]}>
          You haven’t paired yet
        </Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          Pair with your partner to unlock calls, chat and shared memories.
        </Text>
        <View style={{ marginTop: spacing.lg }}>
          <Text
            accessibilityRole="button"
            onPress={() => router.push('/pairing')}
            style={[typography.bodyStrong, { color: colors.primary }]}
          >
            Go to pairing →
          </Text>
        </View>
      </View>
    );
  }

  const partner = pairing.partner;
  const displayName = partner.partnerNickname ?? partner.displayName;
  const online = Boolean(presence?.online);

  const startCall = (type: 'AUDIO' | 'VIDEO') => {
    if (isExpoGo()) {
      router.push('/call/audio');
      return;
    }
    if (type === 'VIDEO') router.push('/call/video');
    else router.push('/call/audio');
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg }]}>
      <View style={styles.header}>
        <DuoraAvatar name={displayName} avatarUrl={partner.avatarUrl} size={68} showPresence online={online} />
        <View style={{ flex: 1, marginLeft: spacing.lg }}>
          <Text style={[typography.title, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          {partner.partnerNickname ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>{partner.displayName}</Text>
          ) : null}
          <View style={{ marginTop: spacing.sm }}>
            <ConnectionStatusChip />
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            {formatLastSeen(presence?.lastSeenAt, online)}
          </Text>
        </View>
      </View>

      <View style={[styles.actions, { marginTop: spacing.lg }]}>
        <CallActionButton icon="call" label="Audio" onPress={() => startCall('AUDIO')} />
        <CallActionButton icon="videocam" label="Video" onPress={() => startCall('VIDEO')} />
        <CallActionButton
          icon="chatbubble-ellipses"
          label="Chat"
          onPress={() =>
            pairing.conversationId &&
            router.push({
              pathname: '/conversation/[conversationId]',
              params: { conversationId: pairing.conversationId },
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: 8 },
  header: { flexDirection: 'row', alignItems: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-around' },
});
