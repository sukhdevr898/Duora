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
} from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { BottomNav } from '../components/BottomNav';
import { HeartOrb, LogoHearts } from '../components/Brand';
import { ConnectionPill } from '../components/ConnectionPill';
import { RichText } from '../components/RichText';
import { me, notes, partner } from '../data/mock';
import { useRouter } from '../nav/router';
import { useApp } from '../state/app';

const tiles = [
  {
    key: 'chat',
    title: 'Chat',
    sub: 'Send messages',
    icon: MessageSquare,
    gradient: 'var(--grad-primary)',
    glow: 'var(--primary-ghost)',
    shadow: '0 10px 20px rgba(106, 69, 242, 0.3)',
  },
  {
    key: 'call',
    title: 'Call',
    sub: 'Voice call',
    icon: Phone,
    gradient: 'linear-gradient(150deg, #ff9ecb, #f0639f)',
    glow: 'rgba(245, 139, 191, 0.18)',
    shadow: '0 10px 20px rgba(240, 99, 159, 0.3)',
  },
  {
    key: 'video',
    title: 'Video Call',
    sub: 'Face to face',
    icon: Video,
    gradient: 'linear-gradient(150deg, #b18dff, #7b4df6)',
    glow: 'rgba(124, 92, 255, 0.14)',
    shadow: '0 10px 20px rgba(123, 77, 246, 0.3)',
  },
  {
    key: 'notes',
    title: 'Notes',
    sub: 'Our memories',
    icon: NotebookPen,
    gradient: 'linear-gradient(150deg, #ffc38a, #ff9b6a)',
    glow: 'rgba(255, 155, 106, 0.18)',
    shadow: '0 10px 20px rgba(255, 155, 106, 0.32)',
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

function daysUntilAnniversary() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(start.getFullYear(), 1, 14);
  if (next.getTime() < start.getTime()) next = new Date(start.getFullYear() + 1, 1, 14);
  return Math.round((next.getTime() - start.getTime()) / 86400000);
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

function daysTogether() {
  const start = new Date(2024, 1, 14);
  const now = new Date();
  return Math.max(1, Math.round((now.getTime() - start.getTime()) / 86400000));
}

export function Home() {
  const { navigate, switchTab } = useRouter();
  const { pairing } = useApp();

  const open = (key: (typeof tiles)[number]['key']) => {
    if (key === 'chat') navigate({ name: 'conversation' });
    if (key === 'call') navigate({ name: 'audio-call' });
    if (key === 'video') navigate({ name: 'video-call' });
    if (key === 'notes') switchTab('notes');
  };

  const linked = pairing.phase === 'matched';
  const untilAnniversary = daysUntilAnniversary();
  const together = daysTogether();

  return (
    <div className="screen">
      <div className="page-bg" />
      <div className="screen-body">
        <div className="home__head">
          <div className="brand">
            <LogoHearts size={28} />
            <span className="brand__word">Duora</span>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <ConnectionPill />
            <button
              type="button"
              className="press"
              onClick={() => switchTab('settings')}
              aria-label="Your profile"
            >
              <Avatar src={me.photo} size={36} alt="You" />
            </button>
          </div>
        </div>

        <div className="screen-scroll home">
          <div className="home__greeting">
            {greeting()} · {today()}
            <strong>
              My Love <RichText text="💖" size={19} />
            </strong>
            <span className="home__greeting-line">
              <RichText text={dailyLine()} size={12} />
            </span>
          </div>

          {linked ? (
            <div className="home-hero">
              <button
                type="button"
                onClick={() => navigate({ name: 'conversation' })}
                aria-label={`Open chat with ${partner.name}`}
                style={{ display: 'flex', flex: 1, minWidth: 0, gap: 13, alignItems: 'center', textAlign: 'left' }}
              >
                <Avatar src={partner.photo} size={56} ring online alt={partner.fullName} />
                <span className="home-hero__meta">
                  <span className="home-hero__row">
                    <span className="home-hero__name">{partner.name}</span>
                    <span className="streak">
                      <Heart size={9} fill="currentColor" strokeWidth={0} /> 12 day streak
                    </span>
                  </span>
                  <span className="home-hero__sub" style={{ display: 'block' }}>
                    Active now · she&apos;s thinking of you
                  </span>
                  <span className="home-hero__quick">
                    <span className="quick-action">
                      <MessageCircle size={12} strokeWidth={2.4} /> Message
                    </span>
                    <span className="quick-action">
                      <Phone size={12} strokeWidth={2.4} /> Call
                    </span>
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="partner-card__go press"
                onClick={() => navigate({ name: 'pairing' })}
                aria-label="Pairing details"
                style={{ position: 'relative', zIndex: 2 }}
              >
                <ChevronRight size={17} strokeWidth={2.4} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="home-hero press"
              onClick={() => navigate({ name: 'pairing' })}
              style={{ width: 'calc(100% - 40px)', textAlign: 'left' }}
            >
              <span
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--primary-ghost)',
                  color: 'var(--primary)',
                  flex: '0 0 auto',
                }}
              >
                <Link2 size={24} strokeWidth={2.2} />
              </span>
              <span className="home-hero__meta">
                <span className="home-hero__name">Connect your person</span>
                <span className="home-hero__sub" style={{ display: 'block' }}>
                  Pair with a code or QR — takes seconds
                </span>
                <span className="home-hero__quick">
                  <span className="quick-action">
                    <Sparkles size={12} strokeWidth={2.4} /> Pair now
                  </span>
                </span>
              </span>
            </button>
          )}

          <div className="action-grid">
            {tiles.map(({ key, title, sub, icon: Icon, gradient, glow, shadow }) => (
              <button
                key={key}
                type="button"
                className="action-tile"
                onClick={() => open(key)}
                style={
                  {
                    '--tile-gradient': gradient,
                    '--tile-glow': glow,
                    '--tile-shadow': shadow,
                  } as React.CSSProperties
                }
              >
                <span className="action-tile__icon">
                  <Icon size={20} strokeWidth={2.2} />
                </span>
                <span className="action-tile__title">{title}</span>
                <span className="action-tile__sub">{sub}</span>
              </button>
            ))}
          </div>

          <div className="quote-card">
            <div className="quote-card__balloon">
              <HeartOrb size={40} tone="violet" />
            </div>
            <div className="quote-card__text">
              You are <b>my today</b> and all of{' '}
              <b>
                my tomorrows <RichText text="💜" size={13} />
              </b>
            </div>
          </div>

          <div className="section-head">
            <span className="section-head__title">Our moments</span>
            <button type="button" className="section-head__link" onClick={() => switchTab('notes')}>
              View all <ChevronRight size={12} strokeWidth={2.6} />
            </button>
          </div>
          <div className="rail">
            {notes.map((n) => (
              <button
                key={n.id}
                type="button"
                className="rail-card"
                onClick={() => switchTab('notes')}
              >
                <img className="rail-card__img" src={n.image} alt="" loading="lazy" />
                <span className="rail-card__body" style={{ display: 'block' }}>
                  <span className="rail-card__title" style={{ display: 'block' }}>
                    <RichText text={n.title} size={11.5} />
                  </span>
                  <span className="rail-card__date" style={{ display: 'block' }}>
                    {n.date}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="special-day">
            <span className="special-day__count">
              <b>{untilAnniversary}</b>
              <span>days</span>
            </span>
            <span className="grow">
              <span className="special-day__title" style={{ display: 'block' }}>
                Our anniversary
              </span>
              <span className="special-day__sub" style={{ display: 'block' }}>
                14 Feb · {together.toLocaleString()} days of us. Plan something small?
              </span>
            </span>
            <Heart size={17} strokeWidth={2.2} color="var(--primary-2)" fill="var(--primary-soft)" />
          </div>

          <div className="love-stats">
            {[
              { icon: Heart, value: together.toLocaleString(), label: 'days together' },
              { icon: MessageSquare, value: '12.4k', label: 'messages' },
              { icon: Clock3, value: '9h 20m', label: 'calls this week' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="love-stats__cell">
                <span className="love-stats__icon">
                  <Icon size={13} strokeWidth={2.3} />
                </span>
                <span className="love-stats__value">{value}</span>
                <span className="love-stats__label">{label}</span>
              </div>
            ))}
          </div>

          <div className="home-footer">
            <ShieldCheck size={12} strokeWidth={2.4} />
            End-to-end private · just you two
          </div>
        </div>
      </div>
      <BottomNav active="home" />
    </div>
  );
}
