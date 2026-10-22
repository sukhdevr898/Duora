import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CardSkeleton } from '../../src/components/Skeleton';
import { ErrorCard } from '../../src/components/Feedback';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Info,
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
import { PageBackground } from '../../src/components/PageBackground';
import { Chip, IconButton, PressableScale } from '../../src/components/ui';
import { Sheet } from '../../src/components/Overlay';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useStore } from '../../src/state/store';
import type { CallLogItem } from '../../src/api/types';

type Filter = 'All' | 'Voice' | 'Video' | 'Missed';
const FILTERS: Filter[] = ['All', 'Voice', 'Video', 'Missed'];

export default function CallsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();

  const calls = useStore((s) => s.calls);
  const home = useStore((s) => s.home);
  const loadCalls = useStore((s) => s.loadCalls);

  const [filter, setFilter] = useState<Filter>('All');
  const [selected, setSelected] = useState<CallLogItem | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [callsLoading, setCallsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const reloadCalls = useCallback(async () => {
    setCallsLoading(true);
    setLoadError(false);
    const loaded = await loadCalls();
    setLoadError(!loaded);
    setCallsLoading(false);
  }, [loadCalls]);

  useFocusEffect(
    useCallback(() => {
      void reloadCalls();
    }, [reloadCalls]),
  );

  const partner = home?.partner ?? null;
  const partnerName = partner?.nickname ?? partner?.displayName ?? 'Partner';
  const partnerStatus = partner?.online ? 'Online now' : home?.linked ? 'Presence unavailable' : home ? 'Not paired' : 'Status unavailable';

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
        <Text style={[styles.appbarTitle, { color: t.text }]}>Call logs</Text>
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
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('md')]}>
          <View style={styles.heroLeft}>
            <Avatar src={partner?.avatarUrl ?? null} size={54} ring online={partner?.online} alt={partnerName} />
            <View>
              <Text style={[styles.heroName, { color: t.text }]}>{partnerName}</Text>
              <View style={styles.heroStatus}>
                <View style={[styles.onlineDot, { backgroundColor: partner?.online ? t.mint : t.text3 }]} />
                <Text style={[styles.heroStatusText, { color: t.text2 }]}>{partnerStatus}</Text>
              </View>
            </View>
          </View>
          {home?.linked ? (
            <View style={styles.heroActions}>
              <PressableScale onPress={() => router.push('/call/audio')} accessibilityLabel="Start voice call request" style={[styles.heroBtn, { backgroundColor: t.primary }]}>
                <Phone size={19} strokeWidth={2.4} color="#fff" />
              </PressableScale>
              <PressableScale onPress={() => router.push('/call/video')} accessibilityLabel="Start video call request" style={[styles.heroBtn, { backgroundColor: t.pink }]}>
                <Video size={19} strokeWidth={2.4} color="#fff" />
              </PressableScale>
              <PressableScale onPress={() => router.push('/chat')} accessibilityLabel="Open chat" style={[styles.heroBtn, { backgroundColor: t.primarySoft }]}>
                <MessageCircle size={18} strokeWidth={2.4} color={t.primary} />
              </PressableScale>
            </View>
          ) : (
            <PressableScale onPress={() => router.push('/pairing')} accessibilityLabel="Pair before calling" style={[styles.pairBtn, { backgroundColor: t.primarySoft }]}>
              <Text style={[styles.pairBtnText, { color: t.primary }]}>Pair</Text>
            </PressableScale>
          )}
        </View>

        <View style={[styles.mediaNotice, { backgroundColor: t.primarySoft }]}>
          <Info size={14} strokeWidth={2.2} color={t.primary} />
          <Text style={[styles.mediaNoticeText, { color: t.text2 }]}>Call requests use signalling only; this build does not transmit audio or video.</Text>
        </View>

        <View style={[styles.stats, { backgroundColor: t.card }, shadow('sm')]}>
          <View style={styles.statCell}>
            <Phone size={13} strokeWidth={2.3} color={t.primary} />
            <Text style={[styles.statValue, { color: t.text }]}>{calls.length}</Text>
            <Text style={[styles.statLabel, { color: t.text3 }]}>requests</Text>
          </View>
          <View style={[styles.statCell, { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: t.line }]}>
            <PhoneIncoming size={13} strokeWidth={2.3} color={t.primary} />
            <Text style={[styles.statValue, { color: t.text }]}>{calls.filter((call) => !call.missed).length}</Text>
            <Text style={[styles.statLabel, { color: t.text3 }]}>accepted</Text>
          </View>
          <View style={[styles.statCell, { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: t.line }]}>
            <PhoneMissed size={13} strokeWidth={2.3} color={t.danger} />
            <Text style={[styles.statValue, { color: t.text }]}>{calls.filter((call) => call.missed).length}</Text>
            <Text style={[styles.statLabel, { color: t.text3 }]}>missed</Text>
          </View>
        </View>

        {loadError && calls.length > 0 ? (
          <View style={styles.loadWarning}>
            <ErrorCard error={{ kind: 'offline', title: 'Could not refresh call history', message: 'Showing the history already on this device.', action: 'Retry' }} onRetry={() => void reloadCalls()} />
          </View>
        ) : null}

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

        {callsLoading && list.length === 0 ? (
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
                    {call.missed ? 'No answer' : 'Request'}
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

          {list.length === 0 && !callsLoading ? loadError && calls.length === 0 ? (
            <ErrorCard error={{ kind: 'offline', title: 'Call history unavailable', message: 'We could not load your call history. Check the connection and try again.', action: 'Retry' }} onRetry={() => void reloadCalls()} />
          ) : (
            <View style={styles.empty}>
              <View style={styles.emptyArt}>
                {filter === 'Missed' ? <PhoneMissed size={54} strokeWidth={1.4} color={t.primarySoft} /> : <PhoneIncoming size={54} strokeWidth={1.4} color={t.primarySoft} />}
              </View>
              <Text style={[styles.emptyTitle, { color: t.text }]}>{filter === 'All' ? 'No calls yet' : `No ${filter.toLowerCase()} calls`}</Text>
              <Text style={[styles.emptySub, { color: t.text2 }]}>Call history from your account will appear here.</Text>
            </View>
          ) : null}

          {list.length > 0 ? <Text style={[styles.footNote, { color: t.text3 }]}>Call history from your account</Text> : null}
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
            accessibilityLabel="Voice request"
            style={[styles.sheetRow, { backgroundColor: t.surfaceSoft }]}
          >
            <Phone size={16} strokeWidth={2.2} color={t.primaryDeep} />
            <Text style={[styles.sheetRowText, { color: t.text }]}>Voice request</Text>
          </PressableScale>
          <PressableScale
            onPress={() => {
              setSelected(null);
              router.push('/call/video');
            }}
            accessibilityLabel="Video request"
            style={[styles.sheetRow, { backgroundColor: t.surfaceSoft }]}
          >
            <Video size={16} strokeWidth={2.2} color={t.primaryDeep} />
            <Text style={[styles.sheetRowText, { color: t.text }]}>Video request</Text>
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
  loadWarning: { marginHorizontal: 18, marginTop: 8 },
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
  pairBtn: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 99 },
  pairBtnText: { fontSize: 11, fontWeight: '800' },
  heroBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginTop: 10, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14 },
  mediaNoticeText: { flex: 1, fontSize: 10.5, lineHeight: 14, fontWeight: '600' },
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
