import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CardSkeleton } from '../../src/components/Skeleton';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  Heart,
  MessageCircle,
  MoreVertical,
  Phone,
  PhoneIncoming,
  PhoneMissed,
  Search,
  Video,
  X,
} from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { ConnectionPill } from '../../src/components/ConnectionPill';
import { PageBackground } from '../../src/components/PageBackground';
import { Chip, IconButton, PressableScale } from '../../src/components/ui';
import { Sheet, useToast } from '../../src/components/Overlay';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useStore } from '../../src/state/store';
import type { CallLogItem } from '../../src/api/types';

type Filter = 'All' | 'Voice' | 'Video' | 'Missed';
const FILTERS: Filter[] = ['All', 'Voice', 'Video', 'Missed'];

export default function CallsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();
  const { toast } = useToast();

  const calls = useStore((s) => s.calls);
  const dataLoading = useStore((s) => s.dataLoading);
  const home = useStore((s) => s.home);
  const loadCalls = useStore((s) => s.loadCalls);

  const [filter, setFilter] = useState<Filter>('All');
  const [selected, setSelected] = useState<CallLogItem | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      void loadCalls();
    }, [loadCalls]),
  );

  const partner = home?.partner ?? null;
  const partnerName = partner?.nickname ?? partner?.displayName ?? 'your person';

  const list = useMemo(() => {
    const base =
      filter === 'All'
        ? calls
        : filter === 'Missed'
          ? calls.filter((c) => c.missed)
          : calls.filter((c) => c.kind === filter.toLowerCase());
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (c) => partnerName.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || c.day.toLowerCase().includes(q),
    );
  }, [calls, filter, query, partnerName]);

  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.appbar, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.appbarTitle, { color: t.text }]}>Calls</Text>
        <View style={styles.appbarActions}>
          <IconButton
            icon={searching ? X : Search}
            variant={searching ? 'soft' : 'ghost'}
            size={36}
            accessibilityLabel={searching ? 'Close search' : 'Search calls'}
            onPress={() => {
              setSearching((v) => !v);
              setQuery('');
            }}
          />
          <ConnectionPill compact />
          <IconButton
            icon={MoreVertical}
            size={36}
            accessibilityLabel="More call options"
            onPress={() => toast('Clear call history')}
          />
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('md')]}>
          <View style={styles.heroLeft}>
            <Avatar src={partner?.avatarUrl ?? null} size={54} ring online={partner?.online} alt={partnerName} />
            <View>
              <Text style={[styles.heroName, { color: t.text }]}>{partnerName}</Text>
              <View style={styles.heroStatus}>
                <View style={[styles.onlineDot, { backgroundColor: t.mint }]} />
                <Text style={[styles.heroStatusText, { color: t.text2 }]}>Ready to talk</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroActions}>
            <PressableScale
              onPress={() => router.push('/call/audio')}
              accessibilityLabel="Start voice call"
              style={[styles.heroBtn, { backgroundColor: t.primary }]}
            >
              <Phone size={19} strokeWidth={2.4} color="#fff" />
            </PressableScale>
            <PressableScale
              onPress={() => router.push('/call/video')}
              accessibilityLabel="Start video call"
              style={[styles.heroBtn, { backgroundColor: t.pink }]}
            >
              <Video size={19} strokeWidth={2.4} color="#fff" />
            </PressableScale>
            <PressableScale
              onPress={() => toast('Opening chat…')}
              accessibilityLabel="Send a message"
              style={[styles.heroBtn, { backgroundColor: t.primarySoft }]}
            >
              <MessageCircle size={18} strokeWidth={2.4} color={t.primary} />
            </PressableScale>
          </View>
        </View>

        <View style={[styles.stats, { backgroundColor: t.card }, shadow('sm')]}>
          <View style={styles.statCell}>
            <Clock3 size={13} strokeWidth={2.3} color={t.primary} />
            <Text style={[styles.statValue, { color: t.text }]}>{home?.loveStats.callsThisWeek ?? '0m'}</Text>
            <Text style={[styles.statLabel, { color: t.text3 }]}>this week</Text>
          </View>
          <View style={[styles.statCell, { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: t.line }]}>
            <Phone size={13} strokeWidth={2.3} color={t.primary} />
            <Text style={[styles.statValue, { color: t.text }]}>{calls.length}</Text>
            <Text style={[styles.statLabel, { color: t.text3 }]}>calls</Text>
          </View>
          <View style={[styles.statCell, { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: t.line }]}>
            <Heart size={13} strokeWidth={2.3} color={t.primary} />
            <Text style={[styles.statValue, { color: t.text }]}>
              {calls.length ? `${Math.round((calls.filter((c) => !c.missed).length / calls.length) * 100)}%` : '0%'}
            </Text>
            <Text style={[styles.statLabel, { color: t.text3 }]}>connected</Text>
          </View>
        </View>

        {searching ? (
          <View style={styles.searchWrap}>
            <View style={[styles.searchbar, { backgroundColor: t.chipBg, borderColor: t.line }]}>
              <Search size={16} strokeWidth={2.2} color={t.text3} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search call history…"
                placeholderTextColor={t.text3}
                style={[styles.searchInput, { color: t.text }]}
                accessibilityLabel="Search call history"
              />
            </View>
          </View>
        ) : null}

        <View style={styles.chipsRow}>
          {FILTERS.map((f) => (
            <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
          ))}
        </View>

        {dataLoading && list.length === 0 ? (
          <View style={styles.list}>
            <CardSkeleton count={3} height={72} />
          </View>
        ) : null}

        <View style={styles.list}>
          {list.map((call) => (
            <PressableScale
              key={call.id}
              onPress={() => router.push(call.kind === 'video' ? '/call/video' : '/call/audio')}
              accessibilityLabel={`${call.type} ${call.day}`}
              style={styles.rowWrap}
            >
              <View style={[styles.row, { backgroundColor: t.card }]}>
                <Avatar src={partner?.avatarUrl ?? null} size={42} alt={partnerName} />
                <View style={styles.rowBody}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.rowName, { color: t.text }]}>{partnerName}</Text>
                    <View style={styles.rowDir}>
                      {call.kind === 'video' ? (
                        <Video size={13} strokeWidth={2.4} color={t.primary2} />
                      ) : call.type === 'Incoming Call' ? (
                        <ArrowDownLeft size={13} strokeWidth={2.6} color={t.primary2} />
                      ) : call.missed ? (
                        <PhoneMissed size={13} strokeWidth={2.6} color="#ef4444" />
                      ) : (
                        <ArrowUpRight size={13} strokeWidth={2.6} color={t.primary2} />
                      )}
                    </View>
                  </View>
                  <Text style={[styles.rowType, { color: call.missed ? '#ef4444' : t.text2 }]}>{call.type}</Text>
                  <Text style={[styles.rowDay, { color: t.text3 }]}>{call.day}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={[styles.rowTime, { color: call.missed ? '#ef4444' : t.text3 }]}>
                    {call.duration ?? (call.missed ? 'Missed' : '—')}
                  </Text>
                  <PressableScale
                    onPress={() => setSelected(call)}
                    accessibilityLabel="Call options"
                    style={styles.rowMore}
                  >
                    <MoreVertical size={16} strokeWidth={2.2} color={t.text3} />
                  </PressableScale>
                </View>
              </View>
            </PressableScale>
          ))}

          {list.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyArt}>
                {filter === 'Missed' ? (
                  <PhoneMissed size={54} strokeWidth={1.4} color="#c9bee6" />
                ) : (
                  <PhoneIncoming size={54} strokeWidth={1.4} color="#c9bee6" />
                )}
              </View>
              <Text style={[styles.emptyTitle, { color: t.text }]}>No {filter.toLowerCase()} calls</Text>
              <Text style={[styles.emptySub, { color: t.text2 }]}>
                Every call with {partnerName} will show up here.
              </Text>
            </View>
          ) : null}

          <Text style={[styles.footNote, { color: t.text3 }]}>
            Call history is private to your space
          </Text>
        </View>
      </ScrollView>

      <Sheet
        visible={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Call with ${partnerName}`}
        subtitle={selected ? `${selected.type} · ${selected.day}` : undefined}
      >
        <View style={{ gap: 8 }}>
          <PressableScale
            onPress={() => {
              setSelected(null);
              router.push('/call/audio');
            }}
            accessibilityLabel="Call back"
            style={[styles.sheetRow, { backgroundColor: t.surfaceSoft }]}
          >
            <Phone size={16} strokeWidth={2.2} color={t.primaryDeep} />
            <Text style={[styles.sheetRowText, { color: t.text }]}>Call back</Text>
          </PressableScale>
          <PressableScale
            onPress={() => {
              setSelected(null);
              router.push('/call/video');
            }}
            accessibilityLabel="Video call"
            style={[styles.sheetRow, { backgroundColor: t.surfaceSoft }]}
          >
            <Video size={16} strokeWidth={2.2} color={t.primaryDeep} />
            <Text style={[styles.sheetRowText, { color: t.text }]}>Video call</Text>
          </PressableScale>
          <PressableScale
            onPress={() => {
              setSelected(null);
              toast('Removed from history');
            }}
            accessibilityLabel="Remove from history"
            style={[styles.sheetRow, { backgroundColor: '#fdeef1' }]}
          >
            <PhoneMissed size={16} strokeWidth={2.2} color="#e5484d" />
            <Text style={[styles.sheetRowText, { color: '#e5484d' }]}>Remove from history</Text>
          </PressableScale>
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  appbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  appbarTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.9, flex: 1 },
  appbarActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scroll: { flex: 1 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 2,
    padding: 14,
    paddingHorizontal: 15,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  heroName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  heroStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  heroStatusText: { fontSize: 10.5, fontWeight: '700' },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  heroActions: { flexDirection: 'row', gap: 8 },
  heroBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 22,
    overflow: 'hidden',
  },
  statCell: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 12 },
  statValue: { fontSize: 14.5, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { fontSize: 9.5, fontWeight: '600', letterSpacing: 0.2 },
  searchWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  searchbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 14 },
  list: { paddingHorizontal: 18, paddingBottom: 24, gap: 9 },
  rowWrap: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowName: { fontSize: 14.5, fontWeight: '800', letterSpacing: -0.2 },
  rowDir: { marginLeft: 2 },
  rowType: { fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  rowDay: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTime: { fontSize: 11, fontWeight: '700' },
  rowMore: { width: 28, height: 30, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 30 },
  emptyArt: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, marginBottom: 6 },
  emptySub: { fontSize: 13, textAlign: 'center' },
  footNote: { textAlign: 'center', fontSize: 11, fontWeight: '600', paddingTop: 10 },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
  },
  sheetRowText: { fontSize: 13.5, fontWeight: '700' },
});
