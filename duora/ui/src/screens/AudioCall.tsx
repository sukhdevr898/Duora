import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  MoreHorizontal,
  Phone,
  PhoneOff,
  Plus,
  Volume2,
  VolumeX,
  Video,
  Grid3x3,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Sheet, useToast } from '../components/Overlay';
import { partner } from '../data/mock';
import { useRouter } from '../nav/router';

const format = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

export function AudioCall() {
  const { back, navigate } = useRouter();
  const { toast } = useToast();
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const connect = window.setTimeout(() => setConnected(true), 2400);
    return () => window.clearTimeout(connect);
  }, []);

  useEffect(() => {
    if (!connected) return;
    timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer.current);
  }, [connected]);

  const end = () => {
    back();
    toast('Call ended');
  };

  return (
    <div className="call-screen">
      <div className="call-body">
        <motion.div
          className="call-avatar"
          initial={{ scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 16 }}
        >
          <Avatar src={partner.photo} size={130} alt={partner.fullName} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{ textAlign: 'center' }}
        >
          <div className="call-name">{partner.name}</div>
          <div className="call-timer">
            {format(seconds)}
            <span className="call-state">{connected ? 'Connected · Voice call' : 'Calling…'}</span>
          </div>
        </motion.div>

        <div className="waveform" aria-hidden="true">
          {Array.from({ length: 19 }).map((_, i) => (
            <span
              key={i}
              style={{
                animationDelay: `${(i % 7) * 0.11}s`,
                animationDuration: `${1.1 + (i % 4) * 0.22}s`,
                opacity: connected ? 0.9 : 0.35,
              }}
            />
          ))}
        </div>

        <div className="call-grid">
          <button type="button" className={`call-control ${muted ? 'on' : ''}`} onClick={() => setMuted((v) => !v)}>
            <span className="call-control__btn">
              {muted ? <MicOff size={23} strokeWidth={2} /> : <Mic size={23} strokeWidth={2} />}
            </span>
            <span className="call-control__label">{muted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button type="button" className="call-control" onClick={() => toast('Keypad opened')}>
            <span className="call-control__btn">
              <Grid3x3 size={22} strokeWidth={2} />
            </span>
            <span className="call-control__label">Keypad</span>
          </button>

          <button type="button" className={`call-control ${speaker ? 'on' : ''}`} onClick={() => setSpeaker((v) => !v)}>
            <span className="call-control__btn">
              {speaker ? <Volume2 size={23} strokeWidth={2} /> : <VolumeX size={23} strokeWidth={2} />}
            </span>
            <span className="call-control__label">Speaker</span>
          </button>

          <button type="button" className="call-control" onClick={() => toast('Add someone to the call')}>
            <span className="call-control__btn">
              <Plus size={24} strokeWidth={2} />
            </span>
            <span className="call-control__label">Add Call</span>
          </button>

          <button type="button" className="call-control" onClick={() => navigate({ name: 'video-call' })}>
            <span className="call-control__btn">
              <Video size={22} strokeWidth={2} />
            </span>
            <span className="call-control__label">Video Call</span>
          </button>

          <button type="button" className="call-control" onClick={() => setMoreOpen(true)}>
            <span className="call-control__btn">
              <MoreHorizontal size={24} strokeWidth={2} />
            </span>
            <span className="call-control__label">More</span>
          </button>
        </div>

        <button type="button" className="end-call" onClick={end} aria-label="End call">
          <PhoneOff size={26} strokeWidth={2.2} />
        </button>
      </div>

      <Sheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Call options"
        subtitle="Keep the call comfortable for both of you."
      >
        <div className="stack" style={{ gap: 8 }}>
          {[
            { key: 'hold', label: 'Put call on hold', icon: Phone },
            { key: 'rec', label: 'Record this moment', icon: Volume2 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className="settings-row"
              style={{ borderRadius: 16, background: '#f8f5ff' }}
              onClick={() => {
                setMoreOpen(false);
                toast(`${label} — not available in preview`);
              }}
            >
              <span className="settings-row__icon">
                <Icon size={16} strokeWidth={2.2} />
              </span>
              <span className="settings-row__label">{label}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
