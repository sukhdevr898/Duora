type Props = { light?: boolean; time?: string };

function Signal({ light }: { light?: boolean }) {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden="true">
      <rect x="0" y="8" width="2.6" height="4" rx="0.8" opacity={light ? 0.95 : 1} />
      <rect x="4.4" y="5.6" width="2.6" height="6.4" rx="0.8" opacity={light ? 0.95 : 1} />
      <rect x="8.8" y="3.2" width="2.6" height="8.8" rx="0.8" opacity={light ? 0.95 : 1} />
      <rect x="13.2" y="0" width="2.6" height="12" rx="0.8" opacity={light ? 0.95 : 1} />
    </svg>
  );
}

function Wifi() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
      <path
        d="M1 4.1C3.1 2.4 5.4 1.5 8 1.5s4.9.9 7 2.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M3.2 6.7C4.6 5.6 6.2 5 8 5s3.4.6 4.8 1.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="8" cy="10" r="1.5" fill="currentColor" />
    </svg>
  );
}

function Battery() {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true">
      <rect x="0.6" y="0.6" width="21" height="10.8" rx="3" stroke="currentColor" strokeOpacity="0.45" />
      <rect x="2.4" y="2.4" width="14.5" height="7.2" rx="1.8" fill="currentColor" />
      <path
        d="M23 4.2v3.6c.9-.3 1.4-.9 1.4-1.8S23.9 4.5 23 4.2z"
        fill="currentColor"
        fillOpacity="0.55"
      />
    </svg>
  );
}

export function StatusBar({ light, time = '10:29' }: Props) {
  return (
    <div className={`statusbar ${light ? 'light' : ''}`} aria-hidden="true">
      <span>{time}</span>
      <span className="statusbar__icons">
        <Signal light={light} />
        <Wifi />
        <span className="statusbar__battery">
          <Battery />
        </span>
      </span>
    </div>
  );
}
