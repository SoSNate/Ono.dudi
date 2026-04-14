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
   Supports: light, dark, high-contrast, custom
   ════════════════════════════════════════════════════════════════════════════ */

export type ThemeName = 'light' | 'dark' | 'high-contrast' | 'custom';

export interface CustomThemeOverrides {
  [variableName: string]: string;
}

export interface ThemeContextValue {
  /** Current active theme */
  theme: ThemeName;
  /** Switch to a different theme */
  setTheme: (t: ThemeName) => void;
  /** Custom color overrides (only applied when theme === 'custom') */
  customOverrides: CustomThemeOverrides;
  /** Update custom theme overrides */
  setCustomOverrides: (o: CustomThemeOverrides) => void;
  /** Read a resolved CSS variable value — use this for <canvas> drawing */
  resolveVar: (varName: string) => string;
  /** Focus mode (hides sidebar, notes, chrome) */
  focusMode: boolean;
  /** Toggle focus mode */
  setFocusMode: (f: boolean) => void;
  /** Convenience: is the current theme "dark-like"? (dark or high-contrast) */
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* ─── Storage Keys ─── */
const STORAGE_THEME = 'ono-stats-theme';
const STORAGE_CUSTOM = 'ono-stats-custom-theme';
const STORAGE_FOCUS = 'ono-stats-focus-mode';

/* ─── Default custom overrides (starts as light) ─── */
const DEFAULT_CUSTOM: CustomThemeOverrides = {
  '--accent-primary': '#2d6441',
  '--accent-secondary': '#5a9e6e',
  '--bg-primary': '#f8fbff',
  '--bg-card': '#ffffff',
  '--text-primary': '#1a1a2e',
  '--text-secondary': '#4a5568',
};

/* ─── Read initial values from localStorage ─── */
function getInitialTheme(): ThemeName {
  try {
    const stored = localStorage.getItem(STORAGE_THEME);
    if (stored && ['light', 'dark', 'high-contrast', 'custom'].includes(stored)) {
      return stored as ThemeName;
    }
  } catch {}
  return 'light';
}

function getInitialCustom(): CustomThemeOverrides {
  try {
    const stored = localStorage.getItem(STORAGE_CUSTOM);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { ...DEFAULT_CUSTOM };
}

function getInitialFocus(): boolean {
  try {
    return localStorage.getItem(STORAGE_FOCUS) === 'true';
  } catch {}
  return false;
}

/* ════════════════════════════════════════════════════════════════════════════
   Provider Component
   ════════════════════════════════════════════════════════════════════════════ */

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);
  const [customOverrides, setCustomState] = useState<CustomThemeOverrides>(getInitialCustom);
  const [focusMode, setFocusModeState] = useState<boolean>(getInitialFocus);

  /* ─── Apply theme to DOM ─── */
  useEffect(() => {
    const root = document.documentElement;

    // Set the data-theme attribute
    root.setAttribute('data-theme', theme);

    // Backward compat: set/remove 'dark' class for existing dark: Tailwind classes
    const isDarkLike = theme === 'dark' || theme === 'high-contrast';
    if (isDarkLike) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply custom overrides when in custom theme
    if (theme === 'custom') {
      // First, copy all light-theme defaults (custom inherits from light)
      // Then apply user overrides on top
      Object.entries(customOverrides).forEach(([prop, value]) => {
        root.style.setProperty(prop, value);
      });
    } else {
      // Clear any inline custom overrides
      Object.keys(customOverrides).forEach((prop) => {
        root.style.removeProperty(prop);
      });
    }

    // Persist
    try {
      localStorage.setItem(STORAGE_THEME, theme);
    } catch {}
  }, [theme, customOverrides]);

  /* ─── Focus mode ─── */
  useEffect(() => {
    const root = document.documentElement;
    if (focusMode) {
      root.classList.add('focus-mode');
    } else {
      root.classList.remove('focus-mode');
    }
    try {
      localStorage.setItem(STORAGE_FOCUS, String(focusMode));
    } catch {}
  }, [focusMode]);

  /* ─── Set theme ─── */
  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
  }, []);

  /* ─── Set custom overrides ─── */
  const setCustomOverrides = useCallback((o: CustomThemeOverrides) => {
    setCustomState(o);
    try {
      localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(o));
    } catch {}
  }, []);

  /* ─── Set focus mode ─── */
  const setFocusMode = useCallback((f: boolean) => {
    setFocusModeState(f);
  }, []);

  /* ─── Resolve a CSS variable for canvas drawing ─── */
  const resolveVar = useCallback((varName: string): string => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim();
  }, []);

  const isDark = theme === 'dark' || theme === 'high-contrast';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        customOverrides,
        setCustomOverrides,
        resolveVar,
        focusMode,
        setFocusMode,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Hook
   ════════════════════════════════════════════════════════════════════════════ */

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
