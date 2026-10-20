/**
 * Duora design tokens. Single source of truth for color, type, spacing,
 * radii and elevation — screens must never hardcode raw hex values.
 */
export interface DuoraColors {
  background: string;
  surface: string;
  elevated: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  overlay: string;
  gradient: readonly string[];
}

export const palette: Record<'dark' | 'light', DuoraColors> = {
  dark: {
    background: '#100D17',
    surface: '#191423',
    elevated: '#241C32',
    primary: '#B69CFF',
    secondary: '#F19AB9',
    text: '#F7F3FF',
    textSecondary: '#B8AEC9',
    success: '#75D6AC',
    warning: '#F4C779',
    error: '#FF8296',
    border: 'rgba(247,243,255,0.10)',
    overlay: 'rgba(8,5,14,0.72)',
    gradient: ['#2B1F47', '#191423'],
  },
  light: {
    background: '#FBF8FF',
    surface: '#FFFFFF',
    elevated: '#F1EAF9',
    primary: '#7650B8',
    secondary: '#D96F9C',
    text: '#241B32',
    textSecondary: '#756982',
    success: '#2E9E6E',
    warning: '#B07A1E',
    error: '#D64B66',
    border: 'rgba(36,27,50,0.12)',
    overlay: 'rgba(36,27,50,0.45)',
    gradient: ['#E9DEFA', '#FBF8FF'],
  },
};

export type ColorScheme = 'dark' | 'light';
export type ThemeMode = 'system' | 'light' | 'dark';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const, letterSpacing: -0.3 },
  heading: { fontSize: 19, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  button: { fontSize: 16, lineHeight: 20, fontWeight: '600' as const },
};

export interface DuoraShadow {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
}

export const shadows: Record<'dark' | 'light', { card: DuoraShadow; floating: DuoraShadow }> = {
  dark: {
    card: { shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
    floating: { shadowColor: '#000000', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  },
  light: {
    card: { shadowColor: '#7650B8', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
    floating: { shadowColor: '#7650B8', shadowOpacity: 0.2, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  },
};

export const touchTarget = 48;
