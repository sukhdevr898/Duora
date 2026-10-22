import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  ChevronRight,
  Heart,
  Info,
  LifeBuoy,
  Link2,
  Lock,
  Palette,
  Server,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { PageBackground } from '../../src/components/PageBackground';
import { PressableScale } from '../../src/components/ui';
import { Sheet } from '../../src/components/Overlay';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { accentList } from '../../src/theme/tokens';
import { useStore } from '../../src/state/store';
import { usePrivacy } from '../../src/state/privacy';
import { APP_VERSION } from '../../src/version';
import { privacyIconInfo } from '../../src/privacy/icons';

type Row = { key: string; label: string; icon: LucideIcon; value?: string };

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow, mode, accent } = useDuoraTheme();
  const user = useStore((s) => s.user);
  const home = useStore((s) => s.home);
  const privacyIcon = usePrivacy((s) => s.icon);
  const pairing = useStore((s) => s.pairing);
  const serverStatus = useStore((s) => s.server.status);
  const logout = useStore((s) => s.logout);
  const [aboutOpen, setAboutOpen] = useState(false);

  const accentInfo = accentList.find((item) => item.key === accent) ?? accentList[0];
  const userName = user?.displayName || 'Your account';
  const partner = home?.partner ?? null;
  const partnerName = partner?.nickname ?? partner?.displayName ?? 'Partner';
  const pairingActionLabel = home ? (home.linked ? 'Manage partner connection' : 'Connect with your partner') : 'Open pairing';
  const iconLabel = privacyIconInfo(privacyIcon).label;

  const rows: Row[] = [
    { key: 'pairing', label: 'Partner connection', icon: Heart, value: pairing?.phase === 'matched' || home?.linked ? 'Connected' : home ? 'Not paired' : 'Unavailable' },
    { key: 'profile', label: 'Account & profile', icon: UserRound },
    { key: 'appearance', label: 'Themes & appearance', icon: Palette, value: accentInfo.name },
    { key: 'privacy-icon', label: 'App icon', icon: ShieldCheck, value: iconLabel },
    { key: 'privacy', label: 'Privacy & security', icon: Lock },
    { key: 'notifications', label: 'Notifications', icon: Bell, value: 'Push not configured' },
    { key: 'server', label: 'Server health', icon: Server, value: serverStatus === 'online' ? 'Connected' : serverStatus === 'connecting' ? 'Connecting' : 'Offline' },
    { key: 'help', label: 'Help & support', icon: LifeBuoy },
    { key: 'about', label: 'About Duora', icon: Info, value: `v${APP_VERSION}` },
  ];

  const openRow = (key: string) => {
    if (key === 'pairing') router.push('/pairing');
    else if (key === 'profile') router.push('/settings/profile');
    else if (key === 'appearance') router.push('/appearance');
    else if (key === 'privacy-icon') router.push('/privacy-icon');
    else if (key === 'server') router.push('/server');
    else if (key === 'about') setAboutOpen(true);
    else if (key === 'notifications' || key === 'privacy' || key === 'help') router.push(`/settings/${key}`);
  };

  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.appbar, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.appbarTitle, { color: t.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <PressableScale
          onPress={() => router.push('/settings/profile')}
          accessibilityLabel="Open account profile"
          style={[styles.profile, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('sm')]}
        >
          <Avatar src={user?.avatarUrl ?? null} size={58} ring alt={userName} />
          <View style={styles.profileMeta}>
            <Text style={[styles.profileName, { color: t.text }]} numberOfLines={1}>{userName}</Text>
            <Text style={[styles.profileEmail, { color: t.text2 }]} numberOfLines={1}>{user?.email ?? 'Manage your account details'}</Text>
            <Text style={[styles.profileAction, { color: t.primary }]}>Account & profile</Text>
          </View>
          <ChevronRight size={18} strokeWidth={2.3} color={t.text3} />
        </PressableScale>

        {home?.linked && partner ? (
          <PressableScale onPress={() => router.push('/pairing')} accessibilityLabel="Manage partner connection" style={[styles.partnerCard, { backgroundColor: t.primarySoft }]}>
            <Avatar src={partner.avatarUrl} size={40} online={partner.online} alt={partnerName} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.partnerTitle, { color: t.text }]}>{partnerName}</Text>
              <Text style={[styles.partnerSub, { color: t.text2 }]}>{partner.online ? 'Online' : 'Presence unavailable'}</Text>
            </View>
            <Link2 size={17} color={t.primary} strokeWidth={2.1} />
          </PressableScale>
        ) : (
          <PressableScale onPress={() => router.push('/pairing')} accessibilityLabel={pairingActionLabel} style={[styles.partnerCard, { backgroundColor: t.primarySoft }]}>
            <View style={[styles.partnerIcon, { backgroundColor: t.card }]}><Heart size={19} color={t.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.partnerTitle, { color: t.text }]}>{home ? 'Connect with your partner' : 'Pairing status unavailable'}</Text>
              <Text style={[styles.partnerSub, { color: t.text2 }]}>{home ? 'Pair with a code or QR' : 'Check the server connection'}</Text>
            </View>
            <ChevronRight size={17} color={t.primary} strokeWidth={2.1} />
          </PressableScale>
        )}

        <Text style={[styles.sectionTitle, { color: t.text }]}>App & connection</Text>
        <View style={[styles.group, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('xs')]}>
          {rows.map(({ key, label, icon: Icon, value }, index) => (
            <PressableScale
              key={key}
              onPress={() => openRow(key)}
              accessibilityLabel={label}
              style={[styles.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: t.primarySoft }]}>
                <Icon size={16} strokeWidth={2.1} color={t.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: t.text }]} numberOfLines={1}>{label}</Text>
              {value ? (
                <Text style={[styles.rowValue, { color: key === 'server' ? (serverStatus === 'online' ? t.mint : serverStatus === 'connecting' ? t.peach : t.danger) : t.text3 }]} numberOfLines={1}>
                  {value}
                </Text>
              ) : null}
              <ChevronRight size={16} strokeWidth={2.1} color={t.text3} />
            </PressableScale>
          ))}
        </View>

        <View style={[styles.themeCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('xs')]}>
          <View style={[styles.themeGlyph, { backgroundColor: t.primarySoft }]}><Palette size={17} color={t.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.themeTitle, { color: t.text }]}>Your look, your way</Text>
            <Text style={[styles.themeSub, { color: t.text2 }]}>{accentInfo.name} · {mode} mode</Text>
          </View>
          <PressableScale onPress={() => router.push('/appearance')} accessibilityLabel="Customize theme">
            <View style={[styles.customize, { backgroundColor: t.primary }]}><Text style={styles.customizeText}>Customize</Text></View>
          </PressableScale>
        </View>

        <PressableScale
          onPress={() => {
            void logout();
            router.replace('/');
          }}
          accessibilityLabel="Sign out"
          style={[styles.signOut, { borderColor: `${t.danger}55`, backgroundColor: `${t.danger}0d` }]}
        >
          <Text style={[styles.signOutText, { color: t.danger }]}>Sign out</Text>
        </PressableScale>

        <View style={styles.foot}>
          <Text style={[styles.footBold, { color: t.text2 }]}>Duora · v{APP_VERSION}</Text>
          <Text style={[styles.footText, { color: t.text3 }]}>Always Together</Text>
        </View>
      </ScrollView>

      <Sheet visible={aboutOpen} onClose={() => setAboutOpen(false)} title="About Duora" subtitle="A shared space for two accounts.">
        <View style={[styles.aboutCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
          {[
            { label: 'Version', value: `${APP_VERSION} · React Native` },
            { label: 'Theme', value: `${accentInfo.name} · ${mode}` },
            { label: 'Connection', value: serverStatus === 'online' ? 'Connected' : serverStatus === 'connecting' ? 'Connecting' : 'Offline' },
          ].map((item, index) => (
            <View key={item.label} style={[styles.aboutRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}>
              <Text style={[styles.rowLabel, { color: t.text }]}>{item.label}</Text>
              <Text style={[styles.rowValue, { color: t.text2 }]}>{item.value}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.aboutBody, { color: t.text2 }]}>Messages, notes and pairing are served by your Duora account. Voice and video calls still need a media service.</Text>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  appbar: { paddingHorizontal: 20, paddingBottom: 10 },
  appbarTitle: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.9 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 26 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth },
  profileMeta: { flex: 1, minWidth: 0 },
  profileName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.35 },
  profileEmail: { fontSize: 11.5, fontWeight: '500', marginTop: 3 },
  profileAction: { fontSize: 10.5, fontWeight: '800', marginTop: 6 },
  partnerCard: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 12, padding: 13, borderRadius: 20 },
  partnerIcon: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  partnerTitle: { fontSize: 12.5, fontWeight: '800' },
  partnerSub: { fontSize: 10.5, fontWeight: '500', marginTop: 3 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginTop: 22, marginBottom: 9, paddingHorizontal: 2 },
  group: { borderRadius: 22, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, paddingVertical: 9 },
  rowIcon: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 12.2, fontWeight: '700', letterSpacing: -0.1 },
  rowValue: { maxWidth: 106, fontSize: 10, fontWeight: '600', textAlign: 'right' },
  themeCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, marginTop: 14 },
  themeGlyph: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  themeTitle: { fontSize: 12, fontWeight: '800' },
  themeSub: { fontSize: 10, fontWeight: '500', marginTop: 3, textTransform: 'capitalize' },
  customize: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 },
  customizeText: { color: '#fff', fontSize: 10.5, fontWeight: '800' },
  signOut: { marginTop: 18, height: 48, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  signOutText: { fontSize: 13, fontWeight: '800' },
  foot: { alignItems: 'center', marginTop: 20, gap: 3 },
  footBold: { fontSize: 11.5, fontWeight: '800' },
  footText: { fontSize: 10.5, fontWeight: '600' },
  aboutCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  aboutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 13 },
  aboutBody: { fontSize: 12, lineHeight: 18, marginTop: 12 },
});
