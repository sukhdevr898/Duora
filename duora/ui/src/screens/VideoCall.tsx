import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  MoreHorizontal,
  PhoneOff,
  SwitchCamera,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Sheet, useToast } from '../components/Overlay';
import { me, partner } from '../data/mock';
import { useRouter } from '../nav/router';

const format = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

export function VideoCall() {
  const { back } = useRouter();
  const { toast } = useToast();
  const [videoOn, setVideoOn] = useState(true);
  const [muted, setMuted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const t = window.setTimeout(() => setConnected(true), 2200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!connected) return;
    timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer.current);
  }, [connected]);

  const end = () => {
    back();
    toast('Video call ended');
  };

  return (
    <div className="video-screen">
      <img className="video-remote" src={partner.photo} alt={`${partner.name} on video`} />
      <div className="video-scrim" />

      <div className="video-top">
        <button
          type="button"
          className="vc-btn press"
          style={{ width: 42, height: 42, background: 'rgba(255,255,255,0.18)' }}
          onClick={back}
          aria-label="Back"
        >
          <ArrowLeft size={19} strokeWidth={2.4} />
        </button>
      </div>

      <motion.div
        className="video-pip"
        initial={{ opacity: 0, scale: 0.86, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.2 }}
      >
        <img src={me.photo} alt="Your camera" />
        <span className="video-pip__tag">You</span>
      </motion.div>

      <div className="video-info">
        <span className="video-info__name">{partner.name}</span>
        <span className="video-info__timer">
          {connected ? format(seconds) : 'Connecting…'}
        </span>
        <span className="video-hd">HD · {connected ? 'Secure' : 'Establishing'}</span>
      </div>

      <div className="video-bottom">
        <button
          type="button"
          className="vc-btn press"
          onClick={() => setVideoOn((v) => !v)}
          aria-label={videoOn ? 'Turn camera off' : 'Turn camera on'}
        >
          {videoOn ? <Camera size={22} strokeWidth={2} /> : <CameraOff size={22} strokeWidth={2} />}
        </button>

        <button type="button" className="vc-btn end press" onClick={end} aria-label="End video call">
          <PhoneOff size={26} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          className={`vc-btn ${muted ? 'on' : ''} press`}
          onClick={() => setMuted((v) => !v)}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <MicOff size={22} strokeWidth={2} /> : <Mic size={22} strokeWidth={2} />}
        </button>

        <button
          type="button"
          className="vc-btn press"
          onClick={() => setMoreOpen(true)}
          aria-label="More options"
        >
          <MoreHorizontal size={22} strokeWidth={2} />
        </button>
      </div>

      <Sheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="Video options"
        subtitle="Switch, share or change how you appear."
      >
        <div className="stack" style={{ gap: 8 }}>
          <button
            type="button"
            className="settings-row"
            style={{ borderRadius: 16, background: '#f8f5ff' }}
            onClick={() => {
              setMoreOpen(false);
              toast('Camera flipped');
            }}
          >
            <span className="settings-row__icon">
              <SwitchCamera size={16} strokeWidth={2.2} />
            </span>
            <span className="settings-row__label">Flip camera</span>
          </button>
          <button
            type="button"
            className="settings-row"
            style={{ borderRadius: 16, background: '#f8f5ff' }}
            onClick={() => {
              setMoreOpen(false);
              toast('Camera effects coming soon');
            }}
          >
            <span className="settings-row__icon">
              <Camera size={16} strokeWidth={2.2} />
            </span>
            <span className="settings-row__label">Camera effects</span>
          </button>
        </div>
      </Sheet>
    </div>
  );
}
