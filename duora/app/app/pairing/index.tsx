import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Heart,
  KeyRound,
  Link2,
  MessageSquare,
  QrCode,
  RefreshCw,
  ScanLine,
  Send,
  ShieldCheck,
  Sparkles,
  Unlink,
} from 'lucide-react-native';
import { Avatar } from '../../src/components/Avatar';
import { HeartOrb, LogoHearts } from '../../src/components/Brand';
import { PageBackground } from '../../src/components/PageBackground';
import { PairingQRCode } from '../../src/components/QRCode';
import { Btn, PressableScale } from '../../src/components/ui';
import { RichText } from '../../src/components/RichText';
import { useToast } from '../../src/components/Overlay';
import { useDuoraTheme } from '../../src/theme/ThemeProvider';
import { useStore } from '../../src/state/store';

export default function PairingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();
  const { toast } = useToast();

  const pairing = useStore((s) => s.pairing);
  const user = useStore((s) => s.user);
  const home = useStore((s) => s.home);
  const busy = useStore((s) => s.pairingBusy);
  const error = useStore((s) => s.pairingError);
  const loadPairing = useStore((s) => s.loadPairing);
  const createCode = useStore((s) => s.createCode);
  const acceptCode = useStore((s) => s.acceptCode);
  const unlink = useStore((s) => s.unlink);

  const [tab, setTab] = useState<'code' | 'qr'>('code');
  const [code, setCode] = useState('');
  const [celebrated, setCelebrated] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const previousPhase = useRef<string | null>(null);

  useEffect(() => {
    void loadPairing();
  }, [loadPairing]);

  // Celebrate the moment the server reports a fresh match.
  useEffect(() => {
    if (pairing?.phase === 'matched') {
      if (previousPhase.current && previousPhase.current !== 'matched') setCelebrated(true);
      previousPhase.current = 'matched';
    } else if (pairing?.phase) {
      previousPhase.current = pairing.phase;
    }
  }, [pairing?.phase]);

  const partnerName = pairing?.partner?.nickname ?? pairing?.partner?.displayName ?? 'ruhi';
  const partnerFullName = pairing?.partner?.displayName ?? 'Ruhi';
  const partnerPhoto = pairing?.partner?.avatarUrl ?? home?.partner?.avatarUrl ?? null;
  const myPhoto = user?.avatarUrl ?? null;

  const chars = code.padEnd(6, ' ').split('').slice(0, 6);

  const submit = async () => {
    if (code.length < 6) {
      toast('Enter the full 6-character code');
      return;
    }
    const ok = await acceptCode(code);
    if (ok) {
      setCode('');
      toast('Paired 💜');
    }
  };

  const copyCode = async () => {
    if (!pairing?.code) return;
    await Clipboard.setStringAsync(pairing.code);
    toast('Pairing code copied');
  };

  /* ---------------- celebration ---------------- */
  if (pairing?.phase === 'matched' && celebrated) {
    return (
      <View style={[styles.matched, { backgroundColor: t.bg }]}>
        <View style={[styles.matchedGlow, { backgroundColor: t.primaryGhost }]} />
        <View style={styles.matchedHearts}>
          {[
            { left: '12%', size: 16, delay: 0 },
            { left: '30%', size: 10, delay: 2.2 },
            { left: '68%', size: 13, delay: 1.1 },
            { left: '84%', size: 9, delay: 3.6 },
            { left: '48%', size: 8, delay: 5 },
          ].map((h, i) => (
            <Animated.View
              key={i}
              style={{ position: 'absolute', left: h.left as never, top: -20 }}
              entering={FadeIn.delay(h.delay * 100).duration(600)}
            >
              <Heart size={h.size} fill={t.primary2} color={t.primary2} />
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeIn.delay(100)} style={[styles.matchedBadge, { backgroundColor: t.primarySoft }]}>
          <Sparkles size={11} strokeWidth={2.6} color={t.primaryDeep} />
          <Text style={[styles.matchedBadgeText, { color: t.primaryDeep }]}>Love connection matched</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify().damping(14)} style={styles.avatarPair}>
          <Avatar src={myPhoto} size={76} alt="You" />
          <View style={styles.avatarLink}>
            <Heart size={16} fill={t.primary2} color={t.primary2} />
          </View>
          <Avatar src={partnerPhoto} size={76} alt={partnerFullName} online />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350)}>
          <Text style={[styles.matchedTitle, { color: t.text }]}>
            You &amp; {partnerName}
            {'\n'}are connected
          </Text>
          <Text style={[styles.matchedSub, { color: t.text2 }]}>
            Your private space is ready. Chat, call and keep every little memory — just the two of you.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(550)} style={styles.matchedActions}>
          <Btn
            label="Start chatting"
            icon={ArrowRight}
            onPress={() => {
              setCelebrated(false);
              router.replace('/chat');
            }}
          />
          <Btn
            label="Go to home"
            variant="soft"
            onPress={() => {
              setCelebrated(false);
              router.replace('/(tabs)');
            }}
          />
          <PressableScale
            onPress={() => {
              setCelebrated(false);
              void unlink();
              toast('Connection removed');
            }}
            accessibilityLabel="Unlink this connection"
          >
            <View style={styles.linkBtn}>
              <Unlink size={12} strokeWidth={2.4} color={t.text3} />
              <Text style={[styles.linkText, { color: t.text3 }]}>Unlink this connection</Text>
            </View>
          </PressableScale>
        </Animated.View>
      </View>
    );
  }

  /* ---------------- linked ---------------- */
  if (pairing?.phase === 'matched') {
    const since = pairing.matchedAt
      ? Math.max(1, Math.round((Date.now() - new Date(pairing.matchedAt).getTime()) / 86400000))
      : 1;

    return (
      <View style={styles.root}>
        <PageBackground />
        <View style={[styles.appbar, { paddingTop: insets.top + 8 }]}>
          <PressableScale onPress={() => router.back()} accessibilityLabel="Back">
            <ArrowLeft size={20} strokeWidth={2.4} color={t.text} />
          </PressableScale>
          <Text style={[styles.appbarTitle, { color: t.text }]}>Pairing &amp; connection</Text>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.body}>
            <View style={[styles.pairCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('md')]}>
              <View style={styles.avatarPair}>
                <Avatar src={myPhoto} size={66} alt="You" />
                <View style={styles.avatarLink}>
                  <Heart size={15} fill={t.primary2} color={t.primary2} />
                </View>
                <Avatar src={partnerPhoto} size={66} alt={partnerFullName} online />
              </View>

              <View style={[styles.matchedPill, { backgroundColor: t.primarySoft }]}>
                <ShieldCheck size={12} strokeWidth={2.6} color={t.primaryDeep} />
                <Text style={[styles.matchedPillText, { color: t.primaryDeep }]}>Matched</Text>
              </View>

              <Text style={[styles.pairTitle, { color: t.text }]}>You &amp; {partnerName}</Text>
              <Text style={[styles.pairSub, { color: t.text2 }]}>
                {`Connected ${since} days ago · locked to two people`}
              </Text>

              <Btn
                label="Open our chat"
                icon={MessageSquare}
                onPress={() => router.push('/chat')}
                style={{ marginTop: 18 }}
              />
            </View>

            <View style={[styles.group, { backgroundColor: t.card, marginTop: 16 }, shadow('sm')]}>
              {[
                {
                  icon: KeyRound,
                  name: 'Your pairing code',
                  detail: 'Share only with your person',
                  value: pairing.code ?? '—',
                },
                { icon: QrCode, name: 'QR pairing', detail: 'Show or scan a code in person' },
                {
                  icon: ShieldCheck,
                  name: 'Private by default',
                  detail: 'Only the two of you can read this space',
                },
              ].map((row, index) => {
                const Icon = row.icon;
                return (
                  <View
                    key={row.name}
                    style={[
                      styles.serviceRow,
                      index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
                    ]}
                  >
                    <View style={[styles.serviceIcon, { backgroundColor: t.primarySoft }]}>
                      <Icon size={15} strokeWidth={2.2} color={t.primaryDeep} />
                    </View>
                    <View style={styles.serviceMeta}>
                      <Text style={[styles.serviceName, { color: t.text }]}>{row.name}</Text>
                      <Text style={[styles.serviceDetail, { color: t.text3 }]}>{row.detail}</Text>
                    </View>
                    {row.value ? (
                      <Text style={[styles.serviceValue, { color: t.primaryDeep }]}>{row.value}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>

            <PressableScale
              onPress={() => {
                void unlink();
                toast('Connection removed — you are unpaired');
              }}
              accessibilityLabel="Unlink and pair again"
              style={[styles.unlinkBtn, { backgroundColor: '#fdeef1' }]}
            >
              <Unlink size={15} strokeWidth={2.4} color="#e5484d" />
              <Text style={styles.unlinkText}>Unlink &amp; pair again</Text>
            </PressableScale>
            <Text style={[styles.pairHint, { color: t.text3 }]}>
              Unlinking removes the shared space on this device. Your memories stay safe.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  /* ---------------- pair flow ---------------- */
  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.appbar, { paddingTop: insets.top + 8 }]}>
        <PressableScale onPress={() => router.back()} accessibilityLabel="Back">
          <ArrowLeft size={20} strokeWidth={2.4} color={t.text} />
        </PressableScale>
        <Text style={[styles.appbarTitle, { color: t.text }]}>Pair your person</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.body}>
          <View style={styles.introRow}>
            <View style={[styles.introIcon, { backgroundColor: t.primaryGhost }]}>
              <Link2 size={20} strokeWidth={2.2} color={t.primary} />
            </View>
            <Text style={[styles.introText, { color: t.text2 }]}>
              One code, one person. Once your partner accepts, your space is locked to the two of you.
            </Text>
          </View>

          <View style={[styles.tabs, { backgroundColor: t.fieldBg }]}>
            {[
              { key: 'code' as const, label: 'Pairing code', icon: KeyRound },
              { key: 'qr' as const, label: 'QR code', icon: QrCode },
            ].map(({ key, label, icon: Icon }) => (
              <PressableScale
                key={key}
                onPress={() => setTab(key)}
                accessibilityLabel={label}
                style={[
                  styles.tab,
                  tab === key && { backgroundColor: t.surface },
                ]}
              >
                <Icon size={13} strokeWidth={2.4} color={tab === key ? t.primaryDeep : t.text3} />
                <Text style={[styles.tabText, { color: tab === key ? t.primaryDeep : t.text3 }]}>{label}</Text>
              </PressableScale>
            ))}
          </View>

          {tab === 'code' ? (
            <Animated.View entering={FadeIn.duration(220)}>
              <View style={[styles.pairCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('sm')]}>
                <View style={styles.codeLabel}>
                  <KeyRound size={14} strokeWidth={2.4} color={t.text2} />
                  <Text style={[styles.codeLabelText, { color: t.text2 }]}>Enter partner&apos;s code</Text>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                  <PressableScale onPress={() => inputRef.current?.focus()} accessibilityLabel="Pairing code boxes">
                    <View style={styles.codeBoxes}>
                      {chars.map((ch, i) => (
                        <View
                          key={i}
                          style={[
                            styles.codeBox,
                            {
                              backgroundColor: t.fieldBg,
                              borderColor:
                                i === Math.min(code.length, 5) ? t.primary : t.line,
                            },
                          ]}
                        >
                          <Text style={[styles.codeChar, { color: t.text }]}>{ch.trim()}</Text>
                        </View>
                      ))}
                    </View>
                  </PressableScale>
                  <TextInput
                    ref={inputRef}
                    value={code}
                    onChangeText={(raw) => setCode(raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    onSubmitEditing={submit}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={6}
                    style={styles.hiddenInput}
                    accessibilityLabel="Partner pairing code"
                  />
                </KeyboardAvoidingView>

                <Text style={[styles.pairHint, { color: t.text3 }]}>
                  Codes are 6 characters — letters and numbers.
                </Text>

                {error ? <Text style={[styles.error, { color: t.danger }]}>{error}</Text> : null}

                <Btn
                  label="Send pairing request"
                  icon={Send}
                  onPress={submit}
                  disabled={code.length < 6 || busy}
                  style={{ marginTop: 14 }}
                />
              </View>

              <PressableScale
                onPress={() => {
                  void createCode();
                  toast('Your pairing code is ready');
                }}
                accessibilityLabel="Generate my pairing code"
                style={styles.linkBtn}
              >
                <Sparkles size={12} strokeWidth={2.4} color={t.primary} />
                <Text style={[styles.linkText, { color: t.primary }]}>Generate my own code to share</Text>
              </PressableScale>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(220)}>
              <View style={[styles.pairCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('sm')]}>
                <View style={styles.qrFrame}>
                  {pairing?.qrPayload ? (
                    <PairingQRCode value={pairing.qrPayload} size={190} />
                  ) : (
                    <View style={[styles.qrPlaceholder, { backgroundColor: t.fieldBg }]}>
                      <QrCode size={70} strokeWidth={1.4} color={t.text3} />
                    </View>
                  )}
                </View>

                <View style={[styles.codeBadge, { backgroundColor: t.primarySoft }]}>
                  <Text style={[styles.codeBadgeText, { color: t.primaryDeep }]}>
                    {pairing?.code ?? '------'}
                  </Text>
                </View>

                <Text style={[styles.pairHint, { color: t.text3 }]}>
                  Show this to {partnerName}, or scan hers. The code rotates for safety.
                </Text>

                <View style={styles.pairActions}>
                  <Btn
                    label="Copy"
                    icon={Copy}
                    variant="soft"
                    block={false}
                    onPress={copyCode}
                    style={{ flex: 1 }}
                  />
                  <Btn
                    label="Refresh"
                    icon={RefreshCw}
                    variant="soft"
                    block={false}
                    onPress={() => {
                      void createCode();
                      toast('Refreshed — new code generated');
                    }}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>

              <Btn
                label="Scan partner's QR"
                icon={ScanLine}
                onPress={() => router.push('/pairing/scan')}
                style={{ marginTop: 14 }}
              />
              <Text style={[styles.pairHint, { color: t.text3, textAlign: 'center', marginTop: 10 }]}>
                Both on Duora? Add her code instead — it works offline.
              </Text>
            </Animated.View>
          )}

          {/* how it works */}
          <View style={[styles.group, { backgroundColor: t.card, marginTop: 22 }, shadow('sm')]}>
            {[
              { icon: KeyRound, text: 'Share your 6-character code or QR' },
              { icon: Send, text: 'Your partner accepts the request' },
              { icon: ShieldCheck, text: 'Your private space is matched' },
            ].map(({ icon: Icon, text }, index) => (
              <View
                key={text}
                style={[
                  styles.serviceRow,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line },
                ]}
              >
                <View style={[styles.serviceIcon, { backgroundColor: t.primarySoft }]}>
                  <Icon size={15} strokeWidth={2.2} color={t.primaryDeep} />
                </View>
                <View style={styles.serviceMeta}>
                  <Text style={[styles.serviceName, { color: t.text }]}>{text}</Text>
                </View>
                <Text style={[styles.servicePing, { color: t.text3 }]}>{index + 1}/3</Text>
              </View>
            ))}
          </View>

          <View style={styles.footerRow}>
            <LogoHearts size={16} />
            <Text style={[styles.footerText, { color: t.text3 }]}>
              Only two people can ever be in this space
            </Text>
            <RichText text="💜" size={10} />
          </View>
          <View style={styles.footerOrb}>
            <HeartOrb size={34} tone="violet" />
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

  introRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 16, paddingHorizontal: 2 },
  introIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  introText: { flex: 1, fontSize: 11.5, lineHeight: 17, fontWeight: '500' },

  tabs: { flexDirection: 'row', padding: 4, borderRadius: 16, marginBottom: 14 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 13,
  },
  tabText: { fontSize: 12.5, fontWeight: '700' },

  pairCard: { padding: 18, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth },
  codeLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  codeLabelText: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  codeBoxes: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  codeBox: {
    flex: 1,
    aspectRatio: 0.82,
    maxHeight: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeChar: { fontSize: 21, fontWeight: '800', letterSpacing: 1 },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  pairHint: { fontSize: 11, lineHeight: 16, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  error: { fontSize: 12, fontWeight: '700', marginTop: 10, textAlign: 'center' },

  qrFrame: { alignItems: 'center', justifyContent: 'center' },
  qrPlaceholder: {
    width: 218,
    height: 218,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBadge: {
    alignSelf: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  codeBadgeText: { fontSize: 17, fontWeight: '800', letterSpacing: 4 },
  pairActions: { flexDirection: 'row', gap: 10, marginTop: 16 },

  group: { borderRadius: 22, overflow: 'hidden' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14 },
  serviceIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  serviceMeta: { flex: 1 },
  serviceName: { fontSize: 13, fontWeight: '700' },
  serviceDetail: { fontSize: 10.5, fontWeight: '500', marginTop: 1 },
  serviceValue: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  servicePing: { fontSize: 11, fontWeight: '700' },

  unlinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 999,
    marginTop: 16,
  },
  unlinkText: { color: '#e5484d', fontSize: 14, fontWeight: '700' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, justifyContent: 'center' },
  linkText: { fontSize: 12, fontWeight: '700' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  footerText: { fontSize: 11, fontWeight: '600' },
  footerOrb: { alignItems: 'center', marginTop: 14, opacity: 0.85 },

  avatarPair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  avatarLink: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    height: 26,
    paddingHorizontal: 11,
    borderRadius: 999,
    marginTop: 16,
  },
  matchedPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  pairTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4, marginTop: 10, textAlign: 'center' },
  pairSub: { fontSize: 11.5, marginTop: 4, textAlign: 'center' },

  matched: { flex: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 90 },
  matchedGlow: { position: 'absolute', top: -80, alignSelf: 'center', width: 320, height: 320, borderRadius: 160 },
  matchedHearts: { position: 'absolute', top: 0, left: 0, right: 0, height: 0 },
  matchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  matchedBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  matchedTitle: { fontSize: 27, lineHeight: 34, fontWeight: '800', letterSpacing: -0.8, marginTop: 22, textAlign: 'center' },
  matchedSub: { fontSize: 13, lineHeight: 19, marginTop: 10, textAlign: 'center' },
  matchedActions: { width: '100%', marginTop: 28, gap: 10 },
});
