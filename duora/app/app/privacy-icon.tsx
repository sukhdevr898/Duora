import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react-native';

import { PageBackground } from '../src/components/PageBackground';
import { PressableScale } from '../src/components/ui';
import { useDuoraTheme } from '../src/theme/ThemeProvider';
import { usePrivacy } from '../src/state/privacy';
import { AppIcon, PRIVACY_ICONS, type PrivacyIconKey } from '../src/privacy/icons';

export default function PrivacyIconScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();

  const icon = usePrivacy((s) => s.icon);
  const setIcon = usePrivacy((s) => s.setIcon);

  useEffect(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, []);

  const choose = (key: PrivacyIconKey) => {
    void Haptics.selectionAsync().catch(() => undefined);
    void setIcon(key);
  };

  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.appbar, { paddingTop: insets.top + 8 }]}>
        <PressableScale onPress={() => router.back()} accessibilityLabel="Back">
          <ArrowLeft size={20} strokeWidth={2.4} color={t.text} />
        </PressableScale>
        <Text style={[styles.appbarTitle, { color: t.text }]}>App icon</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* a little home screen so the icon reads the way it will look */}
          <View style={[styles.preview, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('md')]}>
            <Text style={[styles.previewLabel, { color: t.text3 }]}>IN-APP SPLASH PREVIEW</Text>
            <View style={styles.previewIcon}>
              <AppIcon icon={icon} size={92} />
            </View>
            <Text style={[styles.previewName, { color: t.text }]}>Duora</Text>
            <View style={[styles.previewNote, { backgroundColor: t.primaryGhost }]}>
              <ShieldCheck size={13} strokeWidth={2.3} color={t.primary} />
              <Text style={[styles.previewNoteText, { color: t.text2 }]}>
                This choice appears on Duora’s in-app splash. Android launcher icon disguise is not available in this build.
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: t.text2 }]}>PICK A FACE</Text>

          <View style={styles.grid}>
            {PRIVACY_ICONS.map((option) => {
              const active = option.key === icon;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => choose(option.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.label}
                  style={[
                    styles.tile,
                    {
                      backgroundColor: t.card,
                      borderColor: active ? t.primary : t.cardBorder,
                      borderWidth: active ? 2 : StyleSheet.hairlineWidth,
                    },
                    shadow('sm'),
                  ]}
                >
                  <AppIcon icon={option.key} size={56} shadow={false} />
                  <Text style={[styles.tileLabel, { color: t.text }]}>{option.label}</Text>
                  <Text style={[styles.tileBlurb, { color: t.text3 }]} numberOfLines={2}>
                    {option.blurb}
                  </Text>
                  {active ? (
                    <View style={[styles.tick, { backgroundColor: t.primary }]}>
                      <Check size={11} strokeWidth={3.2} color="#fff" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.foot, { color: t.text3 }]}>
            The choice stays on this phone. Duora never sends it anywhere.
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
    paddingBottom: 4,
  },
  appbarTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  scroll: { flex: 1 },
  body: { paddingHorizontal: 18, paddingBottom: 30 },
  preview: {
    borderRadius: 28,
    paddingVertical: 22,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  previewLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  previewIcon: { marginTop: 14 },
  previewName: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  previewNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 16,
  },
  previewNoteText: { flex: 1, fontSize: 11.5, lineHeight: 16, fontWeight: '600' },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 10,
    marginLeft: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47.8%',
    borderRadius: 24,
    padding: 14,
    alignItems: 'flex-start',
    gap: 4,
  },
  tileLabel: { fontSize: 14, fontWeight: '800', marginTop: 8 },
  tileBlurb: { fontSize: 11, lineHeight: 15, fontWeight: '500' },
  tick: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foot: { textAlign: 'center', fontSize: 11, fontWeight: '600', marginTop: 20 },
});
