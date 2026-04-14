import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

/* ════════════════════════════════════════════════════════════════════════════
   Theme System — ThemeProvider + useTheme hook
   3 themes only: light | dark | high-contrast
   ════════════════════════════════════════════════════════════════════════════ */

export type ThemeName = 'light' | 'dark' | 'high-contrast';

export interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  resolveVar: (varName: string) => string;
  focusMode: boolean;
  setFocusMode: (f: boolean) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_THEME = 'ono-stats-theme';
const STORAGE_FOCUS  = 'ono-stats-focus-mode';

function getInitialTheme(): ThemeName {
  try {
    const s = localStorage.getItem(STORAGE_THEME);
    if (s === 'dark' || s === 'high-contrast') return s;
  } catch {}
  return 'light';
}

function getInitialFocus(): boolean {
  try { return localStorage.getItem(STORAGE_FOCUS) === 'true'; } catch {}
  return false;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState]     = useState<ThemeName>(getInitialTheme);
  const [focusMode, setFocusModeState] = useState<boolean>(getInitialFocus);

  /* ─── Apply theme to DOM ─── */
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // Keep Tailwind dark: classes working
    if (theme === 'dark' || theme === 'high-contrast') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try { localStorage.setItem(STORAGE_THEME, theme); } catch {}
  }, [theme]);

  /* ─── Focus mode → toggle .focus-active on <html> ─── */
  useEffect(() => {
    const root = document.documentElement;
    if (focusMode) {
      root.classList.add('focus-active');
    } else {
      root.classList.remove('focus-active');
    }
    try { localStorage.setItem(STORAGE_FOCUS, String(focusMode)); } catch {}
  }, [focusMode]);

  const setTheme     = useCallback((t: ThemeName) => setThemeState(t), []);
  const setFocusMode = useCallback((f: boolean) => setFocusModeState(f), []);

  const resolveVar = useCallback((varName: string): string =>
    getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  , []);

  const isDark = theme === 'dark' || theme === 'high-contrast';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolveVar, focusMode, setFocusMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a <ThemeProvider>');
  return ctx;
}
