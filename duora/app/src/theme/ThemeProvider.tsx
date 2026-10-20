import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { palette, shadows, spacing, radii, typography, type ColorScheme, type DuoraColors, type ThemeMode } from './tokens';
import { useSettingsStore } from '../state/settings.store';

interface ThemeValue {
  mode: ColorScheme;
  themePreference: ThemeMode;
  colors: DuoraColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  shadows: (typeof shadows)['dark'];
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const themePreference = useSettingsStore((s) => s.theme);

  const mode: ColorScheme =
    themePreference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : themePreference;

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      themePreference,
      colors: palette[mode],
      spacing,
      radii,
      typography,
      shadows: shadows[mode],
    }),
    [mode, themePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useDuoraTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useDuoraTheme must be used inside <ThemeProvider>');
  return ctx;
}
