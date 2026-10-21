import { useCallback, useEffect } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  Clock3,
  Heart,
  Link2,
  MessageCircle,
  MessageSquare,
  NotebookPen,
  Phone,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { BrandWordmark } from '../../src/components/BrandWordmark';
import { HeartOrb } from '../../src/components/Brand';
import { ConnectionPill } from '../../src/components/ConnectionPill';
import { PageBackground } from '../../src/components/PageBackground';
import { PressableScale, SectionHead } from '../../src/components/ui';
import { RichText } from '../../src/components/RichText';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { fonts } from '../../src/theme/fonts';
import { radii } from '../../src/theme/tokens';
import { useStore } from '../../src/state/store';

const TILES = [
  {
    key: 'chat',
    title: 'Chat',
    sub: 'Send messages',
    icon: MessageSquare,
    colors: ['#7f5cff', '#5b39ee'],
    glow: 'rgba(124, 92, 255, 0.14)',
  },
  {
    key: 'call',
    title: 'Call',
    sub: 'Voice call',
    icon: Phone,
    colors: ['#ff9ecb', '#f0639f'],
    glow: 'rgba(245, 139, 191, 0.18)',
  },
  {
    key: 'video',
    title: 'Video Call',
    sub: 'Face to face',
    icon: Video,
    colors: ['#b18dff', '#7b4df6'],
    glow: 'rgba(124, 92, 255, 0.14)',
  },
  {
    key: 'notes',
    title: 'Notes',
    sub: 'Our memories',
    icon: NotebookPen,
    colors: ['#ffc38a', '#ff9b6a'],
    glow: 'rgba(255, 155, 106, 0.18)',
  },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
}

function today() {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

function dailyLine() {
  const hour = new Date().getHours();
  if (hour < 6) return 'Go back to sleep, I will be here 🌙';
  if (hour < 11) return 'Good morning to you and to me 💜';
  if (hour < 14) return 'Have you eaten yet? I am worried about you';
  if (hour < 18) return 'Thinking about you, always ✨';
  if (hour < 22) return 'Your evening, my favourite part of the day';
  return 'Late night, long-distance, still close 💖';
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();

  const home = useStore((s) => s.home);
  const user = useStore((s) => s.user);
  const refreshAll = useStore((s) => s.refreshAll);
  const dataLoading = useStore((s) => s.dataLoading);

  useFocusEffect(
    useCallback(() => {
      void useStore.getState().loadHome();
      void useStore.getState().loadPairing();
    }, []),
  );

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const partner = home?.partner ?? null;
  const linked = Boolean(home?.linked);
  const streak = home?.streakDays ?? 0;
  const untilAnniversary = home?.anniversary.daysUntil ?? 0;
  const together = home?.loveStats.daysTogether ?? '0';

  const open = (key: (typeof TILES)[number]['key']) => {
    if (key === 'chat') router.push('/chat');
    if (key === 'call') router.push('/call/audio');
    if (key === 'video') router.push('/call/video');
    if (key === 'notes') router.push('/notes');
  };

  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.head, { paddingTop: insets.top + 6 }]}>
        <BrandWordmark />
        <View style={styles.headActions}>
          <ConnectionPill />
          <PressableScale onPress={() => router.push('/settings')} accessibilityLabel="Your profile">
            <Avatar
              src={user?.avatarUrl ?? null}
              size={36}
              alt="You"
            />
          </PressableScale>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={dataLoading} onRefresh={refreshAll} tintColor={t.primary} />
        }
      >
        <View style={styles.greeting}>
          <Text style={[styles.greetingText, { color: t.text2 }]}>
            {greeting()} · {today()}
          </Text>
          <Text style={[styles.greetingStrong, { color: t.text }]}>
            My Love <RichText text="💖" size={19} />
          </Text>
          <Text style={[styles.greetingLine, { color: t.text3 }]}>{dailyLine()}</Text>
        </View>

        {linked && partner ? (
          <PressableScale
            style={styles.heroWrap}
            onPress={() => router.push('/chat')}
            accessibilityLabel={`Open chat with ${partner.nickname ?? partner.displayName}`}
          >
            <View
              style={[
                styles.hero,
                { backgroundColor: t.card, borderColor: t.cardBorder },
                shadow('md'),
              ]}
            >
              <View
                style={[styles.heroGlow, { backgroundColor: t.primaryGhost }]}
                pointerEvents="none"
              />
              <Avatar
                src={partner.avatarUrl}
                size={56}
                ring
                online={partner.online}
                alt={partner.displayName}
              />
              <View style={styles.heroMeta}>
                <View style={styles.heroRow}>
                  <Text style={[styles.heroName, { color: t.text }]}>
                    {partner.nickname ?? partner.displayName}
                  </Text>
                  <LinearGradient
                    colors={['#FFE7AE', '#FFCF7A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.streak}
                  >
                    <Heart size={9} fill="#7A4A00" color="#7A4A00" />
                    <Text style={styles.streakText}>{streak} day streak</Text>
                  </LinearGradient>
                </View>
                <Text style={[styles.heroSub, { color: t.text2 }]}>
                  {partner.online ? 'Active now · she’s thinking of you' : 'Away for a while'}
                </Text>
                <View style={styles.heroQuick}>
                  <View style={[styles.quickAction, { backgroundColor: t.primaryGhost }]}>
                    <MessageCircle size={12} strokeWidth={2.4} color={t.primary} />
                    <Text style={[styles.quickText, { color: t.primaryDeep }]}>Message</Text>
                  </View>
                  <View style={[styles.quickAction, { backgroundColor: t.primaryGhost }]}>
                    <Phone size={12} strokeWidth={2.4} color={t.primary} />
                    <Text style={[styles.quickText, { color: t.primaryDeep }]}>Call</Text>
                  </View>
                </View>
              </View>
              <PressableScale
                onPress={() => router.push('/pairing')}
                accessibilityLabel="Pairing details"
                style={styles.heroGo}
              >
                <ChevronRight size={17} strokeWidth={2.4} color={t.primary} />
              </PressableScale>
            </View>
          </PressableScale>
        ) : (
          <PressableScale
            style={styles.heroWrap}
            onPress={() => router.push('/pairing')}
            accessibilityLabel="Connect your person"
          >
            <View
              style={[
                styles.hero,
                { backgroundColor: t.card, borderColor: t.cardBorder },
                shadow('md'),
              ]}
            >
              <View
                style={[styles.heroGlow, { backgroundColor: t.primaryGhost }]}
                pointerEvents="none"
              />
              <View style={[styles.connectIcon, { backgroundColor: t.primaryGhost }]}>
                <Link2 size={24} strokeWidth={2.2} color={t.primary} />
              </View>
              <View style={styles.heroMeta}>
                <Text style={[styles.heroName, { color: t.text }]}>Connect your person</Text>
                <Text style={[styles.heroSub, { color: t.text2 }]}>
                  Pair with a code or QR — takes seconds
                </Text>
                <View style={styles.heroQuick}>
                  <View style={[styles.quickAction, { backgroundColor: t.primaryGhost }]}>
                    <Sparkles size={12} strokeWidth={2.4} color={t.primary} />
                    <Text style={[styles.quickText, { color: t.primaryDeep }]}>Pair now</Text>
                  </View>
                </View>
              </View>
            </View>
          </PressableScale>
        )}

        <View style={styles.grid}>
          {TILES.map(({ key, title, sub, icon: Icon, colors, glow }) => (
            <PressableScale
              key={key}
              onPress={() => open(key)}
              accessibilityLabel={title}
              style={styles.tileWrap}
            >
              <View
                style={[
                  styles.tile,
                  { backgroundColor: t.card, borderColor: t.cardBorder },
                  shadow('sm'),
                ]}
              >
                <View
                  style={[styles.tileGlow, { backgroundColor: glow }]}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tileIcon}
                >
                  <Icon size={20} strokeWidth={2.2} color="#fff" />
                </LinearGradient>
                <Text style={[styles.tileTitle, { color: t.text }]}>{title}</Text>
                <Text style={[styles.tileSub, { color: t.text3 }]}>{sub}</Text>
              </View>
            </PressableScale>
          ))}
        </View>

        <View style={[styles.quote, { backgroundColor: t.surfaceSoft, borderColor: t.cardBorder }, shadow('sm')]}>
          <View style={[styles.quoteBalloon, { backgroundColor: t.surface }]}>
            <HeartOrb size={40} tone="violet" />
          </View>
          <Text style={[styles.quoteText, { color: t.text2 }]}>
            You are <Text style={{ fontWeight: '800', color: t.text }}>my today</Text> and all of{' '}
            <Text style={{ fontWeight: '800', color: t.text }}>
              my tomorrows <RichText text="💜" size={13} />
            </Text>
          </Text>
        </View>

        <View style={styles.sectionHead}>
          <SectionHead
            title="Our moments"
            actionLabel="View all"
            onAction={() => router.push('/notes')}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rail}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {(home?.moments ?? []).map((note) => (
            <PressableScale
              key={note.id}
              onPress={() => router.push('/notes')}
              accessibilityLabel={note.title}
              style={styles.railWrap}
            >
              <View style={[styles.railCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('sm')]}>
                {note.image ? (
                  <Image source={{ uri: note.image }} style={styles.railImg} />
                ) : (
                  <View style={[styles.railImg, { backgroundColor: t.primarySoft }]} />
                )}
                <View style={styles.railBody}>
                  <Text numberOfLines={2} style={[styles.railTitle, { color: t.text }]}>
                    {note.title}
                  </Text>
                  <Text style={[styles.railDate, { color: t.text3 }]}>{note.date}</Text>
                </View>
              </View>
            </PressableScale>
          ))}
        </ScrollView>

        <View
          style={[
            styles.special,
            { backgroundColor: t.card, borderColor: t.cardBorder },
            shadow('sm'),
          ]}
        >
          <LinearGradient
            colors={[t.primary2, t.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.specialCount, shadow('primary')]}
          >
            <Text style={styles.specialCountValue}>{untilAnniversary}</Text>
            <Text style={styles.specialCountLabel}>days</Text>
          </LinearGradient>
          <View style={styles.specialMeta}>
            <Text style={[styles.specialTitle, { color: t.text }]}>Our anniversary</Text>
            <Text style={[styles.specialSub, { color: t.text2 }]}>
              {home?.anniversary.date ?? '14 Feb'} · {together} days of us. Plan something small?
            </Text>
          </View>
          <Heart size={17} strokeWidth={2.2} color={t.primary2} fill={t.primarySoft} />
        </View>

        <View style={[styles.stats, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('sm')]}>
          {[
            { icon: Heart, value: together, label: 'days together' },
            { icon: MessageSquare, value: home?.loveStats.messages ?? '0', label: 'messages' },
            { icon: Clock3, value: home?.loveStats.callsThisWeek ?? '0m', label: 'calls this week' },
          ].map(({ icon: Icon, value, label }, index) => (
            <View
              key={label}
              style={[
                styles.statCell,
                index > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: t.line },
              ]}
            >
              <View style={[styles.statIcon, { backgroundColor: t.primaryGhost }]}>
                <Icon size={13} strokeWidth={2.3} color={t.primary} />
              </View>
              <Text style={[styles.statValue, { color: t.text }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: t.text3 }]}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <ShieldCheck size={12} strokeWidth={2.4} color={t.text3} />
          <Text style={[styles.footerText, { color: t.text3 }]}>
            End-to-end private · just you two
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scroll: { flex: 1, marginTop: 4 },
  greeting: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 15 },
  greetingText: { fontSize: 14.5, lineHeight: 20, fontWeight: '600', letterSpacing: -0.1 },
  greetingStrong: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    fontFamily: fonts.bold,
  },
  greetingLine: { marginTop: 7, fontSize: 12, fontWeight: '600' },

  heroWrap: { marginHorizontal: 20 },
  hero: {
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    right: -46,
    top: -60,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 999,
    shadowColor: '#d6981e',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  streakText: { fontSize: 10, fontWeight: '800', color: '#7A4A00' },
  heroMeta: { flex: 1, minWidth: 0 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  heroName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  heroSub: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  heroQuick: { flexDirection: 'row', gap: 7, marginTop: 10 },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: radii.pill,
  },
  quickText: { fontSize: 11, fontWeight: '700' },
  heroGo: { paddingLeft: 4 },
  connectIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tileWrap: { width: '48%', marginBottom: 12 },
  tile: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 15,
    paddingBottom: 13,
    overflow: 'hidden',
  },
  tileGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    right: -30,
    top: -36,
  },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileTitle: { fontSize: 14.5, fontWeight: '800', letterSpacing: -0.2 },
  tileSub: { fontSize: 11, fontWeight: '600', marginTop: -2 },

  quote: {
    marginHorizontal: 20,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quoteBalloon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: -0.1 },

  sectionHead: { paddingHorizontal: 22, paddingTop: 20 },
  rail: { paddingLeft: 20, marginTop: -6 },
  railWrap: { marginRight: 10 },
  railCard: {
    width: 132,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  railImg: { width: '100%', height: 82 },
  railBody: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 },
  railTitle: { fontSize: 11.5, fontWeight: '800', lineHeight: 15, letterSpacing: -0.1 },
  railDate: { fontSize: 9.5, fontWeight: '700', marginTop: 4 },

  special: {
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderWidth: StyleSheet.hairlineWidth,
  },
  specialCount: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialCountValue: { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 20 },
  specialCountLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  specialMeta: { flex: 1 },
  specialTitle: { fontSize: 13, fontWeight: '800', letterSpacing: -0.2 },
  specialSub: { fontSize: 11, fontWeight: '500', marginTop: 2, lineHeight: 15 },

  stats: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 22,
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  statCell: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 12, paddingHorizontal: 6 },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: 14.5, fontWeight: '800', letterSpacing: -0.4 },
  statLabel: { fontSize: 9.5, fontWeight: '600', letterSpacing: 0.1 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 18,
  },
  footerText: { fontSize: 10.5, fontWeight: '600' },
});
