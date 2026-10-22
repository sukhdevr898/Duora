import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  CircleHelp,
  Heart,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  UserRound,
  Wifi,
  type LucideIcon,
} from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { PageBackground } from '../../src/components/PageBackground';
import { PressableScale } from '../../src/components/ui';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useStore } from '../../src/state/store';
import { usePrivacy } from '../../src/state/privacy';
import { privacyIconInfo } from '../../src/privacy/icons';
import { APP_VERSION } from '../../src/version';

type Row = { icon: LucideIcon; label: string; value?: string; action?: string };

const TITLES: Record<string, { title: string; subtitle: string }> = {
  profile: { title: 'Profile', subtitle: 'Your Duora account details' },
  notifications: { title: 'Notifications', subtitle: 'Stay informed about your shared space' },
  privacy: { title: 'Privacy & security', subtitle: 'What this version can and cannot protect' },
  'chat-settings': { title: 'Chat settings', subtitle: 'Live conversation features' },
  help: { title: 'Help & support', subtitle: 'Useful places to start' },
};

export default function SubSettingsScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const key = String(section ?? 'profile');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();
  const user = useStore((s) => s.user);
  const home = useStore((s) => s.home);
  const pairing = useStore((s) => s.pairing);
  const serverStatus = useStore((s) => s.server.status);
  const realtimeConnected = useStore((s) => s.realtimeConnected);
  const privacyIcon = usePrivacy((s) => s.icon);
  const title = TITLES[key] ?? { title: 'Settings', subtitle: 'Your Duora preferences' };
  const partner = pairing?.partner ?? home?.partner ?? null;
  const partnerName = partner?.nickname ?? partner?.displayName ?? 'Your partner';
  const memberSince = useMemo(() => {
    if (!user?.createdAt) return 'Unavailable';
    const date = new Date(user.createdAt);
    return Number.isNaN(date.getTime()) ? 'Unavailable' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }, [user?.createdAt]);

  const openAction = (action?: string) => {
    if (action === 'pairing') router.push('/pairing');
    else if (action === 'icon') router.push('/privacy-icon');
    else if (action === 'server') router.push('/server');
    else if (action === 'appearance') router.push('/appearance');
    else if (action === 'chat') router.push('/chat');
    else if (action === 'calls') router.push('/calls');
  };

  const renderRows = (rows: Row[]) => (
    <View style={[styles.group, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('xs')]}>
      {rows.map((row, index) => {
        const content = (
          <>
            <View style={[styles.rowIcon, { backgroundColor: t.primarySoft }]}><row.icon size={16} color={t.primary} strokeWidth={2.1} /></View>
            <Text style={[styles.rowLabel, { color: t.text }]} numberOfLines={1}>{row.label}</Text>
            {row.value ? <Text style={[styles.rowValue, { color: t.text2 }]} numberOfLines={2}>{row.value}</Text> : null}
            {row.action ? <ChevronRight size={16} color={t.text3} /> : null}
          </>
        );
        const style = [styles.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }];
        return row.action ? (
          <PressableScale key={row.label} onPress={() => openAction(row.action)} accessibilityLabel={row.label} style={style}>{content}</PressableScale>
        ) : (
          <View key={row.label} style={style}>{content}</View>
        );
      })}
    </View>
  );

  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.appbar, { paddingTop: insets.top + 8 }]}>
        <PressableScale onPress={() => router.back()} accessibilityLabel="Back"><ArrowLeft size={20} strokeWidth={2.4} color={t.text} /></PressableScale>
        <View style={{ flex: 1 }}>
          <Text style={[styles.appbarTitle, { color: t.text }]}>{title.title}</Text>
          <Text style={[styles.appbarSub, { color: t.text3 }]}>{title.subtitle}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {key === 'profile' ? (
          <>
            <View style={[styles.profileCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('sm')]}>
              <View style={styles.profilePhoto}><Avatar src={user?.avatarUrl ?? null} size={100} ring alt={user?.displayName ?? 'Your account'} /></View>
              <Text style={[styles.profileName, { color: t.text }]}>{user?.displayName ?? 'Your account'}</Text>
              <Text style={[styles.profileEmail, { color: t.text2 }]}>{user?.email ?? 'Email unavailable'}</Text>
              <View style={[styles.accountBadge, { backgroundColor: t.primarySoft }]}>
                <UserRound size={12} color={t.primary} />
                <Text style={[styles.accountBadgeText, { color: t.primaryDeep }]}>Duora account</Text>
              </View>
            </View>
            <Text style={[styles.sectionTitle, { color: t.text }]}>Account details</Text>
            {renderRows([
              { icon: UserRound, label: 'Display name', value: user?.displayName ?? 'Not set' },
              { icon: Smartphone, label: 'Member since', value: memberSince },
              { icon: Heart, label: 'Partner', value: home ? (home.linked && partner ? partnerName : 'Not paired') : 'Unavailable', action: 'pairing' },
            ])}
            <PressableScale onPress={() => router.push('/pairing')} accessibilityLabel={home?.linked ? 'Manage connection' : 'Connect with your partner'} style={[styles.cta, { backgroundColor: t.primary }]}>
              <Text style={styles.ctaText}>{home?.linked ? 'Manage partner connection' : 'Connect with your partner'}</Text>
              <ChevronRight size={17} color="#fff" />
            </PressableScale>
          </>
        ) : key === 'notifications' ? (
          <>
            <View style={[styles.noticeCard, { backgroundColor: t.primarySoft }]}>
              <View style={[styles.noticeIcon, { backgroundColor: t.card }]}><Bell size={18} color={t.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.noticeTitle, { color: t.text }]}>Push notifications are not configured</Text>
                <Text style={[styles.noticeBody, { color: t.text2 }]}>Messages and incoming call alerts will not be delivered while the app is closed. Notification controls will appear here once push delivery is enabled.</Text>
              </View>
            </View>
            {renderRows([
              { icon: MessageCircle, label: 'Realtime messages', value: realtimeConnected ? 'Connected now' : 'Not connected', action: 'chat' },
              { icon: Wifi, label: 'Server connection', value: serverStatus === 'online' ? 'Online' : serverStatus === 'connecting' ? 'Connecting' : 'Offline', action: 'server' },
            ])}
          </>
        ) : key === 'privacy' ? (
          <>
            <View style={[styles.noticeCard, { backgroundColor: t.primarySoft }]}>
              <View style={[styles.noticeIcon, { backgroundColor: t.card }]}><ShieldCheck size={18} color={t.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.noticeTitle, { color: t.text }]}>Know what is enabled</Text>
                <Text style={[styles.noticeBody, { color: t.text2 }]}>This build uses account authentication and server-side access checks. End-to-end encryption and an app lock are not implemented.</Text>
              </View>
            </View>
            {renderRows([
              { icon: Smartphone, label: 'Selected in-app splash icon', value: privacyIconInfo(privacyIcon).label, action: 'icon' },
              { icon: LockKeyhole, label: 'Android launcher disguise', value: 'Not available in this build' },
              { icon: ShieldCheck, label: 'End-to-end encryption', value: 'Not implemented' },
            ])}
          </>
        ) : key === 'chat-settings' ? (
          <>
            <View style={[styles.noticeCard, { backgroundColor: t.primarySoft }]}>
              <View style={[styles.noticeIcon, { backgroundColor: t.card }]}><MessageCircle size={18} color={t.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.noticeTitle, { color: t.text }]}>Live chat</Text>
                <Text style={[styles.noticeBody, { color: t.text2 }]}>Text messages, stickers, typing, presence and delivery/read status are connected to the Duora server.</Text>
              </View>
            </View>
            {renderRows([
              { icon: Check, label: 'Text messages', value: realtimeConnected ? 'Realtime connected' : 'Waiting for connection' },
              { icon: Check, label: 'Typing & presence', value: realtimeConnected ? 'Realtime connected' : 'Waiting for connection' },
              { icon: Smartphone, label: 'Photo & voice uploads', value: 'Not available yet' },
            ])}
          </>
        ) : key === 'help' ? (
          <>
            <View style={[styles.noticeCard, { backgroundColor: t.primarySoft }]}>
              <View style={[styles.noticeIcon, { backgroundColor: t.card }]}><CircleHelp size={18} color={t.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.noticeTitle, { color: t.text }]}>What do you need help with?</Text>
                <Text style={[styles.noticeBody, { color: t.text2 }]}>Open pairing to connect accounts, or check server health if the app cannot reach Duora.</Text>
              </View>
            </View>
            {renderRows([
              { icon: Heart, label: 'Pairing & connection', value: 'Create or enter a code', action: 'pairing' },
              { icon: Wifi, label: 'Server health', value: 'Check API availability', action: 'server' },
              { icon: MessageCircle, label: 'Open chat', value: 'Requires a matched partner', action: 'chat' },
            ])}
          </>
        ) : (
          <View style={[styles.noticeCard, { backgroundColor: t.primarySoft }]}>
            <View style={[styles.noticeIcon, { backgroundColor: t.card }]}><InfoIcon /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.noticeTitle, { color: t.text }]}>Duora v{APP_VERSION}</Text>
              <Text style={[styles.noticeBody, { color: t.text2 }]}>Settings for this section are not available in the current build.</Text>
            </View>
          </View>
        )}
        <View style={{ height: 18 }} />
      </ScrollView>
    </View>
  );
}

function InfoIcon() {
  return <CircleHelp size={18} color="#e8497f" />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  appbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 8 },
  appbarTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  appbarSub: { fontSize: 10.5, marginTop: 2 },
  scroll: { flex: 1 },
  body: { paddingHorizontal: 18, paddingBottom: 28 },
  profileCard: { borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', padding: 20 },
  profilePhoto: { padding: 5, borderRadius: 60, backgroundColor: 'rgba(232,73,127,0.08)' },
  profileName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginTop: 12 },
  profileEmail: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  accountBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99, marginTop: 13 },
  accountBadgeText: { fontSize: 10, fontWeight: '800' },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginTop: 20, marginBottom: 9, paddingHorizontal: 2 },
  group: { borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  rowIcon: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 11.5, fontWeight: '700' },
  rowValue: { maxWidth: 140, fontSize: 10, fontWeight: '600', textAlign: 'right' },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 16, marginTop: 16 },
  ctaText: { color: '#fff', fontSize: 12.5, fontWeight: '800' },
  noticeCard: { borderRadius: 22, padding: 15, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  noticeIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  noticeTitle: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  noticeBody: { fontSize: 11, lineHeight: 16, marginTop: 4 },
});
