import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { DuoraTopBar } from '../src/components/DuoraTopBar';
import { EmptyState } from '../src/components/EmptyState';
import { IconButton } from '../src/components/IconButton';
import { useDuoraTheme } from '../src/theme/ThemeProvider';
import { deleteMemory, listMemories, type Memory } from '../src/repositories/memories.repository';
import { formatDateSeparator, formatTime } from '../src/utils/formatters';
import { spacing, radii, typography } from '../src/theme/tokens';

export default function MemoriesScreen() {
  const router = useRouter();
  const { colors } = useDuoraTheme();
  const [memories, setMemories] = useState<Memory[]>([]);

  const load = useCallback(async () => {
    setMemories(await listMemories());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const confirmDelete = (memory: Memory) => {
    Alert.alert('Remove memory?', 'This only removes it from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteMemory(memory.id);
          await load();
        },
      },
    ]);
  };

  return (
    <Screen>
      <DuoraTopBar showBack title="Memories" />
      <FlatList
        data={memories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: spacing.xxxl, flexGrow: 1 }}
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title="No memories yet"
            description="Long-press any message in your conversation and choose “Save as memory”."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/conversation/[conversationId]',
                params: { conversationId: item.conversationId },
              })
            }
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderRadius: radii.lg, borderColor: colors.border },
            ]}
          >
            <Ionicons name="bookmark" size={18} color={colors.secondary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.body, { color: colors.text }]} numberOfLines={4}>
                {item.text}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                {formatDateSeparator(item.createdAt)} · {formatTime(item.createdAt)}
              </Text>
            </View>
            <IconButton name="trash-outline" label="Remove memory" size={18} onPress={() => confirmDelete(item)} />
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
});
