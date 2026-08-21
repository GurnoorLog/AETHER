/**
 * Theme context: the single source of truth for light/dark mode.
 *
 * `useTheme()` returns the fully-assembled token bundle plus the current
 * `dark` flag and `setDark`. The chosen palette persists to AsyncStorage so a
 * reload keeps the user's preference.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { makeGlassTheme, type GlassTheme } from './makeTheme';
import { accents, type AccentKey } from './glass';

const THEME_KEY = 'half-turn:theme:dark';
const ACCENT_KEY = 'half-turn:theme:accent';

interface ThemeValue {
  dark: boolean;
  /** Apply the palette. Pass `true` for dark, `false` for light. */
  setDark: (dark: boolean) => void;
  /** Toggle between palettes. */
  toggleDark: () => void;
  /** User-chosen accent for app chrome (nav disc, defaults). Defaults to 'home'. */
  accent: AccentKey;
  setAccent: (accent: AccentKey) => void;
  theme: GlassTheme;
}

const ThemeContext = createContext<ThemeValue>({
  dark: false,
  setDark: () => {},
  toggleDark: () => {},
  accent: 'home',
  setAccent: () => {},
  theme: makeGlassTheme(false),
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDarkState] = useState(false);
  const [accent, setAccentState] = useState<AccentKey>('home');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([AsyncStorage.getItem(THEME_KEY), AsyncStorage.getItem(ACCENT_KEY)])
      .then(([darkValue, accentValue]) => {
        if (!mounted) return;
        if (darkValue === '1') setDarkState(true);
        if (accentValue && accentValue in accents) setAccentState(accentValue as AccentKey);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setDark = (next: boolean) => {
    setDarkState(next);
    AsyncStorage.setItem(THEME_KEY, next ? '1' : '0').catch(() => {});
  };
  const toggleDark = () => setDark(!dark);
  const setAccent = (next: AccentKey) => {
    setAccentState(next);
    AsyncStorage.setItem(ACCENT_KEY, next).catch(() => {});
  };

  const theme = useMemo(() => makeGlassTheme(dark), [dark]);

  const value = useMemo<ThemeValue>(() => ({ dark, setDark, toggleDark, accent, setAccent, theme }), [dark, accent, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
