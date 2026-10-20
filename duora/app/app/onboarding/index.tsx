import { useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { DuoraLogo } from '../../src/components/DuoraLogo';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useSettingsStore } from '../../src/state/settings.store';

const PAGES = [
  {
    icon: 'heart' as const,
    title: 'Just the two of you.',
    description:
      'Duora is a private space built for one couple. Pair once with a short code or QR, and the app belongs to just the two of you.',
  },
  {
    icon: 'call' as const,
    title: 'Talk, whenever you want.',
    description:
      'Real audio and video calls over WebRTC, with messages that sync the moment you are back online — even on weak connections.',
  },
  {
    icon: 'shield-checkmark' as const,
    title: 'Your space. Your choice.',
    description:
      'You control notifications, privacy, themes and your pairing. Your data stays on your server and your own devices.',
  },
];

const WIDTH = Dimensions.get('window').width;

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, spacing, typography } = useDuoraTheme();
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const last = page === PAGES.length - 1;

  const finish = () => {
    setOnboarded();
    router.replace('/auth/login');
  };

  const goNext = () => {
    if (last) {
      finish();
      return;
    }
    const next = page + 1;
    scrollRef.current?.scrollTo({ x: next * WIDTH, animated: true });
    setPage(next);
  };

  return (
    <Screen showOfflineBanner={false}>
      <View style={styles.topRow}>
        <DuoraLogo size={44} showWordmark={false} />
        <Pressable accessibilityRole="button" accessibilityLabel="Skip onboarding" onPress={finish} hitSlop={12}>
          <Text style={[typography.bodyStrong, { color: colors.textSecondary }]}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / WIDTH))}
        style={{ flex: 1 }}
      >
        {PAGES.map((item) => (
          <View key={item.title} style={[styles.page, { width: WIDTH, paddingHorizontal: spacing.xl }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.elevated }]}>
              <Ionicons name={item.icon} size={56} color={colors.primary} />
            </View>
            <Text style={[typography.display, { color: colors.text, textAlign: 'center', marginTop: spacing.xxl }]}>
              {item.title}
            </Text>
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg, lineHeight: 24 },
              ]}
            >
              {item.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {PAGES.map((_, index) => (
            <View
              key={index}
              accessibilityLabel={`Page ${index + 1}`}
              style={[
                styles.dot,
                {
                  backgroundColor: index === page ? colors.primary : colors.elevated,
                  width: index === page ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>
        <PrimaryButton label={last ? 'Get Started' : 'Next'} icon={last ? 'heart' : 'arrow-forward'} onPress={goNext} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  page: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 132, height: 132, borderRadius: 66, justifyContent: 'center', alignItems: 'center' },
  footer: { paddingBottom: 8 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { height: 8, borderRadius: 4 },
});
