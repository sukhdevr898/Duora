import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentKey = 'violet' | 'rose' | 'sunset' | 'mint';
export type ServerStatus = 'online' | 'connecting' | 'offline';
export type PairingPhase = 'idle' | 'outgoing' | 'incoming' | 'matched';

export type Accent = {
  key: AccentKey;
  name: string;
  blurb: string;
  swatch: [string, string];
};

export const accents: Accent[] = [
  {
    key: 'violet',
    name: 'Violet Love',
    blurb: 'Calm and dreamy — the original Duora mood.',
    swatch: ['#A98BFF', '#6D4BF6'],
  },
  {
    key: 'rose',
    name: 'Rose Love',
    blurb: 'Warm blush, first-date butterflies.',
    swatch: ['#F98BB8', '#E23E77'],
  },
  {
    key: 'sunset',
    name: 'Sunset Love',
    blurb: 'Golden hour, hands held a little tighter.',
    swatch: ['#FFAB76', '#F2703F'],
  },
  {
    key: 'mint',
    name: 'Mint Love',
    blurb: 'Fresh, quiet mornings together.',
    swatch: ['#7BDCB5', '#239E7A'],
  },
];

export const modeCopy: Record<ThemeMode, { title: string; blurb: string }> = {
  light: { title: 'Light', blurb: 'Bright, soft and airy' },
  dark: { title: 'Dark', blurb: 'Easy on the eyes at night' },
  system: { title: 'System', blurb: 'Follows your phone' },
};

type ServerInfo = {
  status: ServerStatus;
  latency: number;
  history: number[];
  uptimeSeconds: number;
  region: string;
  apiBase: string;
  version: string;
  lastChecked: number;
  autoReconnect: boolean;
};

type PairingInfo = {
  phase: PairingPhase;
  code: string;
  targetCode: string;
  matchedAt: number | null;
  linkedName: string | null;
  celebrate: boolean;
};

type AppValue = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  resolvedMode: 'light' | 'dark';
  accent: AccentKey;
  setAccent: (a: AccentKey) => void;
  accentInfo: Accent;
  heartMotion: boolean;
  setHeartMotion: (v: boolean) => void;
  loveMode: boolean;
  setLoveMode: (v: boolean) => void;
  glass: boolean;
  setGlass: (v: boolean) => void;
  server: ServerInfo;
  checkServer: () => void;
  simulateOutage: () => void;
  setAutoReconnect: (v: boolean) => void;
  pairing: PairingInfo;
  sendRequest: (code: string) => void;
  cancelRequest: () => void;
  acceptIncoming: () => void;
  declineIncoming: () => void;
  triggerIncoming: () => void;
  completeScan: () => void;
  resetPairing: () => void;
  dismissCelebration: () => void;
};

const AppContext = createContext<AppValue | null>(null);
const STORAGE_KEY = 'duora.ui.settings.v2';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const makeCode = () =>
  Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join(
    '',
  );

type Persisted = {
  mode?: ThemeMode;
  accent?: AccentKey;
  heartMotion?: boolean;
  glass?: boolean;
  loveMode?: boolean;
  autoReconnect?: boolean;
};

function readPersisted(): Persisted {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : {};
  } catch {
    return {};
  }
}

function useSystemDark() {
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return dark;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const persisted = useMemo(readPersisted, []);
  const systemDark = useSystemDark();

  const [mode, setModeState] = useState<ThemeMode>(persisted.mode ?? 'light');
  const [accent, setAccentState] = useState<AccentKey>(persisted.accent ?? 'violet');
  const [heartMotion, setHeartMotionState] = useState(persisted.heartMotion ?? true);
  const [glass, setGlassState] = useState(persisted.glass ?? true);
  const [loveMode, setLoveModeState] = useState(persisted.loveMode ?? false);

  const [server, setServer] = useState<ServerInfo>({
    status: 'online',
    latency: 42,
    history: [38, 44, 41, 52, 47, 43, 39, 45, 48, 40, 36, 44],
    uptimeSeconds: 12 * 24 * 3600 + 4 * 3600 + 12 * 60,
    region: 'Singapore · ap-southeast',
    apiBase: 'https://duora.onrender.com',
    version: 'v1.0.0',
    lastChecked: Date.now(),
    autoReconnect: persisted.autoReconnect ?? true,
  });

  const [pairing, setPairing] = useState<PairingInfo>({
    phase: 'matched',
    code: makeCode(),
    targetCode: '',
    matchedAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
    linkedName: 'ruhi',
    celebrate: false,
  });

  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  /* ---------------- persistence ---------------- */
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode,
          accent,
          heartMotion,
          glass,
          loveMode,
          autoReconnect: server.autoReconnect,
        }),
      );
    } catch {
      /* ignore private-mode failures */
    }
  }, [mode, accent, heartMotion, glass, loveMode, server.autoReconnect]);

  const resolvedMode: 'light' | 'dark' = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);
  const setAccent = useCallback(
    (a: AccentKey) => {
      setAccentState(a);
      if (a !== 'rose') setLoveModeState(false);
    },
    [],
  );
  const setHeartMotion = useCallback((v: boolean) => setHeartMotionState(v), []);
  const setGlass = useCallback((v: boolean) => setGlassState(v), []);
  const setLoveMode = useCallback((v: boolean) => {
    setLoveModeState(v);
    if (v) setAccentState('rose');
  }, []);

  /* ---------------- server heartbeat ---------------- */
  useEffect(() => {
    if (server.status !== 'online') return;
    const id = window.setInterval(() => {
      setServer((prev) => {
        if (prev.status !== 'online') return prev;
        const drift = Math.round((Math.random() - 0.5) * 22);
        const next = Math.min(180, Math.max(26, prev.latency + drift));
        return {
          ...prev,
          latency: next,
          history: [...prev.history.slice(-23), next],
          uptimeSeconds: prev.uptimeSeconds + 4,
          lastChecked: Date.now(),
        };
      });
    }, 4000);
    return () => window.clearInterval(id);
  }, [server.status]);

  useEffect(() => {
    if (server.status !== 'offline' || !server.autoReconnect) return;
    const id = window.setTimeout(() => {
      setServer((prev) => (prev.status === 'offline' ? { ...prev, status: 'connecting' } : prev));
    }, 12000);
    return () => window.clearTimeout(id);
  }, [server.status, server.autoReconnect]);

  useEffect(() => {
    if (server.status !== 'connecting') return;
    const id = window.setTimeout(() => {
      setServer((prev) => ({
        ...prev,
        status: 'online',
        latency: Math.max(30, Math.round(38 + Math.random() * 20)),
        lastChecked: Date.now(),
      }));
    }, 1600);
    return () => window.clearTimeout(id);
  }, [server.status]);

  const checkServer = useCallback(() => {
    setServer((prev) => ({ ...prev, status: 'connecting' }));
  }, []);

  const simulateOutage = useCallback(() => {
    setServer((prev) => ({ ...prev, status: 'offline', latency: 0 }));
  }, []);

  const setAutoReconnect = useCallback((v: boolean) => {
    setServer((prev) => ({ ...prev, autoReconnect: v }));
  }, []);

  /* ---------------- pairing ---------------- */
  const sendRequest = useCallback((code: string) => {
    clearTimers();
    setPairing((prev) => ({
      ...prev,
      phase: 'outgoing',
      targetCode: code.toUpperCase(),
      matchedAt: null,
    }));
    // mock: partner taps "Accept" a few seconds later
    timers.current.push(
      window.setTimeout(() => {
        setPairing((prev) =>
          prev.phase === 'outgoing'
            ? {
                ...prev,
                phase: 'matched',
                matchedAt: Date.now(),
                linkedName: 'ruhi',
                celebrate: true,
              }
            : prev,
        );
      }, 4600),
    );
  }, []);

  const cancelRequest = useCallback(() => {
    clearTimers();
    setPairing((prev) => ({ ...prev, phase: 'idle', targetCode: '' }));
  }, []);

  const acceptIncoming = useCallback(() => {
    clearTimers();
    setPairing((prev) => ({
      ...prev,
      phase: 'matched',
      matchedAt: Date.now(),
      linkedName: 'ruhi',
      celebrate: true,
    }));
  }, []);

  const declineIncoming = useCallback(() => {
    clearTimers();
    setPairing((prev) => ({ ...prev, phase: 'idle' }));
  }, []);

  const triggerIncoming = useCallback(() => {
    clearTimers();
    setPairing((prev) => ({ ...prev, phase: 'incoming' }));
  }, []);

  const completeScan = useCallback(() => {
    clearTimers();
    setPairing((prev) => ({
      ...prev,
      phase: 'matched',
      matchedAt: Date.now(),
      linkedName: 'ruhi',
      celebrate: true,
    }));
  }, []);

  const resetPairing = useCallback(() => {
    clearTimers();
    setPairing((prev) => ({
      ...prev,
      phase: 'idle',
      matchedAt: null,
      linkedName: null,
      celebrate: false,
      code: makeCode(),
    }));
  }, []);

  const dismissCelebration = useCallback(() => {
    setPairing((prev) => (prev.celebrate ? { ...prev, celebrate: false } : prev));
  }, []);

  const value = useMemo<AppValue>(
    () => ({
      mode,
      setMode,
      resolvedMode,
      accent,
      setAccent,
      accentInfo: accents.find((a) => a.key === accent) ?? accents[0],
      heartMotion,
      setHeartMotion,
      loveMode,
      setLoveMode,
      glass,
      setGlass,
      server,
      checkServer,
      simulateOutage,
      setAutoReconnect,
      pairing,
      sendRequest,
      cancelRequest,
      acceptIncoming,
      declineIncoming,
      triggerIncoming,
      completeScan,
      resetPairing,
      dismissCelebration,
    }),
    [
      mode,
      setMode,
      resolvedMode,
      accent,
      setAccent,
      heartMotion,
      setHeartMotion,
      loveMode,
      setLoveMode,
      glass,
      setGlass,
      server,
      checkServer,
      simulateOutage,
      setAutoReconnect,
      pairing,
      sendRequest,
      cancelRequest,
      acceptIncoming,
      declineIncoming,
      triggerIncoming,
      completeScan,
      resetPairing,
      dismissCelebration,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
