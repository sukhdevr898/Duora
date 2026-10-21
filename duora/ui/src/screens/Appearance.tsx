import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Heart,
  MessageSquare,
  Moon,
  Palette,
  Smartphone,
  Sparkles,
  StickyNote,
  Sun,
  Video,
  Waves,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { RichText } from '../components/RichText';
import { useToast } from '../components/Overlay';
import { partner } from '../data/mock';
import { useRouter } from '../nav/router';
import { accents, modeCopy, useApp, type ThemeMode } from '../state/app';

const modes: { key: ThemeMode; icon: typeof Sun }[] = [
  { key: 'light', icon: Sun },
  { key: 'dark', icon: Moon },
  { key: 'system', icon: Smartphone },
];

const iconOptions = [MessageSquare, Heart, Video, StickyNote, Sparkles, Palette, Moon, Waves];

export function Appearance() {
  const { back } = useRouter();
  const { toast } = useToast();
  const {
    mode,
    setMode,
    accent,
    setAccent,
    heartMotion,
    setHeartMotion,
    loveMode,
    setLoveMode,
    glass,
    setGlass,
  } = useApp();
  const [iconIndex, setIconIndex] = useState(0);

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
          <div style={{ padding: '6px 18px 28px' }}>
            {/* live preview */}
            <motion.div layout className="theme-preview">
              <div className="theme-preview__head">
                <Avatar src={partner.photo} size={30} online alt={partner.fullName} />
                <span style={{ fontSize: 12.5, fontWeight: 800 }}>{partner.name}</span>
                <span className="theme-preview__state">online</span>
                <Moon size={13} className="theme-preview__mode" />
              </div>
              <div className="theme-preview__msgs">
                <span className="theme-preview__in">
                  <RichText text="Miss you ✨" size={11.5} />
                </span>
                <span className="theme-preview__out">
                  <RichText text="Come here 💜" size={11.5} />
                </span>
              </div>
              <div className="theme-preview__bar">
                <span className="theme-preview__field">Message ruhi…</span>
                <span className="theme-preview__send">
                  <Sparkles size={12} strokeWidth={2.6} />
                </span>
              </div>
              <div className="theme-preview__tags">
                <span>{modeCopy[mode].title} mode</span>
                <span>·</span>
                <span>{accents.find((a) => a.key === accent)?.name}</span>
              </div>
            </motion.div>

            {/* mode */}
            <div className="section-label" style={{ marginTop: 22, marginBottom: 10 }}>
              Mode
            </div>
            <div className="mode-grid">
              {modes.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  className={`mode-card ${mode === key ? 'active' : ''}`}
                  onClick={() => setMode(key)}
                  aria-pressed={mode === key}
                >
                  <span className={`mode-preview ${key}`}>
                    <span className="mode-preview__bar" />
                    <span className="mode-preview__dot" />
                    <span className="mode-preview__line" style={{ top: 21 }} />
                    <span className="mode-preview__line" style={{ top: 29, right: 34 }} />
                    <span className="mode-preview__card" />
                  </span>
                  <span className="mode-card__label">
                    <Icon size={11} strokeWidth={2.4} />
                    {modeCopy[key].title}
                  </span>
                  <span className="mode-card__hint">{modeCopy[key].blurb}</span>
                </button>
              ))}
            </div>

            {/* love theme */}
            <div className="section-head" style={{ padding: '22px 2px 10px' }}>
              <span className="section-head__title">Love theme</span>
              <span className="section-head__link">
                <Heart size={11} fill="currentColor" strokeWidth={0} /> {accents.length} moods
              </span>
            </div>
            <div className="accent-list">
              {accents.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  className={`accent-row ${accent === a.key ? 'active' : ''}`}
                  onClick={() => {
                    setAccent(a.key);
                    toast(`${a.name} applied`);
                  }}
                  aria-pressed={accent === a.key}
                >
                  <span
                    className="accent-row__swatch"
                    style={{
                      background: `linear-gradient(150deg, ${a.swatch[0]}, ${a.swatch[1]})`,
                    }}
                  />
                  <span className="grow">
                    <span className="accent-row__name" style={{ display: 'block' }}>
                      {a.name}
                    </span>
                    <span className="accent-row__blurb" style={{ display: 'block' }}>
                      {a.blurb}
                    </span>
                  </span>
                  {accent === a.key && (
                    <span className="accent-row__check">
                      <Check size={17} strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* icons */}
            <div className="section-head" style={{ padding: '22px 2px 10px' }}>
              <span className="section-head__title">Custom icons</span>
              <span className="badge-premium" style={{ height: 20, fontSize: 9 }}>
                Premium
              </span>
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
                  <Icon size={21} strokeWidth={1.9} />
                </motion.button>
              ))}
            </div>

            {/* finishing touches */}
            <div className="section-label" style={{ marginTop: 22, marginBottom: 10 }}>
              Finishing touches
            </div>
            <div className="settings-group" style={{ marginTop: 0 }}>
              <button
                type="button"
                className="toggle-row"
                onClick={() => {
                  setLoveMode(!loveMode);
                  toast(!loveMode ? 'Love mode on 💜' : 'Love mode off');
                }}
              >
                <span className="toggle-row__meta">
                  <span className="toggle-row__title" style={{ display: 'block' }}>
                    Love mode
                  </span>
                  <span className="toggle-row__sub" style={{ display: 'block' }}>
                    Warmer rose palette, hearts everywhere
                  </span>
                </span>
                <span
                  role="switch"
                  aria-checked={loveMode}
                  className={`toggle ${loveMode ? 'on' : ''}`}
                />
              </button>
              <button
                type="button"
                className="toggle-row"
                onClick={() => setHeartMotion(!heartMotion)}
              >
                <span className="toggle-row__meta">
                  <span className="toggle-row__title" style={{ display: 'block' }}>
                    Floating hearts
                  </span>
                  <span className="toggle-row__sub" style={{ display: 'block' }}>
                    Gentle motion on calls and empty states
                  </span>
                </span>
                <span
                  role="switch"
                  aria-checked={heartMotion}
                  className={`toggle ${heartMotion ? 'on' : ''}`}
                />
              </button>
              <button type="button" className="toggle-row" onClick={() => setGlass(!glass)}>
                <span className="toggle-row__meta">
                  <span className="toggle-row__title" style={{ display: 'block' }}>
                    Glass effects
                  </span>
                  <span className="toggle-row__sub" style={{ display: 'block' }}>
                    Frosted cards and blurred header bars
                  </span>
                </span>
                <span role="switch" aria-checked={glass} className={`toggle ${glass ? 'on' : ''}`} />
              </button>
            </div>

            <div className="premium-banner">
              <div className="badge-premium" style={{ marginBottom: 10 }}>
                Premium
              </div>
              <div className="premium-banner__title">Make Duora yours</div>
              <div className="premium-banner__sub">
                Unlock every love theme, animated hearts and exclusive icon sets.
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
