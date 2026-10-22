import { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CardSkeleton } from '../../src/components/Skeleton';
import { RichText } from '../../src/components/RichText';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, Heart, Plus, Search, Sparkles, Trash2, X } from 'lucide-react-native';
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
  const dataLoading = useStore((s) => s.dataLoading);
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

  useFocusEffect(
    useCallback(() => {
      void loadNotes();
    }, [loadNotes]),
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
    await createNote({
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
    setTitle('');
    setBody('');
    setAdding(false);
    toast('Memory saved');
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

        {dataLoading && filtered.length === 0 ? (
          <View style={styles.list}>
            <CardSkeleton count={3} height={92} />
          </View>
        ) : null}

        <View style={styles.list}>
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
            accessibilityLabel="Write one together"
            style={[styles.writeTogether, { backgroundColor: t.primaryGhost, borderColor: t.primaryGhost }]}
          >
            <Sparkles size={15} strokeWidth={2.2} color={t.primary} />
            <Text style={[styles.writeTogetherText, { color: t.primary }]}>Write one together</Text>
          </PressableScale>
        </View>
      </ScrollView>

      <Sheet
        visible={Boolean(active)}
        onClose={() => setActive(null)}
        title={active?.title}
        subtitle={active ? `${active.date} · saved in our space` : undefined}
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
                  <Heart size={13} strokeWidth={2.6} color="#a78bfa" fill="#c4b0ff" />
                  <Text style={[styles.detailLineText, { color: '#3a3157' }]}>{line}</Text>
                </View>
              ))}
            </View>
            <View style={styles.detailActions}>
              <Btn
                label="Save to memories"
                icon={Sparkles}
                onPress={() => {
                  setActive(null);
                  toast('Added to our memories');
                }}
                style={{ flex: 1 }}
              />
              <PressableScale
                onPress={() => {
                  setActive(null);
                  toast('Note deleted');
                }}
                accessibilityLabel="Delete note"
                style={styles.deleteBtn}
              >
                <Trash2 size={19} strokeWidth={2.2} color="#e5484d" />
              </PressableScale>
            </View>
          </View>
        ) : null}
      </Sheet>

      <Sheet
        visible={adding}
        onClose={() => setAdding(false)}
        title="New memory"
        subtitle="A little page of your story, kept just for the two of you."
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
