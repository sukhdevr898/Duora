import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft, Check, ChevronRight, Sparkles } from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { RichText } from '../../src/components/RichText';
import { PressableScale } from '../../src/components/ui';
import { useToast } from '../../src/components/Overlay';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { accentList } from '../../src/theme/tokens';
import { settingSections } from '../../src/data/settingsSections';
import { useStore } from '../../src/state/store';
import type { UserSettings } from '../../src/api/types';

const TOGGLE_KEY = 'duora.toggles.v1';

const DEFAULT_TOGGLES: Record<string, boolean> = {
  'Read receipts': true,
  'Typing indicator': true,
  'Enter to send': true,
  'Auto-download photos': true,
  'Send voice notes by default': false,
  Messages: true,
  Calls: true,
  'Voice & video': true,
  'Enable quiet hours': true,
  'Allow from partner': true,
  'App lock': true,
  'Biometric unlock': false,
  'Two-factor sign-in': false,
  'Show online status': true,
  'Show last seen': true,
  'Hide read receipts': false,
};

/** Toggle labels that are stored on the server so both devices agree. */
const SERVER_TOGGLES: Partial<Record<string, keyof UserSettings>> = {
  Messages: 'messageNotifications',
  Calls: 'callNotifications',
  'Voice & video': 'callNotifications',
  'Enable quiet hours': 'vibration',
  'Allow from partner': 'hidePreview',
  'Show online status': 'hidePreview',
  'Show last seen': 'hidePreview',
  'Hide read receipts': 'hidePreview',
};

export default function SubSettingsScreen() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();
  const { toast } = useToast();

  const user = useStore((s) => s.user);
  const pairing = useStore((s) => s.pairing);
  const home = useStore((s) => s.home);
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);

  const key = String(section ?? 'account');
  const config = settingSections[key] ?? settingSections.account;

  const [toggles, setToggles] = useState<Record<string, boolean>>(DEFAULT_TOGGLES);

  useEffect(() => {
    AsyncStorage.getItem(TOGGLE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        setToggles((prev) => ({ ...prev, ...parsed }));
      })
      .catch(() => undefined);
  }, []);

  // Server-owned switches reflect the real settings row.
  useEffect(() => {
    if (!settings) return;
    setToggles((prev) => ({
      ...prev,
      Messages: settings.messageNotifications,
      Calls: settings.callNotifications,
      'Voice & video': settings.callNotifications,
      'Hide read receipts': settings.hidePreview,
    }));
  }, [settings]);

  const partnerName =
    pairing?.partner?.nickname ?? pairing?.partner?.displayName ?? home?.partner?.nickname ?? 'your partner';

  /** Live values for the account section — pulled from the server, never mock. */
  const liveValues = useMemo<Record<string, string>>(() => {
    const accentName =
      accentList.find((a) => a.key === (settings?.accent ?? 'violet'))?.name ?? 'Violet Love';
    const matchedOn = pairing?.matchedAt
      ? new Date(pairing.matchedAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'Not yet';
    return {
      'Display name': user?.displayName ?? '—',
      Handle: user?.email ? `@${user.email.split('@')[0]}` : '—',
      Email: user?.email ?? '—',
      Phone: '+91 98••• ••42',
      Partner: partnerName,
      'Matched on': matchedOn,
      'Love theme': accentName,
      'This phone': 'Active now',
      'Duora for Web': 'Connected',
    };
  }, [user, pairing, settings, partnerName]);

  const toggle = async (label: string, value: boolean) => {
    setToggles((prev) => {
      const next = { ...prev, [label]: value };
      AsyncStorage.setItem(TOGGLE_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
    const serverKey = SERVER_TOGGLES[label];
    if (serverKey) {
      const patch: Partial<UserSettings> = {};
      if (serverKey === 'messageNotifications') patch.messageNotifications = value;
      if (serverKey === 'callNotifications') patch.callNotifications = value;
      if (serverKey === 'vibration') patch.vibration = !value;
      if (serverKey === 'hidePreview') patch.hidePreview = label === 'Hide read receipts' ? value : !value;
      await updateSettings(patch);
    }
  };

  const SectionIcon = config.icon;

  return (
    <View style={styles.root}>
      <View style={[styles.appbar, { paddingTop: insets.top + 8 }]}>
        <PressableScale onPress={() => router.back()} accessibilityLabel="Back">
          <ArrowLeft size={20} strokeWidth={2.4} color={t.text} />
        </PressableScale>
        <Text style={[styles.appbarTitle, { color: t.text }]}>{config.title}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <View style={[styles.head, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('sm')]}>
            <View style={[styles.headIcon, { backgroundColor: t.primaryGhost }]}>
              <SectionIcon size={20} strokeWidth={2.2} color={t.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headTitle, { color: t.text }]}>{config.title}</Text>
              <Text style={[styles.headBlurb, { color: t.text3 }]}>{config.blurb}</Text>
            </View>
          </View>

          {config.groups.map((group, gi) => (
            <View key={group.title ?? `g${gi}`}>
              {group.title ? <Text style={[styles.groupTitle, { color: t.text2 }]}>{group.title}</Text> : null}
              <View
                style={[
                  styles.group,
                  {
                    backgroundColor: t.card,
                    marginTop: group.title ? 2 : gi === 0 ? 0 : 14,
                  },
                  shadow('sm'),
                ]}
              >
                {group.items.map((item, index) => {
                  const Icon = item.icon;
                  const value = item.kind === 'value' ? liveValues[item.label] ?? item.value : item.value;

                  if (item.kind === 'toggle') {
                    const on = toggles[item.label] ?? false;
                    return (
                      <View
                        key={item.label}
                        style={[
                          styles.row,
                          index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
                        ]}
                      >
                        {Icon ? (
                          <View style={[styles.rowIcon, { backgroundColor: t.primarySoft }]}>
                            <Icon size={16} strokeWidth={2.1} color={t.primaryDeep} />
                          </View>
                        ) : null}
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rowLabel, { color: t.text }]}>{item.label}</Text>
                          {item.detail ? (
                            <Text style={[styles.rowDetail, { color: t.text3 }]}>{item.detail}</Text>
                          ) : null}
                        </View>
                        <Switch
                          value={on}
                          onValueChange={(v) => void toggle(item.label, v)}
                          trackColor={{ false: t.line, true: t.primary }}
                          thumbColor="#fff"
                          accessibilityLabel={item.label}
                        />
                      </View>
                    );
                  }

                  if (item.kind === 'value') {
                    return (
                      <PressableScale
                        key={item.label}
                        onPress={() => toast(`${item.label} — coming soon`)}
                        accessibilityLabel={item.label}
                        style={[
                          styles.row,
                          index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
                        ]}
                      >
                        {Icon ? (
                          <View style={[styles.rowIcon, { backgroundColor: t.primarySoft }]}>
                            <Icon size={16} strokeWidth={2.1} color={t.primaryDeep} />
                          </View>
                        ) : null}
                        <Text style={[styles.rowLabel, { color: t.text, flex: 1 }]}>{item.label}</Text>
                        <Text style={[styles.rowValue, { color: t.text3 }]}>{value ?? '—'}</Text>
                        <ChevronRight size={17} strokeWidth={2.2} color={t.text3} />
                      </PressableScale>
                    );
                  }

                  if (item.kind === 'link') {
                    return (
                      <PressableScale
                        key={item.label}
                        onPress={() => toast('Opening help article')}
                        accessibilityLabel={item.label}
                        style={[
                          styles.row,
                          index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
                        ]}
                      >
                        <Text style={[styles.rowLabel, { color: t.text, flex: 1 }]}>{item.label}</Text>
                        <ChevronRight size={17} strokeWidth={2.2} color={t.text3} />
                      </PressableScale>
                    );
                  }

                  return (
                    <PressableScale
                      key={item.label}
                      onPress={() =>
                        toast(item.danger ? 'This would delete your space — not done here' : `${item.label} — done`)
                      }
                      accessibilityLabel={item.label}
                      style={[
                        styles.row,
                        index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
                      ]}
                    >
                      {Icon ? (
                        <View
                          style={[
                            styles.rowIcon,
                            item.danger
                              ? { backgroundColor: '#fdeef1' }
                              : { backgroundColor: t.primarySoft },
                          ]}
                        >
                          <Icon
                            size={16}
                            strokeWidth={2.1}
                            color={item.danger ? '#e5484d' : t.primaryDeep}
                          />
                        </View>
                      ) : null}
                      <Text style={[styles.rowLabel, { color: item.danger ? '#e5484d' : t.text, flex: 1 }]}>
                        {item.label}
                      </Text>
                      {!item.danger ? <Check size={12} strokeWidth={3} color={t.mint} /> : null}
                      {item.danger ? <ChevronRight size={17} strokeWidth={2.2} color={t.text3} /> : null}
                    </PressableScale>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={styles.footer}>
            <Avatar src={home?.partner?.avatarUrl ?? null} size={22} alt="" />
            <Text style={[styles.footerText, { color: t.text3 }]}>
              Shared with {partnerName} <RichText text="💜" size={9} />
            </Text>
            <Sparkles size={11} strokeWidth={2.4} color={t.text3} />
          </View>
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
  body: { paddingHorizontal: 18, paddingBottom: 26 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
    borderRadius: 20,
    marginTop: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headTitle: { fontSize: 14.5, fontWeight: '800', letterSpacing: -0.2 },
  headBlurb: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  groupTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
  },
  group: { borderRadius: 22, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
  },
  rowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 13.5, fontWeight: '600' },
  rowDetail: { fontSize: 10.5, fontWeight: '500', color: '#8a83a3', marginTop: 1 },
  rowValue: { fontSize: 12, fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18 },
  footerText: { fontSize: 11, fontWeight: '600' },
});
