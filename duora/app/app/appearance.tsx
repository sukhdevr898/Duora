import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Check,
  Heart,
  MessageSquare,
  Moon,
  Palette,
  Smartphone,
  Sparkles,
  StickyNote,
  Sun,
  Video,
  Waves,
  type LucideIcon,
} from 'lucide-react-native';
import { Avatar } from '../src/components/Avatar';
import { PageBackground } from '../src/components/PageBackground';
import { PressableScale } from '../src/components/ui';
import { RichText } from '../src/components/RichText';
import { useToast } from '../src/components/Overlay';
import { useDuoraTheme } from '../src/theme/ThemeProvider';
import { accentList, modeCopy, type ThemeMode } from '../src/theme/tokens';
import { useStore } from '../src/state/store';

const MODES: { key: ThemeMode; icon: LucideIcon }[] = [
  { key: 'light', icon: Sun },
  { key: 'dark', icon: Moon },
  { key: 'system', icon: Smartphone },
];

const ICON_OPTIONS = [MessageSquare, Heart, Video, StickyNote, Sparkles, Palette, Moon, Waves];

export default function AppearanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow, themePreference, accent, loveMode, heartMotion, glass } = useDuoraTheme();
  const { toast } = useToast();

  const setThemePreference = useStore((s) => s.setThemePreference);
  const setAccent = useStore((s) => s.setAccent);
  const setLoveMode = useStore((s) => s.setLoveMode);
  const setHeartMotion = useStore((s) => s.setHeartMotion);
  const setGlass = useStore((s) => s.setGlass);
  const home = useStore((s) => s.home);

  const [iconIndex, setIconIndex] = useState(0);
  const partnerName = home?.partner?.nickname ?? home?.partner?.displayName ?? 'ruhi';

  const accentInfo = accentList.find((a) => a.key === accent) ?? accentList[0];

  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.appbar, { paddingTop: insets.top + 8 }]}>
        <PressableScale onPress={() => router.back()} accessibilityLabel="Back">
          <ArrowLeft size={20} strokeWidth={2.4} color={t.text} />
        </PressableScale>
        <Text style={[styles.appbarTitle, { color: t.text }]}>Appearance</Text>
        <View style={styles.spacer} />
        <View style={[styles.badge, { backgroundColor: t.primarySoft }]}>
          <Sparkles size={11} strokeWidth={2.6} color={t.primaryDeep} />
          <Text style={[styles.badgeText, { color: t.primaryDeep }]}>Premium</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* live preview */}
          <View
            style={[
              styles.preview,
              { backgroundColor: t.card, borderColor: t.cardBorder },
              shadow('sm'),
            ]}
          >
            <View style={styles.previewHead}>
              <Avatar src={home?.partner?.avatarUrl ?? null} size={30} online alt={partnerName} />
              <Text style={[styles.previewName, { color: t.text }]}>{partnerName}</Text>
              <Text style={[styles.previewState, { color: t.mint }]}>online</Text>
              <Moon size={13} color={t.text3} style={{ marginLeft: 'auto' }} />
            </View>
            <View style={styles.previewMsgs}>
              <View style={[styles.previewIn, { backgroundColor: t.bubbleIn }]}>
                <RichText text="Miss you ✨" size={11.5} color={t.text} />
              </View>
              <View style={[styles.previewOut, { backgroundColor: t.primary }]}>
                <RichText text="Come here 💜" size={11.5} color="#fff" />
              </View>
            </View>
            <View style={[styles.previewBar, { backgroundColor: t.fieldBg }]}>
              <Text style={[styles.previewField, { color: t.text3 }]}>Message {partnerName}…</Text>
              <View style={[styles.previewSend, { backgroundColor: t.primary }]}>
                <Sparkles size={12} strokeWidth={2.6} color="#fff" />
              </View>
            </View>
            <View style={styles.previewTags}>
              <Text style={[styles.previewTag, { color: t.text3 }]}>{modeCopy[themePreference].title} mode</Text>
              <Text style={[styles.previewTag, { color: t.text3 }]}>·</Text>
              <Text style={[styles.previewTag, { color: t.text3 }]}>{accentInfo.name}</Text>
            </View>
          </View>

          {/* mode */}
          <Text style={[styles.sectionLabel, { color: t.text2 }]}>Mode</Text>
          <View style={styles.modeGrid}>
            {MODES.map(({ key, icon: Icon }) => {
              const active = themePreference === key;
              return (
                <PressableScale
                  key={key}
                  onPress={() => setThemePreference(key)}
                  accessibilityLabel={modeCopy[key].title}
                  style={[
                    styles.modeCard,
                    {
                      backgroundColor: t.card,
                      borderColor: active ? t.primary : t.cardBorder,
                      borderWidth: 1.5,
                      ...(active ? shadow('sm') : null),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.modePreview,
                      {
                        backgroundColor: key === 'dark' ? '#221b3b' : '#f4f0ff',
                        borderColor: key === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(61,39,116,0.08)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.modeBar,
                        { backgroundColor: key === 'dark' ? '#3a2f63' : '#d9cdff' },
                      ]}
                    />
                    <View
                      style={[
                        styles.modeDot,
                        { backgroundColor: key === 'dark' ? '#9a7cff' : '#6d4bf6' },
                      ]}
                    />
                    <View
                      style={[
                        styles.modeLine,
                        { top: 21, backgroundColor: key === 'dark' ? '#4a3d78' : '#e2d9ff' },
                      ]}
                    />
                    <View
                      style={[
                        styles.modeLine,
                        { top: 29, right: 34, backgroundColor: key === 'dark' ? '#4a3d78' : '#e2d9ff' },
                      ]}
                    />
                    <View
                      style={[
                        styles.modeCardBox,
                        { backgroundColor: key === 'dark' ? '#3a2f63' : '#ffffff' },
                      ]}
                    />
                  </View>
                  <View style={styles.modeLabel}>
                    <Icon size={11} strokeWidth={2.4} color={t.text} />
                    <Text style={[styles.modeLabelText, { color: t.text }]}>{modeCopy[key].title}</Text>
                  </View>
                  <Text style={[styles.modeHint, { color: t.text3 }]}>{modeCopy[key].blurb}</Text>
                </PressableScale>
              );
            })}
          </View>

          {/* love theme */}
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: t.text }]}>Love theme</Text>
            <View style={styles.sectionLink}>
              <Heart size={11} fill={t.primary2} color={t.primary2} />
              <Text style={[styles.sectionLinkText, { color: t.primary }]}>{accentList.length} moods</Text>
            </View>
          </View>

          <View style={{ gap: 9 }}>
            {accentList.map((a) => {
              const active = accent === a.key;
              return (
                <PressableScale
                  key={a.key}
                  onPress={() => {
                    setAccent(a.key);
                    toast(`${a.name} applied`);
                  }}
                  accessibilityLabel={a.name}
                  style={[
                    styles.accentRow,
                    {
                      backgroundColor: t.card,
                      borderColor: active ? t.primary : t.cardBorder,
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[a.swatch[0], a.swatch[1]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.swatch}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.accentName, { color: t.text }]}>{a.name}</Text>
                    <Text style={[styles.accentBlurb, { color: t.text3 }]}>{a.blurb}</Text>
                  </View>
                  {active ? (
                    <View style={[styles.accentCheck, { backgroundColor: t.primary }]}>
                      <Check size={17} strokeWidth={3} color="#fff" />
                    </View>
                  ) : null}
                </PressableScale>
              );
            })}
          </View>

          {/* icons */}
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: t.text }]}>Custom icons</Text>
            <View style={[styles.badge, { backgroundColor: t.primarySoft, height: 20 }]}>
              <Text style={[styles.badgeText, { color: t.primaryDeep, fontSize: 9 }]}>Premium</Text>
            </View>
          </View>
          <View style={styles.iconKit}>
            {ICON_OPTIONS.map((Icon, i) => (
              <PressableScale
                key={i}
                onPress={() => {
                  setIconIndex(i);
                  toast('Icon style updated');
                }}
                accessibilityLabel={`Icon style ${i + 1}`}
                style={[
                  styles.iconTile,
                  {
                    backgroundColor: iconIndex === i ? t.primarySoft : t.card,
                    borderColor: iconIndex === i ? t.primary : t.line,
                  },
                ]}
              >
                <Icon size={21} strokeWidth={1.9} color={iconIndex === i ? t.primary : t.text2} />
              </PressableScale>
            ))}
          </View>

          {/* finishing touches */}
          <Text style={[styles.sectionLabel, { color: t.text2 }]}>Finishing touches</Text>
          <View style={[styles.group, { backgroundColor: t.card }, shadow('sm')]}>
            {[
              {
                title: 'Love mode',
                sub: 'Warmer rose palette, hearts everywhere',
                value: loveMode,
                onChange: (v: boolean) => {
                  setLoveMode(v);
                  toast(v ? 'Love mode on 💜' : 'Love mode off');
                },
              },
              {
                title: 'Floating hearts',
                sub: 'Gentle motion on calls and empty states',
                value: heartMotion,
                onChange: setHeartMotion,
              },
              {
                title: 'Glass effects',
                sub: 'Frosted cards and blurred header bars',
                value: glass,
                onChange: setGlass,
              },
            ].map((row, index) => (
              <View
                key={row.title}
                style={[
                  styles.toggleRow,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleTitle, { color: t.text }]}>{row.title}</Text>
                  <Text style={[styles.toggleSub, { color: t.text3 }]}>{row.sub}</Text>
                </View>
                <Switch
                  value={row.value}
                  onValueChange={row.onChange}
                  trackColor={{ false: t.line, true: t.primary }}
                  thumbColor="#fff"
                  accessibilityLabel={row.title}
                />
              </View>
            ))}
          </View>

          <View style={[styles.banner, { backgroundColor: t.surfaceSoft }, shadow('sm')]}>
            <View style={[styles.badge, { backgroundColor: '#ffe7ae', alignSelf: 'flex-start' }]}>
              <Text style={[styles.badgeText, { color: '#7a4a00' }]}>Premium</Text>
            </View>
            <Text style={[styles.bannerTitle, { color: t.text }]}>Make Duora yours</Text>
            <Text style={[styles.bannerSub, { color: t.text2 }]}>
              Unlock every love theme, animated hearts and exclusive icon sets.
            </Text>
            <PressableScale
              onPress={() => toast('Premium is on the way 💜')}
              accessibilityLabel="Explore premium"
              style={[styles.bannerBtn, { backgroundColor: t.primary }]}
            >
              <Text style={styles.bannerBtnText}>Explore premium</Text>
              <Sparkles size={14} strokeWidth={2.4} color="#fff" />
            </PressableScale>
          </View>

          <Text style={[styles.foot, { color: t.text3 }]}>
            Changes apply instantly across your space
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  appbarTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  spacer: { flex: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4 },
  scroll: { flex: 1 },
  body: { paddingHorizontal: 18, paddingBottom: 28 },

  preview: { padding: 16, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth },
  previewHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewName: { fontSize: 12.5, fontWeight: '800' },
  previewState: { fontSize: 10, fontWeight: '700' },
  previewMsgs: { marginTop: 12, gap: 6, alignItems: 'flex-start' },
  previewIn: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14, alignSelf: 'flex-start' },
  previewOut: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14, alignSelf: 'flex-end' },
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 13,
  },
  previewField: { flex: 1, fontSize: 11, fontWeight: '500' },
  previewSend: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTags: { flexDirection: 'row', gap: 6, marginTop: 10, justifyContent: 'center' },
  previewTag: { fontSize: 10.5, fontWeight: '700' },

  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 10,
  },
  modeGrid: { flexDirection: 'row', gap: 9 },
  modeCard: { flex: 1, padding: 8, paddingBottom: 10, borderRadius: 18 },
  modePreview: { height: 64, borderRadius: 12, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  modeBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 12 },
  modeDot: { position: 'absolute', top: 17, left: 8, width: 6, height: 6, borderRadius: 3 },
  modeLine: { position: 'absolute', left: 8, width: 26, height: 3, borderRadius: 2 },
  modeCardBox: { position: 'absolute', top: 38, left: 8, width: 34, height: 18, borderRadius: 6 },
  modeLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8 },
  modeLabelText: { fontSize: 12, fontWeight: '800', letterSpacing: -0.1 },
  modeHint: { fontSize: 9.5, fontWeight: '600', textAlign: 'center', marginTop: 3 },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14.5, fontWeight: '800', letterSpacing: -0.2 },
  sectionLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionLinkText: { fontSize: 11, fontWeight: '700' },

  accentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 13, borderRadius: 18 },
  swatch: { width: 44, height: 44, borderRadius: 14 },
  accentName: { fontSize: 13.5, fontWeight: '800', letterSpacing: -0.2 },
  accentBlurb: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  accentCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconKit: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },

  group: { borderRadius: 22, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14 },
  toggleTitle: { fontSize: 13, fontWeight: '700' },
  toggleSub: { fontSize: 10.5, fontWeight: '500', marginTop: 1 },

  banner: { marginTop: 20, padding: 18, borderRadius: 24 },
  bannerTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginTop: 10 },
  bannerSub: { fontSize: 12.5, lineHeight: 18, marginTop: 4 },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 46,
    borderRadius: 999,
    marginTop: 14,
  },
  bannerBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  foot: { textAlign: 'center', fontSize: 11, fontWeight: '600', marginTop: 16 },
});
