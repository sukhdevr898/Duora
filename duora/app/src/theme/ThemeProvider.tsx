import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import {
  accents,
  resolveTokens,
  shadow,
  type AccentKey,
  type DuoraTokens,
  type ShadowLevel,
  type ShadowStyle,
  type ThemeMode,
} from './tokens';

export type ThemeValue = {
  mode: 'light' | 'dark';
  themePreference: ThemeMode;
  accent: AccentKey;
  loveMode: boolean;
  heartMotion: boolean;
  glass: boolean;
  t: DuoraTokens;
  shadow: (level: ShadowLevel) => ShadowStyle;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentKey) => void;
  setLoveMode: (value: boolean) => void;
  setHeartMotion: (value: boolean) => void;
  setGlass: (value: boolean) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

export type ThemeController = {
  themePreference: ThemeMode;
  accent: AccentKey;
  loveMode: boolean;
  heartMotion: boolean;
  glass: boolean;
  setThemePreference: (mode: ThemeMode) => void;
  setAccent: (accent: AccentKey) => void;
  setLoveMode: (value: boolean) => void;
  setHeartMotion: (value: boolean) => void;
  setGlass: (value: boolean) => void;
};

const ThemeActionsContext = createContext<ThemeController | null>(null);

export function ThemeProvider({
  children,
  controller,
}: {
  children: ReactNode;
  controller: ThemeController;
}) {
  const systemScheme = useColorScheme();
  const { themePreference, accent, loveMode, heartMotion, glass } = controller;

  const mode: 'light' | 'dark' =
    themePreference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : themePreference;

  const tokens = useMemo(() => resolveTokens(mode, accent), [mode, accent]);

  // One stable shadow helper for the whole tree - building it per call meant
  // resolving the whole palette on every shadowed view.
  const shadowFor = useMemo(
    () => (level: ShadowLevel) => shadow(level, mode, tokens.primary),
    [mode, tokens],
  );

  const value = useMemo<ThemeValue>(
    () => ({
      mode,
      themePreference,
      accent,
      loveMode,
      heartMotion,
      glass,
      t: tokens,
      shadow: shadowFor,
      setMode: controller.setThemePreference,
      setAccent: controller.setAccent,
      setLoveMode: controller.setLoveMode,
      setHeartMotion: controller.setHeartMotion,
      setGlass: controller.setGlass,
    }),
    [
      mode,
      themePreference,
      accent,
      loveMode,
      heartMotion,
      glass,
      tokens,
      shadowFor,
      controller.setThemePreference,
      controller.setAccent,
      controller.setLoveMode,
      controller.setHeartMotion,
      controller.setGlass,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      <ThemeActionsContext.Provider value={controller}>{children}</ThemeActionsContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useDuoraTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useDuoraTheme must be used inside <ThemeProvider>');
  return ctx;
}

/** Actions are safe to call from anywhere (they persist through the store). */
export function useThemeActions(): ThemeController {
  const ctx = useContext(ThemeActionsContext);
  if (!ctx) throw new Error('useThemeActions must be used inside <ThemeProvider>');
  return ctx;
}

export { accents };
