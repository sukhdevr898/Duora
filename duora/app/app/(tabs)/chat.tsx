import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { DuoraTopBar } from '../../src/components/DuoraTopBar';
import { ConversationRow } from '../../src/components/ConversationRow';
import { EmptyState } from '../../src/components/EmptyState';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { listConversations } from '../../src/features/chat/chat.api';
import { usePairingStore } from '../../src/state/pairing.store';
import type { ConversationSummary } from '../../src/types/models';

export default function ChatListScreen() {
  const router = useRouter();
  const { colors } = useDuoraTheme();
  const pairing = usePairingStore((s) => s.pairing);
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (pairing.status !== 'ACTIVE') return;
    try {
      setItems(await listConversations());
    } catch {
      // Offline: the list simply stays empty; the OfflineBanner explains why.
    }
  }, [pairing.status]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen>
      <DuoraTopBar title="Chat" showMenu />
      {pairing.status !== 'ACTIVE' ? (
        <EmptyState
          icon="people-outline"
          title="No conversation yet"
          description="Pair with your partner to start your private conversation."
          action={<PrimaryButton label="Go to pairing" icon="heart" onPress={() => router.push('/pairing')} />}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          renderItem={({ item }) => (
            <ConversationRow conversation={item} onPress={(id) => router.push({ pathname: '/conversation/[conversationId]', params: { conversationId: id } })} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages yet"
              description="Your shared conversation will appear here."
              action={
                pairing.conversationId ? (
                  <PrimaryButton
                    label="Start chatting"
                    onPress={() =>
                      router.push({
                        pathname: '/conversation/[conversationId]',
                        params: { conversationId: pairing.conversationId! },
                      })
                    }
                  />
                ) : undefined
              }
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ list: { flexGrow: 1 } });
