import { useCallback } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { DuoraTopBar } from '../../src/components/DuoraTopBar';
import { PartnerDashboardCard } from '../../src/components/PartnerDashboardCard';
import { PartnerNoteCard } from '../../src/components/PartnerNoteCard';
import { LoadingState } from '../../src/components/LoadingState';
import { ErrorState } from '../../src/components/ErrorState';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useHome } from '../../src/features/home/useHome';
import { useUpdateCheck } from '../../src/hooks/useUpdateCheck';
import { usePairingStore } from '../../src/state/pairing.store';
import { useNetworkStore } from '../../src/state/network.store';
import { spacing, radii } from '../../src/theme/tokens';
import { formatRelative } from '../../src/utils/formatters';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors, typography } = useDuoraTheme();
  const { pairing } = usePairingStore();
  const isConnected = useNetworkStore((s) => s.isConnected);
  const { conversations, cachedNote, loading, error, refresh } = useHome();
  const { state: updateState, dismissed, dismiss } = useUpdateCheck();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const conversationId = pairing.conversationId ?? conversations[0]?.id;
  const summary = conversations[0];
  const note = summary?.lastMessage ?? cachedNote;
  const partnerName = pairing.partner?.partnerNickname ?? pairing.partner?.displayName ?? 'Your partner';

  return (
    <Screen>
      <DuoraTopBar branding showMenu />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          {greeting()}
        </Text>

        {updateState.status === 'optional' && !dismissed ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void Linking.openURL(updateState.info.releaseUrl)}
            style={[styles.update, { backgroundColor: colors.elevated, borderRadius: radii.lg }]}
          >
            <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>
                Update available — v{updateState.info.latestVersion}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Tap to open the verified release page.</Text>
            </View>
            <Ionicons name="close" size={18} color={colors.textSecondary} onPress={dismiss} />
          </Pressable>
        ) : null}

        {updateState.status === 'required' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void Linking.openURL(updateState.info.releaseUrl)}
            style={[styles.update, { backgroundColor: colors.elevated, borderRadius: radii.lg, borderColor: colors.error, borderWidth: 1 }]}
          >
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.bodyStrong, { color: colors.text }]}>Update required to continue</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                This version is no longer supported.
              </Text>
            </View>
          </Pressable>
        ) : null}

        <PartnerDashboardCard />

        {pairing.status === 'ACTIVE' ? (
          <>
            <PartnerNoteCard
              partnerName={partnerName}
              partnerAvatar={pairing.partner?.avatarUrl}
              note={note}
              unread={(summary?.unreadCount ?? 0) > 0}
              offline={!isConnected}
              onPress={() =>
                conversationId &&
                router.push({ pathname: '/conversation/[conversationId]', params: { conversationId } })
              }
            />

            <View style={[styles.section, { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg }]}>
              <Text style={[typography.heading, { color: colors.text }]}>Recent</Text>
              {loading && !summary ? <LoadingState message="Loading recent activity…" /> : null}
              {error && !summary ? <ErrorState message={error} onRetry={() => void refresh()} /> : null}
              {summary?.lastMessage ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/conversation/[conversationId]',
                      params: { conversationId: summary.id },
                    })
                  }
                  style={styles.recentRow}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                  <Text numberOfLines={1} style={[typography.body, { color: colors.text, flex: 1, marginLeft: spacing.sm }]}>
                    {summary.lastMessage.deletedForAllAt ? 'Message deleted' : summary.lastMessage.text}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {formatRelative(summary.lastMessage.createdAt)}
                  </Text>
                </Pressable>
              ) : (
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                  No messages yet — say hello.
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                style={[styles.recentRow, { marginTop: spacing.md }]}
                onPress={() => router.push('/memories')}
              >
                <Ionicons name="bookmark-outline" size={18} color={colors.secondary} />
                <Text style={[typography.body, { color: colors.text, flex: 1, marginLeft: spacing.sm }]}>
                  Memories
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  update: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginVertical: spacing.sm },
  section: { marginTop: spacing.md },
  recentRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
});
