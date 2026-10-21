import { motion } from 'framer-motion';
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
  Sparkles,
  Sun,
  User,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { BottomNav } from '../components/BottomNav';
import { Sheet, useToast } from '../components/Overlay';
import { RichText } from '../components/RichText';
import { me, partner } from '../data/mock';
import { useRouter } from '../nav/router';
import { useApp } from '../state/app';

type Row = {
  key: string;
  label: string;
  icon: typeof User;
  value?: string;
  toggle?: boolean;
};

const accountRows: Row[] = [
  { key: 'account', label: 'Account', icon: User, value: 'sukhdev' },
  { key: 'chat', label: 'Chat Settings', icon: MessageSquare },
  { key: 'notifications', label: 'Notifications', icon: Bell, toggle: true },
  { key: 'privacy', label: 'Privacy & Security', icon: Lock },
];

export function Settings() {
  const { navigate } = useRouter();
  const { toast } = useToast();
  const {
    mode,
    setMode,
    resolvedMode,
    accentInfo,
    server,
    pairing,
  } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const appRows: Row[] = [
    { key: 'appearance', label: 'Appearance & theme', icon: Palette, value: accentInfo.name },
    { key: 'server', label: 'Server health', icon: Server, value: server.status === 'online' ? 'Connected' : server.status === 'connecting' ? 'Reconnecting' : 'Offline' },
    {
      key: 'pairing',
      label: 'Pairing & connection',
      icon: Link2,
      value: pairing.phase === 'matched' ? 'Matched' : 'Not paired',
    },
    { key: 'language', label: 'Language', icon: Globe2, value: 'English' },
    { key: 'help', label: 'Help & Support', icon: LifeBuoy },
    { key: 'about', label: 'About Duora', icon: Info, value: 'v1.0.0' },
  ];

  const onRow = (row: Row) => {
    if (row.key === 'appearance') navigate({ name: 'appearance' });
    else if (row.key === 'server') navigate({ name: 'server' });
    else if (row.key === 'pairing') navigate({ name: 'pairing' });
    else if (row.key === 'about') setAboutOpen(true);
    else if (row.key === 'language') navigate({ name: 'sub-settings', section: 'language' });
    else if (row.key === 'help') navigate({ name: 'sub-settings', section: 'help' });
    else if (row.key === 'chat') navigate({ name: 'sub-settings', section: 'chat-settings' });
    else navigate({ name: 'sub-settings', section: row.key });
  };

  const renderRow = (row: Row) => {
    const Icon = row.icon;
    const isServer = row.key === 'server';
    return (
      <button key={row.key} type="button" className="settings-row" onClick={() => onRow(row)}>
        <span className="settings-row__icon">
          <Icon size={16} strokeWidth={2.1} />
        </span>
        <span className="settings-row__label">{row.label}</span>
        {isServer ? (
          <span
            className={`connect-pill ${server.status}`}
            style={{ height: 24, paddingInline: 9, fontSize: 10 }}
          >
            <span className="connect-pill__dot" />
            {row.value}
          </span>
        ) : (
          row.value && <span className="settings-row__value">{row.value}</span>
        )}
        {row.toggle ? (
          <span
            role="switch"
            aria-checked={notifications}
            aria-label="Notifications"
            className={`toggle ${notifications ? 'on' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setNotifications((v) => !v);
            }}
          />
        ) : (
          <ChevronRight className="settings-row__chev" size={17} strokeWidth={2.2} />
        )}
      </button>
    );
  };

  return (
    <div className="screen">
      <div className="page-bg" />
      <div className="screen-body">
        <div className="appbar" style={{ paddingBottom: 10 }}>
          <span className="appbar__title">Settings</span>
          <span className="appbar__spacer" />
          <span className="badge-premium">
            <Sparkles size={10} strokeWidth={2.6} /> Premium
          </span>
        </div>

        <div className="screen-scroll">
          <div style={{ padding: '0 18px 26px' }}>
            <motion.button
              type="button"
              className="settings-profile press"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              onClick={() => setProfileOpen(true)}
              style={{ width: '100%', textAlign: 'left' }}
            >
              <Avatar src={partner.photo} size={50} ring online alt={partner.fullName} />
              <span className="grow">
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 16.5,
                    fontWeight: 800,
                    letterSpacing: '-0.3px',
                  }}
                >
                  {partner.name}
                  <Heart size={12} fill="var(--primary-2)" strokeWidth={0} />
                </span>
                <span className="online-row" style={{ marginTop: 2 }}>
                  <span className="online-dot" />
                  Online · {accentInfo.name}
                </span>
              </span>
              <span className="partner-card__go">
                <ChevronRight size={17} strokeWidth={2.4} />
              </span>
            </motion.button>

            <div className="settings-group">{accountRows.slice(0, 1).map(renderRow)}</div>
            <div className="settings-group">{accountRows.slice(1).map(renderRow)}</div>

            <div className="section-head" style={{ padding: '20px 2px 8px' }}>
              <span className="section-head__title" style={{ fontSize: 13.5 }}>
                App &amp; connection
              </span>
            </div>
            <div className="settings-group" style={{ marginTop: 0 }}>
              {appRows.map(renderRow)}
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="press"
                onClick={() => {
                  const next = resolvedMode === 'dark' ? 'light' : 'dark';
                  setMode(next);
                  toast(`${next === 'dark' ? 'Dark' : 'Light'} mode on`);
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  height: 46,
                  borderRadius: 16,
                  background:
                    resolvedMode === 'dark'
                      ? 'linear-gradient(135deg, #2a2247, #1c1733)'
                      : 'linear-gradient(135deg, #2b2140, #1a1330)',
                  color: '#f4eeff',
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: '0 12px 24px rgba(27, 19, 48, 0.28)',
                }}
              >
                {resolvedMode === 'dark' ? (
                  <Sun size={14} strokeWidth={2.2} />
                ) : (
                  <Moon size={14} strokeWidth={2.2} />
                )}
                {resolvedMode === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
              <button
                type="button"
                className="press"
                onClick={() => navigate({ name: 'appearance' })}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  height: 46,
                  borderRadius: 16,
                  background: 'var(--primary-soft)',
                  color: 'var(--primary-deep)',
                  fontSize: 12,
                  fontWeight: 700,
                  border: '1px solid var(--primary-ghost)',
                }}
              >
                <Languages size={14} strokeWidth={2.2} /> Love theme
              </button>
            </div>

            <div className="settings-foot">
              <b>Duora v1.0.0</b>
              Just You &amp; Me · made with <RichText text="💜" size={10} /> for two
            </div>
          </div>
        </div>
      </div>
      <BottomNav active="settings" />

      <Sheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title={partner.fullName}
        subtitle="Your person. Your private space."
      >
        <div className="stack" style={{ alignItems: 'center', gap: 12 }}>
          <Avatar src={partner.photo} size={92} ring online alt={partner.fullName} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.4px' }}>{partner.name}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginTop: 3 }}>
              Paired with {me.name} · 2 years together
            </div>
          </div>
          <div className="row" style={{ gap: 10, width: '100%', marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-primary grow"
              onClick={() => {
                setProfileOpen(false);
                navigate({ name: 'conversation' });
              }}
            >
              <MessageSquareText size={16} strokeWidth={2.2} /> Message
            </button>
            <button
              type="button"
              className="icon-btn press"
              style={{ width: 52, height: 52 }}
              onClick={() => {
                setProfileOpen(false);
                navigate({ name: 'audio-call' });
              }}
              aria-label="Voice call"
            >
              <Phone size={19} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              className="icon-btn press"
              style={{ width: 52, height: 52 }}
              onClick={() => {
                setProfileOpen(false);
                navigate({ name: 'video-call' });
              }}
              aria-label="Video call"
            >
              <Video size={19} strokeWidth={2.2} />
            </button>
          </div>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setProfileOpen(false);
              navigate({ name: 'pairing' });
            }}
          >
            <Link2 size={12} strokeWidth={2.4} /> Manage pairing
          </button>
          <div
            className="row"
            style={{ gap: 8, marginTop: 2, color: 'var(--text-3)', fontSize: 11, fontWeight: 600 }}
          >
            <Heart size={12} fill="currentColor" strokeWidth={0} color="var(--primary-2)" />
            Matched on Duora · 14 Feb 2024
          </div>
        </div>
      </Sheet>

      <Sheet
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title="About Duora"
        subtitle="Two hearts. One private space."
      >
        <div className="stack" style={{ gap: 10 }}>
          <div className="settings-group" style={{ marginTop: 0 }}>
            <div className="settings-row">
              <span className="settings-row__label">Version</span>
              <span className="settings-row__value">1.0.0 (front-end)</span>
            </div>
            <div className="settings-row">
              <span className="settings-row__label">Design</span>
              <span className="settings-row__value">{accentInfo.name}</span>
            </div>
            <div className="settings-row">
              <span className="settings-row__label">Mode</span>
              <span className="settings-row__value">
                {mode === 'system' ? `System · ${resolvedMode}` : mode}
              </span>
            </div>
            <div className="settings-row">
              <span className="settings-row__label">Made for</span>
              <span className="settings-row__value">Exactly two people</span>
            </div>
          </div>
          <p className="t-body" style={{ fontSize: 12.5, lineHeight: 1.55, margin: '4px 2px 0' }}>
            Duora is a private space for two — chat, call, and keep the little memories that
            belong only to you.
          </p>
        </div>
      </Sheet>
    </div>
  );
}
