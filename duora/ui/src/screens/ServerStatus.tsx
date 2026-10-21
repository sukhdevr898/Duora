import { motion } from 'framer-motion';
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
  RefreshCw,
  Radio,
  Server,
  Wifi,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '../components/Overlay';
import { useRouter } from '../nav/router';
import { useApp } from '../state/app';

const statusCopy = {
  online: {
    label: 'Connected',
    sub: 'Everything is synced and secure',
    color: 'var(--mint)',
    icon: CheckCircle2,
  },
  connecting: {
    label: 'Reconnecting',
    sub: 'Waking the server — this can take a moment',
    color: '#f0a93c',
    icon: Loader2,
  },
  offline: {
    label: 'Offline',
    sub: 'Messages will queue and sync automatically',
    color: 'var(--danger)',
    icon: CloudOff,
  },
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
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((p) => (
        <line
          key={p}
          x1="0"
          x2={width}
          y1={height * p}
          y2={height * p}
          stroke="currentColor"
          strokeOpacity="0.06"
          strokeDasharray="3 4"
        />
      ))}
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {last && <circle cx={last[0]} cy={last[1]} r="2.6" fill={color} />}
    </svg>
  );
}

export function ServerStatus() {
  const { back } = useRouter();
  const { toast } = useToast();
  const { server, checkServer, simulateOutage, setAutoReconnect } = useApp();
  const [now, setNow] = useState(Date.now());
  const [checking, setChecking] = useState(false);
  const ticking = useRef<number | undefined>(undefined);

  useEffect(() => {
    ticking.current = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(ticking.current);
  }, []);

  const copy = statusCopy[server.status];
  const StatusIcon = copy.icon;

  const onCheck = () => {
    setChecking(true);
    checkServer();
    window.setTimeout(() => setChecking(false), 1800);
  };

  const latencyPct =
    server.status === 'online' ? Math.min(100, Math.max(12, 100 - server.latency / 2)) : 0;

  const services = [
    {
      key: 'api',
      icon: Server,
      name: 'API gateway',
      detail: 'REST · Express + Prisma',
      ping: server.status === 'online' ? `${server.latency} ms` : '—',
      online: server.status === 'online',
    },
    {
      key: 'socket',
      icon: Radio,
      name: 'Realtime channel',
      detail: 'Socket.IO · typing & delivery',
      ping: server.status === 'online' ? `${Math.max(18, server.latency - 8)} ms` : '—',
      online: server.status === 'online',
    },
    {
      key: 'media',
      icon: PlugZap,
      name: 'Media relay',
      detail: 'TURN · voice & video',
      ping: server.status === 'online' ? `${Math.max(22, server.latency + 6)} ms` : '—',
      online: server.status === 'online',
    },
    {
      key: 'push',
      icon: BellRing,
      name: 'Push notifications',
      detail: 'FCM · call alerts',
      ping: server.status === 'online' ? 'ok' : 'queued',
      online: server.status === 'online',
    },
  ];

  return (
    <div className="screen">
      <div className="page-bg" />
      <div className="screen-body">
        <div className="appbar" style={{ paddingBottom: 6 }}>
          <button type="button" className="icon-btn ghost press" onClick={back} aria-label="Back">
            <ArrowLeft size={20} strokeWidth={2.4} />
          </button>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Server health</span>
          <span className="appbar__spacer" />
          <span className={`connect-pill ${server.status}`}>
            <span className="connect-pill__dot" />
            {server.status === 'online' ? 'Live' : server.status === 'connecting' ? 'Syncing' : 'Down'}
          </span>
        </div>

        <div className="screen-scroll">
          <div style={{ paddingTop: 6 }}>
            <div className="health-card">
              <div className={`health-ring ${server.status === 'online' ? 'health-ring--pulse' : ''}`}>
                <svg viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="var(--line)"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke={copy.color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    animate={{
                      strokeDashoffset: 2 * Math.PI * 52 * (1 - latencyPct / 100),
                    }}
                    transition={{ type: 'spring', stiffness: 60, damping: 18 }}
                    style={{ opacity: server.status === 'online' ? 1 : 0.4 }}
                  />
                </svg>
                <span className={`health-ring__core ${server.status}`}>
                  <StatusIcon
                    size={36}
                    strokeWidth={2.2}
                    className={server.status === 'connecting' ? 'spin-slow' : undefined}
                  />
                </span>
              </div>

              <div className="health-status" style={{ color: copy.color }}>
                {copy.label}
              </div>
              <div className="health-sub">{copy.sub}</div>
              <div className="health-endpoint">
                <Globe2 size={11} strokeWidth={2.4} />
                {server.apiBase.replace('https://', '')}
              </div>

              <div className="action-pair">
                <button
                  type="button"
                  className="btn btn-primary press"
                  onClick={onCheck}
                  disabled={checking}
                  aria-label="Check server status now"
                >
                  <RefreshCw
                    size={14}
                    strokeWidth={2.6}
                    style={checking ? { animation: 'spin 0.9s linear infinite' } : undefined}
                  />
                  {checking ? 'Checking…' : 'Check now'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline press"
                  aria-label={
                    server.status === 'offline' ? 'Reconnect to server' : 'Simulate server outage'
                  }
                  onClick={() => {
                    if (server.status === 'offline' || server.status === 'connecting') {
                      checkServer();
                      toast('Reconnecting…');
                    } else {
                      simulateOutage();
                      toast('Simulating an outage');
                    }
                  }}
                >
                  {server.status === 'offline'
                    ? 'Reconnect'
                    : server.status === 'connecting'
                      ? 'Connecting…'
                      : 'Simulate outage'}
                </button>
              </div>
            </div>

            {server.status === 'offline' && (
              <div className="banner-offline">
                <Wifi size={15} strokeWidth={2.4} style={{ flex: '0 0 auto', marginTop: 1 }} />
                <span>
                  You&apos;re offline. New messages and calls are queued locally and will sync as soon
                  as the server is reachable.
                </span>
              </div>
            )}

            <div className="metric-grid">
              <div className="metric">
                <div className="metric__label">Latency</div>
                <div className="metric__value">
                  {server.status === 'online' ? server.latency : '—'}
                  <small>ms</small>
                </div>
              </div>
              <div className="metric">
                <div className="metric__label">Uptime</div>
                <div className="metric__value">{formatUptime(server.uptimeSeconds)}</div>
              </div>
              <div className="metric">
                <div className="metric__label">Region</div>
                <div className="metric__value" style={{ fontSize: 13 }}>
                  Singapore
                </div>
              </div>
              <div className="metric">
                <div className="metric__label">Last checked</div>
                <div className="metric__value" style={{ fontSize: 13 }}>
                  {timeAgo(server.lastChecked, now)}
                </div>
              </div>
            </div>

            <div className="sparkline-card">
              <div className="sparkline-card__head">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Activity size={12} strokeWidth={2.4} /> Response time · last minute
                </span>
                <span className="sparkline-card__legend">
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 99,
                      background: 'currentColor',
                      display: 'inline-block',
                    }}
                  />
                  {server.status === 'online' ? 'healthy' : 'degraded'}
                </span>
              </div>
              <div style={{ color: copy.color }}>
                <Sparkline data={server.history} color={copy.color} />
              </div>
            </div>

            <div className="section-head" style={{ padding: '20px 2px 8px' }}>
              <span className="section-head__title" style={{ fontSize: 13.5 }}>
                Services
              </span>
              <span className="t-caption">
                {services.filter((s) => s.online).length}/{services.length} up
              </span>
            </div>
            <div className="settings-group" style={{ marginTop: 0 }}>
              {services.map(({ key, icon: Icon, name, detail, ping, online }) => (
                <div key={key} className="service-row">
                  <span className="service-row__icon">
                    <Icon size={15} strokeWidth={2.2} />
                  </span>
                  <span className="service-row__meta">
                    <span className="service-row__name" style={{ display: 'block' }}>
                      {name}
                    </span>
                    <span className="service-row__detail" style={{ display: 'block' }}>
                      {detail}
                    </span>
                  </span>
                  <span className={`service-row__ping ${online ? '' : 'off'}`}>{ping}</span>
                </div>
              ))}
            </div>

            <div className="settings-group">
              <button
                type="button"
                className="toggle-row"
                onClick={() => setAutoReconnect(!server.autoReconnect)}
              >
                <span className="service-row__icon" style={{ marginRight: 2 }}>
                  <Database size={15} strokeWidth={2.2} />
                </span>
                <span className="toggle-row__meta">
                  <span className="toggle-row__title" style={{ display: 'block' }}>
                    Auto-reconnect
                  </span>
                  <span className="toggle-row__sub" style={{ display: 'block' }}>
                    Retry quietly every few seconds
                  </span>
                </span>
                <span
                  role="switch"
                  aria-checked={server.autoReconnect}
                  className={`toggle ${server.autoReconnect ? 'on' : ''}`}
                />
              </button>
            </div>

            <div className="row" style={{ justifyContent: 'center', gap: 6, marginTop: 16 }}>
              <span className="t-caption">Duora server {server.version} · {server.region}</span>
            </div>
            <div style={{ height: 12 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
