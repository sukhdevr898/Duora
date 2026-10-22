import { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CardSkeleton } from '../../src/components/Skeleton';
import { ErrorCard } from '../../src/components/Feedback';
import { RichText } from '../../src/components/RichText';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarDays, Heart, Plus, Search, Sparkles, X } from 'lucide-react-native';
import { ConnectionPill } from '../../src/components/ConnectionPill';
import { PageBackground } from '../../src/components/PageBackground';
import { Btn, Chip, IconButton, PressableScale } from '../../src/components/ui';
import { Sheet, useToast } from '../../src/components/Overlay';
import { Sticker } from '../../src/components/Sticker';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useStore } from '../../src/state/store';
import type { NoteItem } from '../../src/api/types';
import { resolveMediaUrl } from '../../src/api/client';

const MOODS = ['heart-pink', 'heart-violet', 'heart-lilac', 'heart-peach', 'heart-mint'];

export default function NotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();
  const { toast } = useToast();

  const notes = useStore((s) => s.notes);
  const loadNotes = useStore((s) => s.loadNotes);
  const createNote = useStore((s) => s.createNote);

  const [active, setActive] = useState<NoteItem | null>(null);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'All' | 'Plans' | 'Days'>('All');
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState(MOODS[0]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const reloadNotes = useCallback(async () => {
    setLoadingNotes(true);
    setLoadError(false);
    const loaded = await loadNotes();
    setLoadError(!loaded);
    setLoadingNotes(false);
  }, [loadNotes]);

  useFocusEffect(
    useCallback(() => {
      void reloadNotes();
    }, [reloadNotes]),
  );

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      const lower = n.title.toLowerCase();
      const matchCategory =
        category === 'All'
          ? true
          : category === 'Plans'
            ? lower.includes('future') || lower.includes('plan')
            : lower.includes('special') || lower.includes('first') || lower.includes('love');
      const matchQuery =
        !query.trim() ||
        lower.includes(query.toLowerCase()) ||
        n.lines.join(' ').toLowerCase().includes(query.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [notes, category, query]);

  const save = async () => {
    if (!title.trim()) {
      toast('Give your memory a title');
      return;
    }
    const saved = await createNote({
      title: title.trim(),
      body: body
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join('\n'),
      category: category === 'All' ? 'ALL' : category === 'Plans' ? 'PLAN' : 'DAYS',
      mood,
    });
    if (!saved) {
      toast('Could not save this memory. Check your connection and try again.', 'error');
      return;
    }
    setTitle('');
    setBody('');
    setAdding(false);
    toast('Memory saved', 'success');
  };

  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.appbar, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.appbarTitle, { color: t.text }]}>Notes</Text>
        <View style={styles.appbarActions}>
          <ConnectionPill compact />
          <IconButton
            icon={searching ? X : Search}
            variant={searching ? 'soft' : 'ghost'}
            size={36}
            accessibilityLabel={searching ? 'Close search' : 'Search notes'}
            onPress={() => {
              setSearching((v) => !v);
              setQuery('');
            }}
          />
          <PressableScale
            onPress={() => setAdding(true)}
            accessibilityLabel="New note"
            style={[styles.fab, { backgroundColor: t.primary }]}
          >
            <Plus size={21} strokeWidth={2.6} color="#fff" />
          </PressableScale>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <PressableScale onPress={() => setAdding(true)} accessibilityLabel="Add a memory" style={styles.addBanner}>
          <LinearGradient colors={[t.primary, t.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.addBannerIcon}><Plus size={18} strokeWidth={2.8} color={t.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addBannerTitle}>Add a memory</Text>
            <Text style={styles.addBannerSub}>Save a little piece of your story</Text>
          </View>
          <Plus size={19} strokeWidth={2.5} color="#fff" />
        </PressableScale>

        {loadError && notes.length > 0 ? (
          <View style={styles.loadWarning}>
            <ErrorCard error={{ kind: 'offline', title: 'Could not refresh memories', message: 'Showing the memories already saved on this device.', action: 'Retry' }} onRetry={() => void reloadNotes()} />
          </View>
        ) : null}
        {searching ? (
          <View style={styles.searchWrap}>
            <View style={[styles.searchbar, { backgroundColor: t.chipBg, borderColor: t.line }]}>
              <Search size={16} strokeWidth={2.2} color={t.text3} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search memories…"
                placeholderTextColor={t.text3}
                style={[styles.searchInput, { color: t.text }]}
                accessibilityLabel="Search notes"
              />
            </View>
          </View>
        ) : null}

        <View style={styles.chipsRow}>
          {(['All', 'Plans', 'Days'] as const).map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>

        {loadingNotes && filtered.length === 0 ? (
          <View style={styles.list}>
            <CardSkeleton count={3} height={92} />
          </View>
        ) : null}

        <View style={styles.list}>
          {filtered.length === 0 && !loadingNotes ? loadError && notes.length === 0 ? (
            <ErrorCard error={{ kind: 'offline', title: 'Memories unavailable', message: 'We could not load your notes. Check the connection and try again.', action: 'Retry' }} onRetry={() => void reloadNotes()} />
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: t.card, borderColor: t.line }]}>
              <Heart size={22} color={t.primary} strokeWidth={2} />
              <Text style={[styles.emptyTitle, { color: t.text }]}>{query.trim() ? 'No matching memories' : 'No memories here yet'}</Text>
              <Text style={[styles.emptyText, { color: t.text3 }]}>{query.trim() ? 'Try another search term.' : 'Add the first note to your Duora account.'}</Text>
            </View>
          ) : null}
          {filtered.map((note) => (
            <PressableScale
              key={note.id}
              onPress={() => setActive(note)}
              accessibilityLabel={note.title}
              style={styles.cardWrap}
            >
              <View style={[styles.card, { backgroundColor: t.card }, shadow('sm')]}>
                <View style={[styles.thumb, { backgroundColor: t.primarySoft }]}>
                  {note.image ? <Image source={{ uri: resolveMediaUrl(note.image) }} style={styles.thumbImg} /> : null}
                </View>
                <View style={styles.cardBody}>
                  <RichText text={note.title} size={14} color={t.text} style={styles.cardTitle} />
                  {note.lines.map((line) => (
                    <Text key={line} style={[styles.cardLine, { color: t.text2 }]}>
                      {line}
                    </Text>
                  ))}
                  <Text style={[styles.cardDate, { color: t.text3 }]}>{note.date}</Text>
                </View>
              </View>
            </PressableScale>
          ))}

          <PressableScale
            onPress={() => router.push('/chat')}
            accessibilityLabel="Talk about a memory"
            style={[styles.writeTogether, { backgroundColor: t.primaryGhost, borderColor: t.primaryGhost }]}
          >
            <Sparkles size={15} strokeWidth={2.2} color={t.primary} />
            <Text style={[styles.writeTogetherText, { color: t.primary }]}>Talk about a memory</Text>
          </PressableScale>
        </View>
      </ScrollView>

      <Sheet
        visible={Boolean(active)}
        onClose={() => setActive(null)}
        title={active?.title}
        subtitle={active ? `${active.date} · saved to your account` : undefined}
      >
        {active ? (
          <View>
            {active.image ? (
              <View style={[styles.detailImage, { backgroundColor: t.primarySoft }, shadow('md')]}>
                <Image source={{ uri: resolveMediaUrl(active.image) }} style={styles.detailImageImg} />
              </View>
            ) : null}
            <View style={{ gap: 8 }}>
              {active.lines.map((line) => (
                <View key={line} style={styles.detailLine}>
                  <Heart size={13} strokeWidth={2.6} color={t.primary} fill={t.primarySoft} />
                  <Text style={[styles.detailLineText, { color: t.text }]}>{line}</Text>
                </View>
              ))}
            </View>

          </View>
        ) : null}
      </Sheet>

      <Sheet
        visible={adding}
        onClose={() => setAdding(false)}
        title="New memory"
        subtitle="A note saved to your Duora account."
      >
        <View style={{ gap: 12 }}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title, like “Our first call”"
            placeholderTextColor={t.text3}
            style={[styles.input, { backgroundColor: t.fieldBg, color: t.text, borderColor: t.lineStrong }]}
            accessibilityLabel="Note title"
          />
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={'One thought per line...\nYour voice\nYour laugh\nYour care'}
            placeholderTextColor={t.text3}
            multiline
            style={[
              styles.input,
              styles.textarea,
              { backgroundColor: t.fieldBg, color: t.text, borderColor: t.lineStrong },
            ]}
            accessibilityLabel="Note body"
          />
          <View style={styles.moodRow}>
            <Text style={[styles.moodLabel, { color: t.text3 }]}>Mood</Text>
            {MOODS.map((m) => (
              <PressableScale
                key={m}
                onPress={() => setMood(m)}
                accessibilityLabel={`Mood ${m}`}
                style={[
                  styles.moodBtn,
                  {
                    backgroundColor: mood === m ? t.primarySoft : t.surfaceSoft,
                    borderWidth: mood === m ? 1.5 : 0,
                    borderColor: t.primary,
                  },
                ]}
              >
                <Sticker id={m} size={26} />
              </PressableScale>
            ))}
          </View>
          <Btn label="Save memory" icon={CalendarDays} onPress={save} />
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  appbarTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.9, flex: 1 },
  appbarActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fab: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  loadWarning: { marginHorizontal: 18, marginBottom: 10 },
  addBanner: { minHeight: 76, marginHorizontal: 18, marginTop: 6, marginBottom: 14, paddingHorizontal: 15, borderRadius: 21, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 12 },
  addBannerIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  addBannerTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  addBannerSub: { color: 'rgba(255,255,255,0.82)', fontSize: 10.5, fontWeight: '600', marginTop: 3 },
  emptyCard: { minHeight: 150, borderWidth: StyleSheet.hairlineWidth, borderRadius: 22, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 7 },
  emptyTitle: { fontSize: 15, fontWeight: '800' },
  emptyText: { fontSize: 11.5, fontWeight: '500', textAlign: 'center' },
  searchWrap: { paddingHorizontal: 18, paddingBottom: 12 },
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
  chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 12 },
  list: { paddingHorizontal: 18, paddingBottom: 24, gap: 10 },
  cardWrap: {},
  card: {
    flexDirection: 'row',
    gap: 13,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 12,
    borderRadius: 22,
  },
  thumb: { width: 78, height: 78, borderRadius: 16, overflow: 'hidden' },
  thumbImg: { width: '100%', height: '100%' },
  cardBody: { flex: 1, minWidth: 0, paddingVertical: 4, paddingRight: 4 },
  cardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 3 },
  cardLine: { fontSize: 12.5, fontWeight: '500', lineHeight: 17 },
  cardDate: { fontSize: 10.5, fontWeight: '700', marginTop: 5 },
  writeTogether: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  writeTogetherText: { fontSize: 12.5, fontWeight: '700' },
  detailImage: { borderRadius: 20, overflow: 'hidden', marginBottom: 14 },
  detailImageImg: { width: '100%', height: 180 },
  detailLine: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  detailLineText: { fontSize: 14, fontWeight: '600' },
  detailActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  deleteBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 50,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: StyleSheet.hairlineWidth,
  },
  textarea: { height: 110, paddingTop: 14, textAlignVertical: 'top', lineHeight: 21 },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moodLabel: { fontSize: 12, fontWeight: '700', marginRight: 2 },
  moodBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
