import { useId } from 'react';

export const HEART_PATH =
  'M50 88 C 20 66, 6 48, 6 33 C 6 18, 18 8, 31 8 C 40 8, 47 13, 50 19 C 53 13, 60 8, 69 8 C 82 8, 94 18, 94 33 C 94 48, 80 66, 50 88 Z';

/** Duora two-hearts mark — pink heart behind, violet heart in front. */
export function LogoHearts({ size = 30 }: { size?: number }) {
  const uid = useId().replace(/:/g, '');
  return (
    <span className="logo-hearts" style={{ width: size, height: size * 0.86 }}>
      <svg viewBox="0 0 100 92" width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id={`lp-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFB3D6" />
            <stop offset="55%" stopColor="#F283B9" />
            <stop offset="100%" stopColor="#D8558F" />
          </linearGradient>
          <linearGradient id={`lv-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A98BFF" />
            <stop offset="45%" stopColor="#7C51F5" />
            <stop offset="100%" stopColor="#4B28C9" />
          </linearGradient>
          <linearGradient id={`lh-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* back / pink heart */}
        <g transform="translate(-6 8) scale(0.86) rotate(-8 50 48)">
          <path d={HEART_PATH} fill={`url(#lp-${uid})`} />
        </g>
        {/* front / violet heart */}
        <g transform="translate(16 -2) scale(0.9) rotate(6 50 48)">
          <path d={HEART_PATH} fill={`url(#lv-${uid})`} />
          <path
            d="M31 18 C 22 20, 17 26, 17 34 C 17 40, 22 38, 26 32 C 29 27, 31 22, 33 20 Z"
            fill={`url(#lh-${uid})`}
            opacity="0.55"
          />
        </g>
      </svg>
    </span>
  );
}

/** Large glossy 3D heart used in empty states & quote card. */
export function HeartOrb({
  size = 140,
  tone = 'violet',
  className = '',
}: {
  size?: number;
  tone?: 'violet' | 'pink';
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const stops =
    tone === 'violet'
      ? [
          ['0%', '#C9B4FF'],
          ['35%', '#8F6BFF'],
          ['72%', '#6B40EC'],
          ['100%', '#4A21C4'],
        ]
      : [
          ['0%', '#FFD3E6'],
          ['40%', '#F9A9CD'],
          ['75%', '#EE7FB0'],
          ['100%', '#D9558F'],
        ];
  return (
    <span className={`heart-orb ${className}`} style={{ width: size, height: size * 0.95 }}>
      <svg viewBox="0 0 120 112" width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id={`hg-${uid}`} x1="0.15" y1="0" x2="0.85" y2="1">
            {stops.map(([offset, color]) => (
              <stop key={offset} offset={offset} stopColor={color} />
            ))}
          </linearGradient>
          <radialGradient id={`hs-${uid}`} cx="0.34" cy="0.26" r="0.5">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#fff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`hr-${uid}`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id={`hb-${uid}`} x="-40%" y="-40%" width="180%" height="190%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
        </defs>
        <ellipse
          cx="60"
          cy="100"
          rx="34"
          ry="9"
          fill={tone === 'violet' ? '#6B40EC' : '#D9558F'}
          opacity="0.28"
          filter={`url(#hb-${uid})`}
        />
        <g transform="translate(6 4) scale(1.08)">
          <path d={HEART_PATH} fill={`url(#hg-${uid})`} />
          <path d={HEART_PATH} fill={`url(#hr-${uid})`} />
          <path d={HEART_PATH} fill={`url(#hs-${uid})`} />
          {/* specular highlight swoosh */}
          <ellipse cx="33" cy="26" rx="11" ry="6.5" fill="#fff" opacity="0.5" transform="rotate(-28 33 26)" />
          <ellipse cx="30" cy="24" rx="4.5" ry="2.8" fill="#fff" opacity="0.9" transform="rotate(-28 30 24)" />
        </g>
      </svg>
    </span>
  );
}

export function Sparkle({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`sparkle ${className}`} style={style} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M12 0c.7 6.4 4.9 10.6 11.3 11.3C16.9 12 12.7 16.2 12 22.6 11.3 16.2 7.1 12 .7 11.3 7.1 10.6 11.3 6.4 12 0z" />
      </svg>
    </span>
  );
}

/** Soft organic wave stack for the welcome screen. */
export function WelcomeWaves() {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      className="welcome__waves"
      viewBox="0 0 420 420"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`w1-${uid}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`w2-${uid}`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#C9AEFF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#A97BFF" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id={`w3-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4B7DE" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#C98CF5" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`w4-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        d="M0 150 C 90 96 190 118 260 168 C 330 218 386 208 420 182 L420 420 L0 420 Z"
        fill={`url(#w1-${uid})`}
      />
      <path
        d="M0 218 C 96 168 170 208 250 236 C 330 264 380 246 420 214 L420 420 L0 420 Z"
        fill={`url(#w2-${uid})`}
      />
      <path
        d="M0 286 C 84 250 168 288 252 306 C 332 322 386 302 420 278 L420 420 L0 420 Z"
        fill={`url(#w3-${uid})`}
      />
      <path
        d="M0 344 C 120 316 210 356 300 366 C 356 372 396 364 420 354 L420 420 L0 420 Z"
        fill={`url(#w4-${uid})`}
      />
    </svg>
  );
}
