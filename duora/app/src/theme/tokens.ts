/**
 * Duora design tokens — a 1:1 port of the web UI's CSS custom properties
 * (duora/ui/src/styles.css). Light is the base palette; `dark` and the accent
 * themes override the same variables, exactly like the CSS does.
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentKey = 'violet' | 'rose' | 'sunset' | 'mint';

export type Gradient = readonly [string, string];

export interface DuoraTokens {
  /* surfaces */
  bg: string;
  bgTint: string;
  surface: string;
  surfaceSoft: string;
  surfaceGlass: string;

  /* text */
  text: string;
  text2: string;
  text3: string;

  /* brand */
  primary: string;
  primary2: string;
  primaryDeep: string;
  primarySoft: string;
  primaryGhost: string;

  pink: string;
  pinkSoft: string;
  peach: string;
  peachSoft: string;
  mint: string;
  mintSoft: string;
  danger: string;

  bubbleOut: Gradient;
  bubbleIn: string;

  line: string;
  lineStrong: string;

  /* effects */
  card: string;
  card2: string;
  cardBorder: string;
  navBg: string;
  navBorder: string;
  fieldBg: string;
  chipBg: string;
  shellTop: string;
  glowA: string;
  glowB: string;
  scrim: string;
  gradIconSoft: Gradient;

  /* type */
  fontUi: string;
  fontScript: string;
}

export const radii = {
  xs: 10,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 30,
  x2l: 36,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 19, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '600' as const },
  script: { fontSize: 30, lineHeight: 34, fontWeight: '400' as const },
} as const;

export type ShadowLevel = 'xs' | 'sm' | 'md' | 'lg' | 'primary';

export type ShadowStyle = {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
};

export const baseLight: DuoraTokens = {
  bg: '#fff8fa',
  bgTint: '#fff0f4',
  surface: '#ffffff',
  surfaceSoft: '#fff5f8',
  surfaceGlass: 'rgba(255, 255, 255, 0.84)',

  text: '#27141e',
  text2: '#715d68',
  text3: '#a68e99',

  primary: '#e8497f',
  primary2: '#f4719f',
  primaryDeep: '#b7275a',
  primarySoft: '#ffe7ef',
  primaryGhost: 'rgba(232, 73, 127, 0.09)',

  pink: '#f58bbf',
  pinkSoft: '#fdeef5',
  peach: '#ffb26b',
  peachSoft: '#fff2e6',
  mint: '#22c55e',
  mintSoft: '#e7f9ee',
  danger: '#f4453f',

  bubbleOut: ['#f4719f', '#dd3a72'],
  bubbleIn: '#ffffff',

  line: 'rgba(90, 37, 60, 0.08)',
  lineStrong: 'rgba(90, 37, 60, 0.14)',

  card: 'rgba(255, 255, 255, 0.95)',
  card2: 'rgba(255, 255, 255, 0.88)',
  cardBorder: 'rgba(255, 255, 255, 0.94)',
  navBg: 'rgba(255, 252, 253, 0.94)',
  navBorder: 'rgba(126, 54, 82, 0.08)',
  fieldBg: '#fff4f7',
  chipBg: 'rgba(255, 255, 255, 0.9)',
  shellTop: '#fff2f6',
  glowA: 'rgba(255, 197, 216, 0.74)',
  glowB: 'rgba(255, 225, 234, 0.84)',
  scrim: 'rgba(47, 20, 34, 0.42)',
  gradIconSoft: ['#fff4f7', '#ffe6ee'],

  fontUi: 'PlusJakartaSans_400Regular',
  fontScript: 'GreatVibes_400Regular',
};

/** `.frame[data-mode='dark']` */
export const baseDark: DuoraTokens = {
  ...baseLight,
  bg: '#0f0b1b',
  bgTint: '#151024',
  surface: '#1a1530',
  surfaceSoft: '#221b3b',
  surfaceGlass: 'rgba(26, 21, 48, 0.72)',

  text: '#f2edff',
  text2: '#aaa0c8',
  text3: '#7d739c',

  primary: '#9a7cff',
  primary2: '#b499ff',
  primaryDeep: '#cbbaff',
  primarySoft: 'rgba(154, 124, 255, 0.18)',
  primaryGhost: 'rgba(154, 124, 255, 0.14)',

  line: 'rgba(255, 255, 255, 0.08)',
  lineStrong: 'rgba(255, 255, 255, 0.14)',

  bubbleIn: '#241d3c',
  bubbleOut: ['#7c58ff', '#5a37e6'],

  card: 'rgba(30, 24, 52, 0.94)',
  card2: 'rgba(32, 25, 55, 0.86)',
  cardBorder: 'rgba(255, 255, 255, 0.07)',
  navBg: 'rgba(17, 12, 30, 0.88)',
  navBorder: 'rgba(255, 255, 255, 0.06)',
  fieldBg: '#241d3c',
  chipBg: 'rgba(38, 30, 62, 0.86)',
  shellTop: '#17112a',
  glowA: 'rgba(109, 75, 246, 0.26)',
  glowB: 'rgba(90, 60, 180, 0.2)',
  scrim: 'rgba(5, 3, 12, 0.62)',
  gradIconSoft: ['#2b2348', '#221b3b'],
};

/** `.frame[data-accent='…']` — applied on top of light or dark. */
export const accents: Record<
  AccentKey,
  {
    name: string;
    blurb: string;
    swatch: Gradient;
    light: Partial<DuoraTokens>;
    dark: Partial<DuoraTokens>;
  }
> = {
  violet: {
    name: 'Violet Love',
    blurb: 'Calm and dreamy — the original Duora mood.',
    swatch: ['#A98BFF', '#6D4BF6'],
    light: {
      primary: '#6d4bf6',
      primary2: '#8f6bff',
      primaryDeep: '#4b2fd6',
      primarySoft: '#efeaff',
      primaryGhost: 'rgba(109, 75, 246, 0.08)',
      bubbleOut: ['#7b57ff', '#6240f0'],
      glowA: 'rgba(214, 197, 255, 0.75)',
      glowB: 'rgba(233, 222, 255, 0.85)',
      shellTop: '#f8f3ff',
    },
    dark: {
      primary: '#9a7cff',
      primary2: '#b499ff',
      primaryDeep: '#cbbaff',
      primarySoft: 'rgba(154, 124, 255, 0.18)',
      primaryGhost: 'rgba(154, 124, 255, 0.14)',
      bubbleOut: ['#7c58ff', '#5a37e6'],
      shellTop: '#17112a',
      glowA: 'rgba(109, 75, 246, 0.26)',
      glowB: 'rgba(90, 60, 180, 0.2)',
    },
  },
  rose: {
    name: 'Rose Love',
    blurb: 'Warm blush, first-date butterflies.',
    swatch: ['#F98BB8', '#E23E77'],
    light: {
      primary: '#e8497f',
      primary2: '#f4719f',
      primaryDeep: '#b7275a',
      primarySoft: '#ffe7ef',
      primaryGhost: 'rgba(232, 73, 127, 0.09)',
      bubbleOut: ['#f4719f', '#dd3a72'],
      glowA: 'rgba(255, 199, 220, 0.78)',
      glowB: 'rgba(255, 224, 235, 0.85)',
      shellTop: '#fff5f9',
      pink: '#f58bbf',
    },
    dark: {
      primary: '#f4719f',
      primary2: '#ff9dbd',
      primaryDeep: '#ffbcd3',
      primarySoft: 'rgba(244, 113, 159, 0.18)',
      primaryGhost: 'rgba(244, 113, 159, 0.14)',
      bubbleOut: ['#f4719f', '#dd3a72'],
      shellTop: '#24101c',
      glowA: 'rgba(226, 60, 116, 0.26)',
      glowB: 'rgba(160, 50, 96, 0.2)',
    },
  },
  sunset: {
    name: 'Sunset Love',
    blurb: 'Golden hour, hands held a little tighter.',
    swatch: ['#FFAB76', '#F2703F'],
    light: {
      primary: '#e8763c',
      primary2: '#ff9b62',
      primaryDeep: '#b64d16',
      primarySoft: '#ffefe3',
      primaryGhost: 'rgba(232, 118, 60, 0.1)',
      bubbleOut: ['#ff9e63', '#e8602c'],
      glowA: 'rgba(255, 214, 186, 0.8)',
      glowB: 'rgba(255, 232, 214, 0.88)',
      shellTop: '#fff7f1',
      pink: '#ff9bb0',
    },
    dark: {
      primary: '#ff9b62',
      primary2: '#ffb98f',
      primaryDeep: '#ffd0b3',
      primarySoft: 'rgba(255, 155, 98, 0.18)',
      primaryGhost: 'rgba(255, 155, 98, 0.14)',
      bubbleOut: ['#ff9e63', '#e8602c'],
      shellTop: '#24160e',
      glowA: 'rgba(236, 106, 51, 0.25)',
      glowB: 'rgba(160, 80, 44, 0.2)',
    },
  },
  mint: {
    name: 'Mint Love',
    blurb: 'Fresh, quiet mornings together.',
    swatch: ['#7BDCB5', '#239E7A'],
    light: {
      primary: '#1f9d78',
      primary2: '#45c39b',
      primaryDeep: '#137358',
      primarySoft: '#e4f8f0',
      primaryGhost: 'rgba(31, 157, 120, 0.1)',
      bubbleOut: ['#43c79f', '#148f6d'],
      glowA: 'rgba(190, 240, 222, 0.8)',
      glowB: 'rgba(219, 248, 238, 0.88)',
      shellTop: '#f2fdf9',
      pink: '#7ed8b6',
    },
    dark: {
      primary: '#4ed0a6',
      primary2: '#74e0bd',
      primaryDeep: '#a6f0da',
      primarySoft: 'rgba(78, 208, 166, 0.18)',
      primaryGhost: 'rgba(78, 208, 166, 0.14)',
      bubbleOut: ['#43c79f', '#148f6d'],
      shellTop: '#08211b',
      glowA: 'rgba(24, 155, 118, 0.24)',
      glowB: 'rgba(20, 110, 90, 0.2)',
    },
  },
};

export const modeCopy: Record<ThemeMode, { title: string; blurb: string }> = {
  light: { title: 'Light', blurb: 'Bright, soft and airy' },
  dark: { title: 'Dark', blurb: 'Easy on the eyes at night' },
  system: { title: 'System', blurb: 'Follows your phone' },
};

/** Builds the final token set for a mode + accent combination. */
export function resolveTokens(mode: 'light' | 'dark', accent: AccentKey): DuoraTokens {
  const base = mode === 'dark' ? baseDark : baseLight;
  const override = accents[accent][mode];
  return { ...base, ...override };
}

/** Elevation presets mirroring the CSS shadow scale. */
export function shadow(level: ShadowLevel, mode: 'light' | 'dark', primary: string): ShadowStyle {
  if (level === 'primary') {
    return {
      shadowColor: mode === 'dark' ? '#000000' : primary,
      shadowOpacity: mode === 'dark' ? 0.4 : 0.32,
      shadowRadius: 26,
      shadowOffset: { width: 0, height: 12 },
      elevation: 10,
    };
  }
  const scale: Record<Exclude<ShadowLevel, 'primary'>, { r: number; y: number; o: number; e: number }> = {
    xs: { r: 8, y: 2, o: mode === 'dark' ? 0.35 : 0.05, e: 2 },
    sm: { r: 18, y: 6, o: mode === 'dark' ? 0.38 : 0.07, e: 4 },
    md: { r: 34, y: 14, o: mode === 'dark' ? 0.45 : 0.1, e: 8 },
    lg: { r: 70, y: 28, o: mode === 'dark' ? 0.55 : 0.2, e: 16 },
  };
  const s = scale[level];
  return {
    shadowColor: mode === 'dark' ? '#000000' : '#362078',
    shadowOpacity: s.o,
    shadowRadius: s.r,
    shadowOffset: { width: 0, height: s.y },
    elevation: s.e,
  };
}

/** Fill helper — React Native 0.86 no longer types `StyleSheet.absoluteFillObject`. */
export const ABSOLUTE_FILL = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

/** Ordered list of the accent moods (violet → rose → sunset → mint). */
export const accentList: { key: AccentKey; name: string; blurb: string; swatch: Gradient }[] = (
  Object.keys(accents) as AccentKey[]
).map((key) => ({ key, ...accents[key] }));
