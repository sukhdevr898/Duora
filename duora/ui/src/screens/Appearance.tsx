import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Heart,
  MessageSquare,
  Paperclip,
  Phone,
  Send,
  Settings,
  Smile,
  Sparkles,
  StickyNote,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../components/Overlay';
import { paletteBottom, paletteTop } from '../data/mock';
import { useRouter } from '../nav/router';

const iconOptions = [
  Phone,
  Video,
  MessageSquare,
  Paperclip,
  Smile,
  Send,
  Heart,
  StickyNote,
  Settings,
  ArrowLeft,
  Check,
  CheckCheck,
];

export function Appearance() {
  const { back } = useRouter();
  const { toast } = useToast();
  const [iconIndex, setIconIndex] = useState(2);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(3);

  return (
    <div className="screen">
      <div className="page-bg" />
      <div className="screen-body">
        <div className="appbar" style={{ paddingBottom: 6 }}>
          <button type="button" className="icon-btn ghost press" onClick={back} aria-label="Back">
            <ArrowLeft size={20} strokeWidth={2.4} />
          </button>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Appearance</span>
          <span className="appbar__spacer" />
          <span className="badge-premium">
            <Sparkles size={11} strokeWidth={2.6} /> Premium
          </span>
        </div>

        <div className="screen-scroll">
          <div style={{ padding: '4px 18px 28px' }}>
            <div className="palette-card">
              <div className="section-label">
                Custom Icons
                <span
                  className="badge-premium"
                  style={{ marginLeft: 'auto', height: 20, fontSize: 9 }}
                >
                  Premium
                </span>
              </div>
              <div className="t-caption" style={{ marginTop: 3, fontWeight: 500 }}>
                Pick the icon set that feels like you two
              </div>

              <div className="icon-kit">
                {iconOptions.map((Icon, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    className={`icon-kit__tile ${iconIndex === i ? 'selected' : ''}`}
                    onClick={() => {
                      setIconIndex(i);
                      toast('Icon style updated');
                    }}
                    aria-label={`Icon style ${i + 1}`}
                    aria-pressed={iconIndex === i}
                  >
                    <Icon size={22} strokeWidth={1.9} />
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="section-label" style={{ marginTop: 20, marginBottom: 10 }}>
              Color Palette
            </div>
            <div className="palette-card">
              <div className="palette-grid">
                {paletteTop.map((c, i) => (
                  <button
                    key={c.hex}
                    type="button"
                    className={`swatch ${primaryIndex === i ? 'selected' : ''}`}
                    onClick={() => {
                      setPrimaryIndex(i);
                      toast(`${c.label} applied`);
                    }}
                  >
                    <span className="swatch__dot" style={{ background: c.hex }} />
                    <span className="swatch__hex">{c.hex}</span>
                  </button>
                ))}
                <div style={{ display: 'grid', placeItems: 'center' }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: '#c0b8d6',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Theme
                  </span>
                </div>
              </div>

              <div
                style={{
                  height: 1,
                  background: 'var(--line)',
                  margin: '16px 0 14px',
                }}
              />

              <div className="palette-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {paletteBottom.map((c, i) => (
                  <button
                    key={c.hex}
                    type="button"
                    className={`swatch ${bottomIndex === i ? 'selected' : ''}`}
                    onClick={() => {
                      setBottomIndex(i);
                      toast(`${c.label} tone selected`);
                    }}
                  >
                    <span
                      className="swatch__dot"
                      style={{
                        background: c.hex,
                        boxShadow:
                          c.hex === '#FCFAFF'
                            ? 'inset 0 0 0 1px rgba(20,10,50,0.1)'
                            : 'inset 0 0 0 1px rgba(20,10,50,0.05)',
                      }}
                    />
                    <span className="swatch__hex" title={c.label}>
                      {c.hex}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="premium-banner">
              <div className="badge-premium" style={{ marginBottom: 10 }}>
                Premium
              </div>
              <div className="premium-banner__title">Make Duora yours</div>
              <div className="premium-banner__sub">
                Unlock every icon set, animated hearts and exclusive palettes.
              </div>
              <button
                type="button"
                className="btn press"
                onClick={() => toast('Premium is on the way 💜')}
              >
                Explore premium
                <Sparkles size={14} strokeWidth={2.4} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <span className="t-caption">Changes apply instantly across your space</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
