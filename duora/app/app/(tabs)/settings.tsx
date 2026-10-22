import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  ChevronRight,
  Globe2,
  Heart,
  Info,
  Languages,
  LifeBuoy,
  Link2,
  Lock,
  MessageSquare,
  MessageSquareText,
  Moon,
  Palette,
  Phone,
  Server,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Video,
  type LucideIcon,
} from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { PageBackground } from '../../src/components/PageBackground';
import { PressableScale } from '../../src/components/ui';
import { RichText } from '../../src/components/RichText';
import { Sheet, useToast } from '../../src/components/Overlay';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { accentList } from '../../src/theme/tokens';
import { useStore } from '../../src/state/store';
import { usePrivacy } from '../../src/state/privacy';
import { APP_VERSION } from '../../src/version';
import { privacyIconInfo } from '../../src/privacy/icons';

type Row = {
  key: string;
  label: string;
  icon: LucideIcon;
  value?: string;
  toggle?: boolean;
};

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow, mode, themePreference, accent, loveMode } = useDuoraTheme();
  const { toast } = useToast();

  const user = useStore((s) => s.user);
  const home = useStore((s) => s.home);
  const privacyIcon = usePrivacy((s) => s.icon);
  const pairing = useStore((s) => s.pairing);
  const serverStatus = useStore((s) => s.server.status);
  const setThemePreference = useStore((s) => s.setThemePreference);
  const setLoveMode = useStore((s) => s.setLoveMode);
  const logout = useStore((s) => s.logout);

  const [notifications, setNotifications] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const accentInfo = accentList.find((a) => a.key === accent) ?? accentList[0];
  const privacyLabel = privacyIconInfo(privacyIcon).label;
  const partner = home?.partner ?? null;
  const partnerName = partner?.nickname ?? partner?.displayName ?? 'Your person';

  const accountRows: Row[] = [
    { key: 'account', label: 'Account', icon: User, value: user?.displayName ?? 'You' },
    { key: 'chat', label: 'Chat Settings', icon: MessageSquare },
    { key: 'notifications', label: 'Notifications', icon: Bell, toggle: true },
    { key: 'privacy', label: 'Privacy & Security', icon: Lock },
  ];

  const appRows: Row[] = [
    { key: 'appearance', label: 'Appearance & theme', icon: Palette, value: accentInfo.name },
    { key: 'privacy-icon', label: 'App icon & privacy', icon: ShieldCheck, value: privacyLabel },
    {
      key: 'server',
      label: 'Server health',
      icon: Server,
      value: serverStatus === 'online' ? 'Connected' : serverStatus === 'connecting' ? 'Reconnecting' : 'Offline',
    },
    {
      key: 'pairing',
      label: 'Pairing & connection',
      icon: Link2,
      value: pairing?.phase === 'matched' ? 'Matched' : 'Not paired',
    },
    { key: 'language', label: 'Language', icon: Globe2, value: 'English' },
    { key: 'help', label: 'Help & Support', icon: LifeBuoy },
    { key: 'about', label: 'About Duora', icon: Info, value: `v${APP_VERSION}` },
  ];

  const onRow = (row: Row) => {
    if (row.key === 'appearance') router.push('/appearance');
    else if (row.key === 'privacy-icon') router.push('/privacy-icon');
    else if (row.key === 'server') router.push('/server');
    else if (row.key === 'pairing') router.push('/pairing');
    else if (row.key === 'about') setAboutOpen(true);
    else router.push(`/settings/${row.key === 'chat' ? 'chat-settings' : row.key}`);
  };

  const renderRow = (row: Row) => {
    const Icon = row.icon;
    const isServer = row.key === 'server';
    return (
      <PressableScale
        key={row.key}
        onPress={() => onRow(row)}
        accessibilityLabel={row.label}
        style={styles.row}
      >
        <View style={[styles.rowIcon, { backgroundColor: t.primarySoft }]}>
          <Icon size={16} strokeWidth={2.1} color={t.primaryDeep} />
        </View>
        <Text style={[styles.rowLabel, { color: t.text }]}>{row.label}</Text>
        {isServer ? (
          <View style={[styles.serverPill, { backgroundColor: t.chipBg, borderColor: t.line }]}>
            <View
              style={[
                styles.serverDot,
                {
                  backgroundColor:
                    serverStatus === 'online' ? t.mint : serverStatus === 'connecting' ? t.peach : t.danger,
                },
              ]}
            />
            <Text style={[styles.serverText, { color: t.text2 }]}>{row.value}</Text>
          </View>
        ) : row.value ? (
          <Text style={[styles.rowValue, { color: t.text3 }]}>{row.value}</Text>
        ) : null}
        {row.toggle ? (
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: t.line, true: t.primary }}
            thumbColor="#fff"
            accessibilityLabel="Notifications"
          />
        ) : (
          <ChevronRight size={17} strokeWidth={2.2} color="#c2bbd4" />
        )}
      </PressableScale>
    );
  };

  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.appbar, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.appbarTitle, { color: t.text }]}>Settings</Text>
        <View style={[styles.badge, { backgroundColor: t.primarySoft }]}>
          <Sparkles size={10} strokeWidth={2.6} color={t.primaryDeep} />
          <Text style={[styles.badgeText, { color: t.primaryDeep }]}>Premium</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <PressableScale
            onPress={() => setProfileOpen(true)}
            accessibilityLabel="Partner profile"
            style={[styles.profile, { backgroundColor: t.card }, shadow('sm')]}
          >
            <Avatar src={partner?.avatarUrl ?? null} size={50} ring online={partner?.online} alt={partnerName} />
            <View style={styles.profileMeta}>
              <View style={styles.profileNameRow}>
                <Text style={[styles.profileName, { color: t.text }]}>{partnerName}</Text>
                <Heart size={12} fill={t.primary2} color={t.primary2} />
              </View>
              <View style={styles.profileStatus}>
                <View style={[styles.onlineDot, { backgroundColor: partner?.online ? t.mint : t.text3 }]} />
                <Text style={[styles.profileStatusText, { color: t.text2 }]}>
                  {partner?.online ? 'Online' : 'Away'} · {accentInfo.name}
                </Text>
              </View>
            </View>
            <ChevronRight size={17} strokeWidth={2.4} color={t.primary} />
          </PressableScale>

          <View style={[styles.group, { backgroundColor: t.card }, shadow('sm')]}>
            {accountRows.slice(0, 1).map(renderRow)}
          </View>
          <View style={[styles.group, { backgroundColor: t.card }, shadow('sm')]}>
            {accountRows.slice(1).map(renderRow)}
          </View>

          <Text style={[styles.groupTitle, { color: t.text }]}>App &amp; connection</Text>
          <View style={[styles.group, { backgroundColor: t.card }, shadow('sm')]}>
            {appRows.map(renderRow)}
          </View>

          <View style={styles.quickRow}>
            <PressableScale
              onPress={() => {
                const next = mode === 'dark' ? 'light' : 'dark';
                setThemePreference(next);
                toast(`${next === 'dark' ? 'Dark' : 'Light'} mode on`);
              }}
              accessibilityLabel={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={styles.quickBtn}
            >
              <LinearGradient
                colors={['#2b2140', '#1a1330']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickDark}
              >
                {mode === 'dark' ? (
                  <Sun size={14} strokeWidth={2.2} color="#f4eeff" />
                ) : (
                  <Moon size={14} strokeWidth={2.2} color="#f4eeff" />
                )}
                <Text style={styles.quickDarkText}>{mode === 'dark' ? 'Light mode' : 'Dark mode'}</Text>
              </LinearGradient>
            </PressableScale>

            <PressableScale
              onPress={() => {
                setLoveMode(!loveMode);
                toast(loveMode ? 'Love mode off' : 'Love mode on 💜');
              }}
              accessibilityLabel="Toggle love theme"
              style={[styles.quickBtn, { backgroundColor: t.primarySoft, borderColor: t.primaryGhost }]}
            >
              <Languages size={14} strokeWidth={2.2} color={t.primaryDeep} />
              <Text style={[styles.quickLoveText, { color: t.primaryDeep }]}>Love theme</Text>
            </PressableScale>
          </View>

          <PressableScale
            onPress={() => {
              void logout();
              router.replace('/');
            }}
            accessibilityLabel="Sign out"
            style={[styles.signOut, { borderColor: t.lineStrong }]}
          >
            <Text style={[styles.signOutText, { color: t.danger }]}>Sign out</Text>
          </PressableScale>

          <View style={styles.foot}>
            <Text style={[styles.footBold, { color: t.text2 }]}>Duora v{APP_VERSION}</Text>
            <Text style={[styles.footText, { color: t.text3 }]}>
              Just You &amp; Me · made with <RichText text="💜" size={10} /> for two
            </Text>
          </View>
        </View>
      </ScrollView>

      <Sheet
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
        title={partnerName}
        subtitle="Your person. Your private space."
      >
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Avatar src={partner?.avatarUrl ?? null} size={92} ring online={partner?.online} alt={partnerName} />
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.sheetTitle, { color: t.text }]}>{partnerName}</Text>
            <Text style={[styles.sheetSub, { color: t.text2 }]}>
              Paired with {user?.displayName ?? 'you'} · {home?.daysTogether ?? 0} days together
            </Text>
          </View>
          <View style={styles.sheetActions}>
            <PressableScale
              onPress={() => {
                setProfileOpen(false);
                router.push('/chat');
              }}
              accessibilityLabel="Message"
              style={[styles.sheetPrimary, { backgroundColor: t.primary }]}
            >
              <MessageSquareText size={16} strokeWidth={2.2} color="#fff" />
              <Text style={styles.sheetPrimaryText}>Message</Text>
            </PressableScale>
            <PressableScale
              onPress={() => {
                setProfileOpen(false);
                router.push('/call/audio');
              }}
              accessibilityLabel="Voice call"
              style={[styles.sheetRound, { backgroundColor: t.surfaceSoft }]}
            >
              <Phone size={19} strokeWidth={2.2} color={t.primaryDeep} />
            </PressableScale>
            <PressableScale
              onPress={() => {
                setProfileOpen(false);
                router.push('/call/video');
              }}
              accessibilityLabel="Video call"
              style={[styles.sheetRound, { backgroundColor: t.surfaceSoft }]}
            >
              <Video size={19} strokeWidth={2.2} color={t.primaryDeep} />
            </PressableScale>
          </View>
          <PressableScale
            onPress={() => {
              setProfileOpen(false);
              router.push('/pairing');
            }}
            accessibilityLabel="Manage pairing"
          >
            <View style={styles.linkBtn}>
              <Link2 size={12} strokeWidth={2.4} color={t.primary} />
              <Text style={[styles.linkText, { color: t.primary }]}>Manage pairing</Text>
            </View>
          </PressableScale>
          <View style={styles.matchedRow}>
            <Heart size={12} fill={t.primary2} color={t.primary2} />
            <Text style={[styles.matchedText, { color: t.text3 }]}>
              Matched on Duora · {home?.pairedAt ? new Date(home.pairedAt).toLocaleDateString('en-GB') : '—'}
            </Text>
          </View>
        </View>
      </Sheet>

      <Sheet visible={aboutOpen} onClose={() => setAboutOpen(false)} title="About Duora" subtitle="Two hearts. One private space.">
        <View style={{ gap: 10 }}>
          <View style={[styles.group, { backgroundColor: t.card, marginTop: 0 }]}>
            {[
              { label: 'Version', value: `${APP_VERSION} (Expo · React Native)` },
              { label: 'Design', value: accentInfo.name },
              { label: 'Mode', value: themePreference === 'system' ? `System · ${mode}` : themePreference },
              { label: 'Made for', value: 'Exactly two people' },
            ].map((row, index) => (
              <View
                key={row.label}
                style={[styles.aboutRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}
              >
                <Text style={[styles.rowLabel, { color: t.text }]}>{row.label}</Text>
                <Text style={[styles.rowValue, { color: t.text3 }]}>{row.value}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.aboutBody, { color: t.text2 }]}>
            Duora is a private space for two — chat, call, and keep the little memories that belong
            only to you.
          </Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  appbarTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.9 },
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
  body: { paddingHorizontal: 18, paddingBottom: 26 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 13,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  profileMeta: { flex: 1 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: { fontSize: 16.5, fontWeight: '800', letterSpacing: -0.3 },
  profileStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  profileStatusText: { fontSize: 12, fontWeight: '600' },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  group: { marginTop: 14, borderRadius: 22, overflow: 'hidden' },
  groupTitle: { fontSize: 13.5, fontWeight: '800', marginTop: 20, marginBottom: 8, paddingHorizontal: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, paddingHorizontal: 14 },
  rowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 13.5, fontWeight: '700', letterSpacing: -0.1 },
  rowValue: { fontSize: 12, fontWeight: '600' },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  serverDot: { width: 6, height: 6, borderRadius: 3 },
  serverText: { fontSize: 10, fontWeight: '700' },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  quickBtn: { flex: 1 },
  quickDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 46,
    borderRadius: 16,
  },
  quickDarkText: { color: '#f4eeff', fontSize: 12, fontWeight: '700' },
  quickLoveText: { fontSize: 12, fontWeight: '700' },
  signOut: {
    marginTop: 16,
    height: 46,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { fontSize: 13, fontWeight: '700' },
  foot: { alignItems: 'center', marginTop: 20, gap: 3 },
  footBold: { fontSize: 12, fontWeight: '800' },
  footText: { fontSize: 11, fontWeight: '600' },
  sheetTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  sheetSub: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginTop: 4 },
  sheetPrimary: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sheetPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sheetRound: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { fontSize: 12, fontWeight: '700' },
  matchedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchedText: { fontSize: 11, fontWeight: '600' },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, paddingHorizontal: 14 },
  aboutBody: { fontSize: 12.5, lineHeight: 19, marginTop: 4 },
});
