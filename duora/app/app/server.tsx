import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import {
  Activity,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  CloudOff,
  Database,
  Globe2,
  Loader2,
  PlugZap,
  Radio,
  RefreshCw,
  Server,
  Wifi,
} from 'lucide-react-native';
import { PageBackground } from '../src/components/PageBackground';
import { Btn, PressableScale } from '../src/components/ui';
import { useDuoraTheme } from '../src/theme/ThemeProvider';
import { useStore } from '../src/state/store';
import { describeBaseUrl, normalizeBaseUrl } from '../src/api/client';

const STATUS_COPY = {
  online: { label: 'API connected', sub: 'The configured Duora server responded to its health check', color: '#239e7a' },
  connecting: { label: 'Checking connection', sub: 'Waiting for the configured server to respond', color: '#d9912b' },
  offline: { label: 'API unavailable', sub: 'The configured Duora server did not respond', color: '#e84955' },
} as const;

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function timeAgo(ts: number, now: number) {
  const diff = Math.max(0, Math.round((now - ts) / 1000));
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  return `${Math.floor(diff / 60)}m ago`;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const width = 286;
  const height = 58;
  const max = Math.max(...data, 60);
  const min = Math.min(...data, 20);
  const points = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * width;
    const y = height - ((v - min) / Math.max(1, max - min)) * (height - 10) - 5;
    return [x, y] as const;
  });
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const last = points[points.length - 1];

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {[0.25, 0.5, 0.75].map((p) => (
        <Line
          key={p}
          x1="0"
          x2={width}
          y1={height * p}
          y2={height * p}
          stroke={color}
          strokeOpacity={0.08}
          strokeDasharray="3 4"
        />
      ))}
      <Path d={area} fill={color} fillOpacity={0.16} />
      <Path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {last ? <Circle cx={last[0]} cy={last[1]} r={2.6} fill={color} /> : null}
    </Svg>
  );
}

export default function ServerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, shadow } = useDuoraTheme();

  const server = useStore((s) => s.server);
  const health = useStore((s) => s.health);
  const checkServer = useStore((s) => s.checkServer);
  const loadHealth = useStore((s) => s.loadHealth);
  const setAutoReconnect = useStore((s) => s.setAutoReconnect);
  const serverUrl = useStore((s) => s.serverUrl);
  const setServerUrl = useStore((s) => s.setServerUrl);
  const testServerUrl = useStore((s) => s.testServerUrl);

  const [now, setNow] = useState(Date.now());
  const [checking, setChecking] = useState(false);
  const [draftUrl, setDraftUrl] = useState(serverUrl);
  const [urlBusy, setUrlBusy] = useState(false);
  const [urlNote, setUrlNote] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    setDraftUrl(serverUrl);
  }, [serverUrl]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    void loadHealth();
    // The ping measures the real round-trip from this device — the server's
    // own number is sub-millisecond on a local network and useless here.
    void checkServer();
    return () => clearInterval(id);
  }, [loadHealth, checkServer]);

  const copy = STATUS_COPY[server.status];
  const latencyPct = server.status === 'online' ? Math.min(100, Math.max(12, 100 - server.latency / 2)) : 0;
  const circumference = 2 * Math.PI * 52;

  const services = (health?.services ?? []).map((service) => service.name === 'media'
    ? { ...service, label: 'Voice & video media', status: 'degraded' as const, detail: 'Signalling only · no media engine configured' }
    : service);

  const icons = [Server, Radio, Database, PlugZap, BellRing];

  const onCheck = async () => {
    setChecking(true);
    try {
      await Promise.all([checkServer(), loadHealth()]);
    } finally {
      setChecking(false);
    }
  };

  const onTestUrl = async () => {
    setUrlBusy(true);
    setUrlNote(null);
    const result = await testServerUrl(draftUrl);
    setUrlNote(result);
    setUrlBusy(false);
  };

  const onSaveUrl = async () => {
    setUrlBusy(true);
    setUrlNote(null);
    const result = await testServerUrl(draftUrl);
    if (!result.ok) {
      setUrlNote(result);
      setUrlBusy(false);
      return;
    }
    await setServerUrl(draftUrl);
    setDraftUrl(normalizeBaseUrl(draftUrl));
    setUrlNote({ ok: true, message: `Connected to ${normalizeBaseUrl(draftUrl)}` });
    setUrlBusy(false);
    void loadHealth();
  };

  return (
    <View style={styles.root}>
      <PageBackground />
      <View style={[styles.appbar, { paddingTop: insets.top + 8 }]}>
        <PressableScale onPress={() => router.back()} accessibilityLabel="Back">
          <ArrowLeft size={20} strokeWidth={2.4} color={t.text} />
        </PressableScale>
        <Text style={[styles.appbarTitle, { color: t.text }]}>Server health</Text>
        <View style={styles.spacer} />
        <View
          style={[
            styles.pill,
            {
              backgroundColor: t.chipBg,
              borderColor: t.line,
            },
          ]}
        >
          <View
            style={[
              styles.pillDot,
              {
                backgroundColor:
                  server.status === 'online' ? t.mint : server.status === 'connecting' ? t.peach : t.danger,
              },
            ]}
          />
          <Text style={[styles.pillText, { color: t.text2 }]}>
            {server.status === 'online' ? 'API online' : server.status === 'connecting' ? 'Checking' : 'Offline'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: 6 }}>
          <View
            style={[
              styles.healthCard,
              { backgroundColor: t.card, borderColor: t.cardBorder },
              shadow('md'),
            ]}
          >
            <View style={styles.ring}>
              <Svg width={138} height={138} viewBox="0 0 120 120" style={styles.ringSvg}>
                <Circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={t.line}
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <Circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={copy.color}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - latencyPct / 100)}
                  opacity={server.status === 'online' ? 1 : 0.4}
                />
              </Svg>
              <View style={[styles.ringCore, { backgroundColor: t.surface }]}>
                {server.status === 'online' ? (
                  <CheckCircle2 size={36} strokeWidth={2.2} color={copy.color} />
                ) : server.status === 'connecting' ? (
                  <Loader2 size={36} strokeWidth={2.2} color={copy.color} />
                ) : (
                  <CloudOff size={36} strokeWidth={2.2} color={copy.color} />
                )}
              </View>
            </View>

            <Text style={[styles.healthStatus, { color: copy.color }]}>{copy.label}</Text>
            <Text style={[styles.healthSub, { color: t.text2 }]}>{copy.sub}</Text>
            <View style={styles.endpoint}>
              <Globe2 size={11} strokeWidth={2.4} color={t.text3} />
              <Text style={[styles.endpointText, { color: t.text3 }]}>
                {describeBaseUrl()}
              </Text>
            </View>

            <View style={styles.actionPair}>
              <Btn
                label={checking ? 'Checking…' : 'Check again'}
                icon={RefreshCw}
                onPress={() => void onCheck()}
                loading={checking}
                block
              />
            </View>
          </View>

          {server.status === 'offline' ? (
            <View style={[styles.banner, { backgroundColor: t.danger + '18', borderColor: t.danger + '44' }]}>
              <Wifi size={15} strokeWidth={2.4} color={t.danger} />
              <Text style={[styles.bannerText, { color: t.text2 }]}>
                The server could not be reached. Sending messages and pairing may be unavailable until the connection returns.
              </Text>
            </View>
          ) : null}

          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: t.text }]}>Server address</Text>
            <Text style={[styles.sectionMeta, { color: t.text3 }]}>where the app connects</Text>
          </View>

          <View style={[styles.group, { backgroundColor: t.card }, shadow('sm')]}>
            <View style={styles.urlField}>
              <Globe2 size={15} strokeWidth={2.3} color={t.text3} />
              <TextInput
                value={draftUrl}
                onChangeText={setDraftUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="https://duora.onrender.com"
                placeholderTextColor={t.text3}
                style={[styles.urlInput, { color: t.text }]}
                accessibilityLabel="Server address"
              />
            </View>
            <View style={styles.urlActions}>
              <View style={styles.urlSlot}>
                <Btn
                  label={urlBusy ? 'Testing…' : 'Test'}
                  variant="outline"
                  onPress={() => void onTestUrl()}
                  disabled={urlBusy}
                  block={false}
                />
              </View>
              <View style={styles.urlSlot}>
                <Btn
                  label="Save & connect"
                  onPress={() => void onSaveUrl()}
                  loading={urlBusy}
                  block={false}
                />
              </View>
            </View>
            {urlNote ? (
              <Text
                style={[
                  styles.urlNote,
                  { color: urlNote.ok ? t.mint : t.danger },
                ]}
              >
                {urlNote.message}
              </Text>
            ) : null}
            <Text style={[styles.urlHint, { color: t.text3 }]}>
              Paste the address of your own Render deployment if the default one is asleep or was
              redeployed.
            </Text>
          </View>

          <View style={styles.metricGrid}>
            {[
              { label: 'Latency', value: server.status === 'online' ? `${server.latency}` : '—', unit: 'ms' },
              { label: 'Uptime', value: health ? formatUptime(health.uptimeSeconds) : '—', unit: '' },
              { label: 'Region', value: health?.region ?? server.region, unit: '' },
              { label: 'Last checked', value: server.lastChecked ? timeAgo(server.lastChecked, now) : 'Not checked', unit: '' },
            ].map((metric, index) => (
              <View
                key={metric.label}
                style={[
                  styles.metric,
                  {
                    backgroundColor: t.card,
                    borderColor: t.cardBorder,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderLeftWidth: index % 2 === 0 ? StyleSheet.hairlineWidth : 0,
                  },
                  shadow('xs'),
                ]}
              >
                <Text style={[styles.metricLabel, { color: t.text3 }]}>{metric.label}</Text>
                <Text style={[styles.metricValue, { color: t.text }]}>
                  {metric.value}
                  {metric.unit ? <Text style={styles.metricUnit}> {metric.unit}</Text> : null}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.sparkCard, { backgroundColor: t.card, borderColor: t.cardBorder }, shadow('sm')]}>
            <View style={styles.sparkHead}>
              <View style={styles.sparkTitle}>
                <Activity size={12} strokeWidth={2.4} color={t.text2} />
                <Text style={[styles.sparkTitleText, { color: t.text2 }]}>Recent connection checks</Text>
              </View>
              <View style={styles.sparkLegend}>
                <View style={[styles.sparkDot, { backgroundColor: copy.color }]} />
                <Text style={[styles.sparkLegendText, { color: copy.color }]}>{server.status === 'online' ? 'live' : copy.label}</Text>
              </View>
            </View>
            {server.history.length ? (
              <Sparkline data={server.history} color={copy.color} />
            ) : (
              <Text style={[styles.urlHint, { color: t.text3 }]}>No latency samples yet. Check the connection to start collecting them.</Text>
            )}
          </View>

          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: t.text }]}>Services</Text>
            <Text style={[styles.sectionMeta, { color: t.text3 }]}>
              {services.filter((s) => s.status === 'operational').length}/{services.length} up
            </Text>
          </View>

          <View style={[styles.group, { backgroundColor: t.card }, shadow('sm')]}>
            {services.length ? services.map((service, index) => {
              const Icon = icons[index % icons.length];
              const online = service.status === 'operational';
              const statusColor = online ? t.mint : service.status === 'degraded' ? t.peach : t.danger;
              const statusLabel = online ? 'Operational' : service.status === 'degraded' ? 'Limited' : 'Unavailable';
              return (
                <View key={service.name} style={[styles.serviceRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}>
                  <View style={[styles.serviceIcon, { backgroundColor: t.primarySoft }]}><Icon size={15} strokeWidth={2.2} color={t.primaryDeep} /></View>
                  <View style={styles.serviceMeta}>
                    <Text style={[styles.serviceName, { color: t.text }]}>{service.label}</Text>
                    <Text style={[styles.serviceDetail, { color: t.text3 }]}>{service.detail}</Text>
                  </View>
                  <Text style={[styles.servicePing, { color: statusColor }]}>{statusLabel}</Text>
                </View>
              );
            }) : (
              <Text style={[styles.urlHint, { color: t.text3, padding: 14 }]}>Service details are unavailable until the health endpoint responds.</Text>
            )}
          </View>

          <View style={[styles.group, { backgroundColor: t.card, marginTop: 14 }, shadow('sm')]}>
            <View style={styles.serviceRow}>
              <View style={[styles.serviceIcon, { backgroundColor: t.primarySoft, marginRight: 2 }]}>
                <Database size={15} strokeWidth={2.2} color={t.primaryDeep} />
              </View>
              <View style={styles.serviceMeta}>
                <Text style={[styles.serviceName, { color: t.text }]}>Auto-reconnect</Text>
                <Text style={[styles.serviceDetail, { color: t.text3 }]}>Retry quietly every few seconds</Text>
              </View>
              <Switch
                value={server.autoReconnect}
                onValueChange={setAutoReconnect}
                trackColor={{ false: t.line, true: t.primary }}
                thumbColor="#fff"
                accessibilityLabel="Auto-reconnect"
              />
            </View>
          </View>

          <Text style={[styles.foot, { color: t.text3 }]}>
            {health ? `Duora server v${health.version} · ${health.region}` : 'Server version and region unavailable'}
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
    paddingBottom: 6,
  },
  appbarTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  spacer: { flex: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '700' },
  scroll: { flex: 1 },
  healthCard: {
    marginHorizontal: 18,
    padding: 20,
    paddingHorizontal: 18,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  ring: { width: 138, height: 138, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ringSvg: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  ringCore: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthStatus: { fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  healthSub: { fontSize: 12.5, marginTop: 4, textAlign: 'center' },
  endpoint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
  endpointText: { fontSize: 11, fontWeight: '600' },
  actionPair: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, width: '100%' },
  actionSlot: { flex: 1.15 },
  outlineBtn: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { fontSize: 14, fontWeight: '700' },
  banner: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 18,
    marginTop: 14,
    padding: 13,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bannerText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '500' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 18, marginTop: 16 },
  metric: {
    width: '47.5%',
    borderRadius: 18,
    padding: 13,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metricLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  metricValue: { fontSize: 19, fontWeight: '800', letterSpacing: -0.5, marginTop: 4 },
  metricUnit: { fontSize: 11, fontWeight: '700' },
  sparkCard: {
    marginHorizontal: 18,
    marginTop: 14,
    padding: 14,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sparkHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sparkTitle: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sparkTitleText: { fontSize: 11.5, fontWeight: '700' },
  sparkLegend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sparkDot: { width: 6, height: 6, borderRadius: 3 },
  sparkLegendText: { fontSize: 10.5, fontWeight: '700' },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionTitle: { fontSize: 13.5, fontWeight: '800' },
  sectionMeta: { fontSize: 11, fontWeight: '600' },
  group: { marginHorizontal: 18, borderRadius: 22, overflow: 'hidden' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, paddingHorizontal: 14 },
  serviceIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  serviceMeta: { flex: 1 },
  serviceName: { fontSize: 13, fontWeight: '700' },
  serviceDetail: { fontSize: 10.5, fontWeight: '500', marginTop: 1 },
  servicePing: { fontSize: 11.5, fontWeight: '700' },
  urlField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    margin: 14,
    marginBottom: 10,
    paddingHorizontal: 13,
    height: 46,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(61, 39, 116, 0.12)',
  },
  urlInput: { flex: 1, fontSize: 13.5, fontWeight: '600' },
  urlActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 14 },
  urlSlot: { flex: 1 },
  urlNote: { fontSize: 12, fontWeight: '700', marginTop: 12, marginHorizontal: 14 },
  urlHint: { fontSize: 11, lineHeight: 16, fontWeight: '500', margin: 14, marginTop: 10 },
  foot: { textAlign: 'center', fontSize: 11, fontWeight: '600', marginTop: 16 },
});
