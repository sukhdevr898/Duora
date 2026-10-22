import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check, ChevronRight, Heart, Moon, Palette, Smartphone, Sun, type LucideIcon } from 'lucide-react-native';
import { PageBackground } from '../src/components/PageBackground';
import { PressableScale } from '../src/components/ui';
import { useToast } from '../src/components/Overlay';
import { useDuoraTheme } from '../src/theme/ThemeProvider';
import { accentList, modeCopy, type ThemeMode } from '../src/theme/tokens';
import { useStore } from '../src/state/store';

const MODES: { key: ThemeMode; icon: LucideIcon }[] = [
  { key: 'light', icon: Sun },
  { key: 'dark', icon: Moon },
  { key: 'system', icon: Smartphone },
];

export default function AppearanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow, themePreference, accent, mode } = useDuoraTheme();
  const { toast } = useToast();
  const setThemePreference = useStore((s) => s.setThemePreference);
  const setAccent = useStore((s) => s.setAccent);
  const accentInfo = accentList.find((item) => item.key === accent) ?? accentList[0];

  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.appbar, { paddingTop: insets.top + 8 }]}>
        <PressableScale onPress={() => router.back()} accessibilityLabel="Back">
          <ArrowLeft size={20} strokeWidth={2.4} color={t.text} />
        </PressableScale>
        <Text style={[styles.appbarTitle, { color: t.text }]}>Themes</Text>
        <View style={{ flex: 1 }} />
        <Palette size={19} strokeWidth={2.1} color={t.primary} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <LinearGradient colors={accentInfo.swatch} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerKicker}>YOUR DUORA</Text>
            <Text style={styles.bannerTitle}>Make it yours</Text>
            <Text style={styles.bannerSub}>Choose a color mood and display mode that feels right.</Text>
          </View>
          <View style={styles.bannerHeart}><Heart size={32} fill="rgba(255,255,255,0.24)" color="#fff" strokeWidth={1.8} /></View>
        </LinearGradient>

        <View style={[styles.previewCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('xs')]}>
          <View style={styles.previewHead}>
            <View>
              <Text style={[styles.previewTitle, { color: t.text }]}>Live preview</Text>
              <Text style={[styles.previewSub, { color: t.text3 }]}>{accentInfo.name} · {mode} mode</Text>
            </View>
            <View style={[styles.previewMark, { backgroundColor: t.primarySoft }]}><Heart size={16} fill={t.primary} color={t.primary} /></View>
          </View>
          <View style={[styles.previewLine, { backgroundColor: t.fieldBg }]}>
            <View style={[styles.previewDot, { backgroundColor: t.primary }]} />
            <View style={[styles.previewTextLine, { backgroundColor: t.text3, opacity: 0.42 }]} />
          </View>
          <View style={[styles.previewLine, styles.previewLineRight, { backgroundColor: t.primary }]}>
            <View style={[styles.previewTextLine, { backgroundColor: '#fff', opacity: 0.8, width: '48%' }]} />
            <View style={[styles.previewDot, { backgroundColor: '#fff' }]} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: t.text }]}>Display mode</Text>
        <View style={styles.modeRow}>
          {MODES.map(({ key, icon: Icon }) => {
            const active = themePreference === key;
            return (
              <PressableScale
                key={key}
                onPress={() => { setThemePreference(key); toast(`${modeCopy[key].title} mode applied`); }}
                accessibilityLabel={`${modeCopy[key].title} mode`}
                style={[styles.modeCard, { backgroundColor: t.card, borderColor: active ? t.primary : t.cardBorder }, active && shadow('xs')]}
              >
                <View style={[styles.modeIcon, { backgroundColor: active ? t.primarySoft : t.surfaceSoft }]}>
                  <Icon size={17} color={active ? t.primary : t.text2} strokeWidth={2.1} />
                </View>
                <Text style={[styles.modeName, { color: t.text }]}>{modeCopy[key].title}</Text>
                <Text style={[styles.modeHint, { color: t.text3 }]}>{modeCopy[key].blurb}</Text>
                {active ? <View style={[styles.modeCheck, { backgroundColor: t.primary }]}><Check size={11} color="#fff" strokeWidth={3} /></View> : null}
              </PressableScale>
            );
          })}
        </View>

        <View style={styles.sectionHead}>
          <View>
            <Text style={[styles.sectionTitle, { color: t.text }]}>Color themes</Text>
            <Text style={[styles.sectionSub, { color: t.text3 }]}>A little color for your shared space</Text>
          </View>
        </View>
        <View style={styles.themeGrid}>
          {accentList.map((item) => {
            const active = accent === item.key;
            return (
              <PressableScale
                key={item.key}
                onPress={() => { setAccent(item.key); toast(`${item.name} applied`, 'success'); }}
                accessibilityLabel={item.name}
                style={[styles.themeCard, { backgroundColor: t.card, borderColor: active ? t.primary : t.cardBorder }, active && shadow('xs')]}
              >
                <LinearGradient colors={item.swatch} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.themeSwatch}>
                  <Heart size={20} color="#fff" fill="rgba(255,255,255,0.18)" />
                  {active ? <View style={styles.swatchCheck}><Check size={12} color={t.primary} strokeWidth={3} /></View> : null}
                </LinearGradient>
                <Text style={[styles.themeName, { color: t.text }]} numberOfLines={1}>{item.name.replace(' Love', '')}</Text>
                <Text style={[styles.themeBlurb, { color: t.text3 }]} numberOfLines={2}>{item.blurb}</Text>
              </PressableScale>
            );
          })}
        </View>

        <PressableScale onPress={() => router.push('/privacy-icon')} accessibilityLabel="Change app icon" style={[styles.iconLink, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
          <View style={[styles.iconLinkGlyph, { backgroundColor: t.primarySoft }]}><Smartphone size={17} color={t.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.iconLinkTitle, { color: t.text }]}>App icon & privacy</Text>
            <Text style={[styles.iconLinkSub, { color: t.text2 }]}>Choose how Duora appears on this device</Text>
          </View>
          <ChevronRight size={17} color={t.text3} />
        </PressableScale>
        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 7 },
  appbarTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  scroll: { flex: 1 },
  body: { paddingHorizontal: 18, paddingBottom: 24 },
  banner: { minHeight: 126, borderRadius: 24, padding: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerCopy: { flex: 1, maxWidth: '70%' },
  bannerKicker: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  bannerTitle: { color: '#fff', fontSize: 20, lineHeight: 25, fontWeight: '800', marginTop: 4 },
  bannerSub: { color: 'rgba(255,255,255,0.91)', fontSize: 11, lineHeight: 16, fontWeight: '500', marginTop: 4 },
  bannerHeart: { width: 68, height: 68, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)', transform: [{ rotate: '8deg' }] },
  previewCard: { borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, padding: 15, marginTop: 14 },
  previewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
  previewTitle: { fontSize: 13, fontWeight: '800' },
  previewSub: { fontSize: 10, fontWeight: '500', marginTop: 3, textTransform: 'capitalize' },
  previewMark: { width: 34, height: 34, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  previewLine: { minHeight: 37, width: '78%', borderRadius: 13, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  previewLineRight: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  previewDot: { width: 7, height: 7, borderRadius: 4 },
  previewTextLine: { width: '58%', height: 5, borderRadius: 3 },
  sectionHead: { marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontSize: 16, lineHeight: 21, fontWeight: '800', letterSpacing: -0.4 },
  sectionSub: { fontSize: 10.5, marginTop: 3 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeCard: { flex: 1, minHeight: 104, borderRadius: 18, borderWidth: 1.3, alignItems: 'center', justifyContent: 'center', padding: 9 },
  modeIcon: { width: 31, height: 31, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  modeName: { fontSize: 11, fontWeight: '800' },
  modeHint: { fontSize: 8.5, lineHeight: 11, textAlign: 'center', marginTop: 3 },
  modeCheck: { position: 'absolute', top: 7, right: 7, width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeCard: { width: '48.2%', borderWidth: 1.3, borderRadius: 19, padding: 9, overflow: 'hidden' },
  themeSwatch: { height: 74, borderRadius: 13, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  swatchCheck: { position: 'absolute', top: 7, right: 7, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  themeName: { fontSize: 11.5, fontWeight: '800', marginTop: 8 },
  themeBlurb: { fontSize: 9.2, lineHeight: 13, minHeight: 26, marginTop: 2 },
  iconLink: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, padding: 12, marginTop: 19 },
  iconLinkGlyph: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconLinkTitle: { fontSize: 12, fontWeight: '800' },
  iconLinkSub: { fontSize: 10, marginTop: 3 },
});
