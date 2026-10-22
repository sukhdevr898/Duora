import { memo, useCallback, useState } from 'react';
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
  MessageCircle,
  NotebookPen,
  Phone,
  Server,
  type LucideIcon,
} from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { BrandWordmark } from '../../src/components/BrandWordmark';
import { ConnectionPill } from '../../src/components/ConnectionPill';
import { PageBackground } from '../../src/components/PageBackground';
import { PressableScale } from '../../src/components/ui';
import { CardSkeleton } from '../../src/components/Skeleton';
import { RichText } from '../../src/components/RichText';
import { ErrorCard } from '../../src/components/Feedback';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useStore } from '../../src/state/store';
import { resolveMediaUrl } from '../../src/api/client';
import { ABSOLUTE_FILL } from '../../src/theme/tokens';

const ACTIONS: { key: string; title: string; subtitle: string; icon: LucideIcon }[] = [
  { key: 'chat', title: 'Chat', subtitle: 'Messages', icon: MessageCircle },
  { key: 'call', title: 'Call', subtitle: 'Voice request', icon: Phone },
  { key: 'notes', title: 'Notes', subtitle: 'Memories', icon: NotebookPen },
  { key: 'calls', title: 'Call logs', subtitle: 'Requests', icon: Clock3 },
  { key: 'partner', title: 'Partner', subtitle: 'Pairing', icon: Heart },
  { key: 'server', title: 'Server', subtitle: 'Connection', icon: Server },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function dayLabel() {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

const ActionTile = memo(function ActionTile({
  title,
  subtitle,
  icon: Icon,
  onPress,
  tint,
  text,
  muted,
  shadowStyle,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onPress: () => void;
  tint: string;
  text: string;
  muted: string;
  shadowStyle: object;
}) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={title} style={styles.tileWrap}>
      <View style={[styles.tile, { backgroundColor: '#ffffff', borderColor: 'rgba(126,54,82,0.07)' }, shadowStyle]}>
        <View style={[styles.tileIcon, { backgroundColor: tint }]}>
          <Icon size={21} strokeWidth={2.15} color={text} />
        </View>
        <Text style={[styles.tileTitle, { color: '#27141e' }]}>{title}</Text>
        <Text style={[styles.tileSub, { color: muted }]}>{subtitle}</Text>
      </View>
    </PressableScale>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();
  const home = useStore((s) => s.home);
  const user = useStore((s) => s.user);
  const refreshAll = useStore((s) => s.refreshAll);
  const dataLoading = useStore((s) => s.dataLoading);
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState(false);
  const partnerOnline = useStore((s) => s.partnerOnline);
  const partnerTyping = useStore((s) => s.partnerTyping);
  const realtimeConnected = useStore((s) => s.realtimeConnected);

  const refreshDashboard = useCallback(async () => {
    setHomeLoading(true);
    setHomeError(false);
    const loaded = await refreshAll();
    setHomeError(!loaded);
    setHomeLoading(false);
  }, [refreshAll]);

  useFocusEffect(
    useCallback(() => {
      void refreshDashboard();
      void useStore.getState().loadPairing();
    }, [refreshDashboard]),
  );

  const partner = home?.partner ?? null;
  const linked = Boolean(home?.linked && partner);
  const partnerName = partner?.nickname ?? partner?.displayName ?? '';
  const latestMoment = home?.moments?.find((moment) => Boolean(moment.image));
  const presence = partnerTyping
    ? 'Typing…'
    : partnerOnline || partner?.online
      ? 'Online now'
      : realtimeConnected
        ? 'Offline'
        : 'Presence unavailable';

  const openAction = (key: string) => {
    if (key === 'chat') router.push('/chat');
    else if (key === 'call') router.push('/call/audio');
    else if (key === 'notes') router.push('/notes');
    else if (key === 'calls') router.push('/calls');
    else if (key === 'partner') router.push('/pairing');
    else if (key === 'server') router.push('/server');
  };

  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.head, { paddingTop: insets.top + 6 }]}>
        <View>
          <BrandWordmark size={22} />
          <Text style={[styles.tagline, { color: t.text3 }]}>Always Together</Text>
        </View>
        <View style={styles.headActions}>
          <ConnectionPill compact />
          <PressableScale onPress={() => router.push('/settings/profile')} accessibilityLabel="Open your profile">
            <Avatar src={user?.avatarUrl ?? null} size={38} alt={user?.displayName ?? 'Your profile'} />
          </PressableScale>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={dataLoading || homeLoading} onRefresh={() => void refreshDashboard()} tintColor={t.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.greeting}>
          <Text style={[styles.date, { color: t.text2 }]}>{dayLabel()}</Text>
          <Text style={[styles.greetingTitle, { color: t.text }]}>{greeting()}</Text>
          <Text style={[styles.greetingSub, { color: t.text2 }]}>
            {user?.displayName ? `Welcome back, ${user.displayName}` : 'Your Duora space'}
          </Text>
        </View>

        {homeLoading && !home ? (
          <View style={styles.skeletonWrap}>
            <CardSkeleton count={1} height={190} />
            <CardSkeleton count={2} height={108} />
          </View>
        ) : null}

        {homeError && home ? (
          <View style={{ marginHorizontal: 18, marginBottom: 12 }}>
            <ErrorCard error={{ kind: 'offline', title: 'Could not refresh your space', message: 'Showing the last information loaded on this device.', action: 'Retry' }} onRetry={() => void refreshDashboard()} />
          </View>
        ) : null}
        {home ? (
        <PressableScale
          onPress={() => router.push(linked ? '/chat' : '/pairing')}
          accessibilityLabel={linked ? `Open your chat with ${partnerName}` : 'Connect your partner'}
          style={styles.heroWrap}
        >
          <View style={[styles.hero, shadow('md')]}>
            {latestMoment?.image ? (
              <Image
                source={{ uri: resolveMediaUrl(latestMoment.image) }}
                resizeMode="cover"
                style={styles.heroImage}
              />
            ) : (
              <LinearGradient
                colors={['#ffc4d8', '#f47aa4', '#d44378']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroImage}
              />
            )}
            <LinearGradient
              colors={['rgba(45,12,30,0.08)', 'rgba(45,12,30,0.72)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroTop}>
              <View style={styles.heroLive}>
                <View style={[styles.liveDot, { backgroundColor: linked && (partnerOnline || partner?.online) ? '#54d897' : 'rgba(255,255,255,0.65)' }]} />
                <Text style={styles.heroLiveText}>{linked ? presence : 'Not paired yet'}</Text>
              </View>
              <View style={styles.heroAvatarWrap}>
                {partner ? <Avatar src={partner.avatarUrl} size={40} ring online={partnerOnline || partner.online} alt={partnerName} /> : <Heart size={20} color="#fff" fill="rgba(255,255,255,0.28)" />}
              </View>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroKicker}>{greeting()}</Text>
              <Text style={styles.heroName} numberOfLines={1}>
                {linked ? partnerName : 'Connect with your partner'}
              </Text>
              <Text style={styles.heroSub} numberOfLines={2}>
                {linked
                  ? (latestMoment?.title ?? 'Open your conversation and share a moment.')
                  : 'Share a code or scan a QR to connect your accounts.'}
              </Text>
              <View style={styles.heroAction}>
                <Text style={styles.heroActionText}>{linked ? 'Open chat' : 'Set up pairing'}</Text>
                <ChevronRight size={15} strokeWidth={2.6} color="#fff" />
              </View>
            </View>
          </View>
        </PressableScale>
        ) : !homeLoading ? (
          <View style={{ marginHorizontal: 18, marginBottom: 16 }}>
            <ErrorCard error={{ kind: 'offline', title: 'Your space is unavailable', message: 'We could not load your account overview. Check the server connection and retry.', action: 'Retry' }} onRetry={() => void refreshDashboard()} />
          </View>
        ) : null}

        <View style={styles.tileGrid}>
          {ACTIONS.map(({ key, title, subtitle, icon: Icon }, index) => (
            <ActionTile
              key={key}
              title={title}
              subtitle={subtitle}
              icon={Icon}
              onPress={() => openAction(key)}
              tint={index % 3 === 0 ? '#ffe0eb' : index % 3 === 1 ? '#e5f7ef' : '#fff0d8'}
              text={index % 3 === 0 ? t.primary : index % 3 === 1 ? '#239e7a' : '#d9912b'}
              muted={t.text3}
              shadowStyle={shadow('xs')}
            />
          ))}
        </View>

        {home ? (
          <>
          <View style={styles.sectionHead}>
          <View>
            <Text style={[styles.sectionTitle, { color: t.text }]}>Saved memories</Text>
            <Text style={[styles.sectionSub, { color: t.text3 }]}>Notes saved to your Duora account</Text>
          </View>
          <PressableScale onPress={() => router.push('/notes')} accessibilityLabel="See all memories" style={styles.seeAll}>
            <Text style={[styles.seeAllText, { color: t.primary }]}>See all</Text>
            <ChevronRight size={15} strokeWidth={2.4} color={t.primary} />
          </PressableScale>
        </View>

        {home.moments.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.momentsRail}>
            {home.moments.slice(0, 5).map((moment) => (
              <PressableScale key={moment.id} onPress={() => router.push('/notes')} accessibilityLabel={moment.title}>
                <View style={[styles.momentCard, { backgroundColor: t.card }, shadow('xs')]}>
                  {moment.image ? (
                    <Image source={{ uri: resolveMediaUrl(moment.image) }} style={styles.momentImage} resizeMode="cover" />
                  ) : (
                    <LinearGradient colors={['#ffe2ec', '#f6a4bf']} style={styles.momentImage} />
                  )}
                  <View style={styles.momentMeta}>
                    <RichText text={moment.title} size={12} color={t.text} numberOfLines={1} />
                    <Text style={[styles.momentDate, { color: t.text3 }]}>{moment.date}</Text>
                  </View>
                </View>
              </PressableScale>
            ))}
          </ScrollView>
        ) : (
          <PressableScale onPress={() => router.push('/notes')} accessibilityLabel="Create your first memory" style={[styles.emptyMoments, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <View style={[styles.emptyMomentIcon, { backgroundColor: t.primarySoft }]}>
              <NotebookPen size={18} strokeWidth={2.1} color={t.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.emptyMomentTitle, { color: t.text }]}>Start a memory</Text>
              <Text style={[styles.emptyMomentSub, { color: t.text2 }]}>Save a note or a date that matters to you.</Text>
            </View>
            <ChevronRight size={17} color={t.text3} />
          </PressableScale>
        )}
          </>
        ) : null}

        {home?.loveStats ? (
          <View style={[styles.stats, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('xs')]}>
            {[
              { icon: Heart, value: home.loveStats.daysTogether, label: 'days together' },
              { icon: MessageCircle, value: home.loveStats.messages, label: 'messages' },
              { icon: Clock3, value: String(home.streakDays), label: 'message streak' },
            ].map(({ icon: Icon, value, label }, index) => (
              <View key={label} style={[styles.statCell, index > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: t.line }]}>
                <Icon size={15} strokeWidth={2.1} color={t.primary} />
                <Text style={[styles.statValue, { color: t.text }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: t.text3 }]}>{label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 4 },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tagline: { marginTop: -2, marginLeft: 35, fontSize: 8.5, fontWeight: '800', letterSpacing: 2.1, textTransform: 'uppercase' },
  scroll: { flex: 1, marginTop: 4 },
  scrollContent: { paddingBottom: 10 },
  greeting: { paddingHorizontal: 21, paddingTop: 15, paddingBottom: 15 },
  date: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.2, textTransform: 'uppercase' },
  greetingTitle: { fontSize: 25, lineHeight: 31, fontWeight: '800', letterSpacing: -0.8, marginTop: 2 },
  greetingSub: { fontSize: 13, lineHeight: 18, fontWeight: '500', marginTop: 2 },
  skeletonWrap: { paddingHorizontal: 18, gap: 12 },
  heroWrap: { marginHorizontal: 18, marginBottom: 16 },
  hero: { height: 208, borderRadius: 26, overflow: 'hidden', justifyContent: 'space-between' },
  heroImage: { ...ABSOLUTE_FILL, width: '100%', height: '100%' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
  heroLive: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 99, backgroundColor: 'rgba(40,18,30,0.38)', paddingHorizontal: 11, paddingVertical: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  heroLiveText: { color: '#fff', fontSize: 10.5, fontWeight: '700' },
  heroAvatarWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.22)' },
  heroCopy: { paddingHorizontal: 18, paddingBottom: 16, maxWidth: '93%' },
  heroKicker: { color: 'rgba(255,255,255,0.86)', fontSize: 11.5, fontWeight: '700', letterSpacing: 0.2 },
  heroName: { color: '#fff', fontSize: 23, lineHeight: 28, fontWeight: '800', letterSpacing: -0.6, marginTop: 1 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 11.5, lineHeight: 16, fontWeight: '500', marginTop: 1 },
  heroAction: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 9, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.23)' },
  heroActionText: { color: '#fff', fontSize: 10.5, fontWeight: '800' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 18, rowGap: 10 },
  tileWrap: { width: '31.8%' },
  tile: { minHeight: 102, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 11, paddingHorizontal: 4, gap: 3 },
  tileIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  tileTitle: { fontSize: 12, fontWeight: '800', letterSpacing: -0.2 },
  tileSub: { fontSize: 9.5, lineHeight: 12, fontWeight: '600' },
  sectionHead: { paddingHorizontal: 21, paddingTop: 24, paddingBottom: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, lineHeight: 22, fontWeight: '800', letterSpacing: -0.45 },
  sectionSub: { fontSize: 10.5, fontWeight: '500', marginTop: 2 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  seeAllText: { fontSize: 11.5, fontWeight: '800' },
  momentsRail: { paddingLeft: 18, paddingRight: 18, gap: 10 },
  momentCard: { width: 128, borderRadius: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(126,54,82,0.07)' },
  momentImage: { width: '100%', height: 92 },
  momentMeta: { paddingHorizontal: 9, paddingTop: 8, paddingBottom: 9 },
  momentDate: { fontSize: 9.5, fontWeight: '600', marginTop: 4 },
  emptyMoments: { marginHorizontal: 18, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 },
  emptyMomentIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emptyMomentTitle: { fontSize: 12.5, fontWeight: '800' },
  emptyMomentSub: { fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  stats: { marginHorizontal: 18, marginTop: 15, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', overflow: 'hidden' },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 4 },
  statValue: { fontSize: 12.5, fontWeight: '800' },
  statLabel: { fontSize: 8.5, fontWeight: '600', textAlign: 'center' },
});
