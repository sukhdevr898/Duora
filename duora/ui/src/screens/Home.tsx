import {
  ChevronRight,
  MessageSquare,
  NotebookPen,
  Phone,
  Video,
} from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { BottomNav } from '../components/BottomNav';
import { HeartOrb, LogoHearts } from '../components/Brand';
import { partner, me } from '../data/mock';
import { useRouter } from '../nav/router';

const tiles = [
  {
    key: 'chat',
    title: 'Chat',
    sub: 'Send messages',
    icon: MessageSquare,
    gradient: 'linear-gradient(150deg, #9a7cff, #6a45f2)',
    glow: 'rgba(124, 92, 255, 0.14)',
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

export function Home() {
  const { navigate, switchTab } = useRouter();

  const open = (key: (typeof tiles)[number]['key']) => {
    if (key === 'chat') navigate({ name: 'conversation' });
    if (key === 'call') navigate({ name: 'audio-call' });
    if (key === 'video') navigate({ name: 'video-call' });
    if (key === 'notes') switchTab('notes');
  };

  return (
    <div className="screen">
      <div className="page-bg" />
      <div className="screen-body">
        <div className="home__head">
          <div className="brand">
            <LogoHearts size={28} />
            <span className="brand__word">Duora</span>
          </div>
          <button
            type="button"
            className="press"
            onClick={() => switchTab('settings')}
            aria-label="Your profile"
          >
            <Avatar src={me.photo} size={38} alt="You" />
          </button>
        </div>

        <div className="screen-scroll home">
          <div className="home__greeting">
            {greeting()}
            <strong>
              My Love <span className="heart-emoji">💖</span>
            </strong>
          </div>

          <button
            type="button"
            className="partner-card press"
            onClick={() => navigate({ name: 'conversation' })}
          >
            <Avatar src={partner.photo} size={50} online alt={partner.fullName} />
            <div className="partner-card__meta">
              <div className="partner-card__name">{partner.name}</div>
              <span className="online-row">
                <span className="online-dot" />
                Online
              </span>
            </div>
            <span className="partner-card__go">
              <ChevronRight size={18} strokeWidth={2.4} />
            </span>
          </button>

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
                my tomorrows <span className="heart-emoji">💜</span>
              </b>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '18px 0 2px',
            }}
          >
            <span className="t-caption">Together since 14 Feb 2024</span>
            <span className="heart-emoji" style={{ fontSize: 10 }}>
              💞
            </span>
          </div>
        </div>
      </div>
      <BottomNav active="home" />
    </div>
  );
}
