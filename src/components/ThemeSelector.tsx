import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Eye, Palette, Focus, ChevronDown } from 'lucide-react';
import { useTheme, type ThemeName, type CustomThemeOverrides } from '../context/ThemeContext';

/* ════════════════════════════════════════════════════════════════════════════
   ThemeSelector — Dropdown with 4 themes + Focus Mode toggle
   Replaces the old Sun/Moon toggle in nav bars.
   ════════════════════════════════════════════════════════════════════════════ */

interface ThemeOption {
  key: ThemeName;
  label: string;
  icon: React.ReactNode;
  preview: string; // Tailwind-like bg preview
}

const THEMES: ThemeOption[] = [
  { key: 'light',          label: 'בהיר',       icon: <Sun size={16} />,     preview: '#f8fbff' },
  { key: 'dark',           label: 'כהה',        icon: <Moon size={16} />,    preview: '#181818' },
  { key: 'high-contrast',  label: 'ניגודיות גבוהה', icon: <Eye size={16} />,  preview: '#000000' },
  { key: 'custom',         label: 'מותאם אישית', icon: <Palette size={16} />, preview: '#2d6441' },
];

const CUSTOM_FIELDS: { key: keyof CustomThemeOverrides; label: string }[] = [
  { key: '--accent-primary',   label: 'צבע ראשי' },
  { key: '--accent-secondary', label: 'צבע משני' },
  { key: '--bg-primary',       label: 'רקע' },
  { key: '--bg-card',          label: 'רקע כרטיס' },
  { key: '--text-primary',     label: 'טקסט' },
  { key: '--text-secondary',   label: 'טקסט משני' },
];

export function ThemeSelector() {
  const { theme, setTheme, customOverrides, setCustomOverrides, focusMode, setFocusMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCustom(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const currentTheme = THEMES.find((t) => t.key === theme) || THEMES[0];

  const handleThemeSelect = (key: ThemeName) => {
    setTheme(key);
    if (key === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      setOpen(false);
    }
  };

  const handleCustomChange = (varName: string, value: string) => {
    setCustomOverrides({ ...customOverrides, [varName]: value });
  };

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger Button ── */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl
                   border transition-all duration-200 min-h-[44px]
                   hover:shadow-theme-md"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-primary)',
          color: 'var(--text-primary)',
        }}
        aria-label="בחר ערכת נושא"
        aria-expanded={open}
      >
        {currentTheme.icon}
        <span className="text-sm font-medium hidden sm:inline">{currentTheme.label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-64 rounded-2xl
                     border shadow-theme-xl z-50 overflow-hidden fade-in"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-primary)',
          }}
        >
          {/* Theme Options */}
          <div className="p-2">
            {THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => handleThemeSelect(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                           transition-all duration-150 text-sm font-medium text-right
                           ${theme === t.key ? 'ring-2' : 'hover:opacity-80'}`}
                style={{
                  background: theme === t.key ? 'var(--accent-bg)' : 'transparent',
                  color: theme === t.key ? 'var(--text-accent)' : 'var(--text-primary)',
                  ringColor: theme === t.key ? 'var(--accent-primary)' : undefined,
                }}
                aria-label={`ערכת נושא: ${t.label}`}
              >
                {/* Color preview dot */}
                <div
                  className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                  style={{
                    background: t.preview,
                    borderColor: theme === t.key ? 'var(--accent-primary)' : 'var(--border-secondary)',
                  }}
                />
                {t.icon}
                <span className="flex-1">{t.label}</span>
                {theme === t.key && (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'var(--accent-primary)' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px mx-3" style={{ background: 'var(--border-primary)' }} />

          {/* Focus Mode Toggle */}
          <div className="p-2">
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                         transition-all duration-150 text-sm font-medium text-right"
              style={{
                background: focusMode ? 'var(--accent-bg)' : 'transparent',
                color: focusMode ? 'var(--text-accent)' : 'var(--text-primary)',
              }}
              aria-label={`מצב ריכוז: ${focusMode ? 'פעיל' : 'כבוי'}`}
            >
              <Focus size={16} />
              <span className="flex-1">מצב ריכוז</span>
              <div
                className={`w-9 h-5 rounded-full transition-all duration-200 flex items-center
                           ${focusMode ? 'justify-end' : 'justify-start'}`}
                style={{
                  background: focusMode ? 'var(--accent-primary)' : 'var(--bg-muted)',
                  padding: '2px',
                }}
              >
                <div
                  className="w-4 h-4 rounded-full transition-all duration-200"
                  style={{
                    background: focusMode ? 'var(--text-on-accent)' : 'var(--text-muted)',
                  }}
                />
              </div>
            </button>
          </div>

          {/* Custom Theme Panel */}
          {showCustom && theme === 'custom' && (
            <>
              <div className="h-px mx-3" style={{ background: 'var(--border-primary)' }} />
              <div className="p-3 space-y-2">
                <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                  התאמה אישית
                </p>
                {CUSTOM_FIELDS.map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center justify-between gap-2 text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span>{field.label}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={customOverrides[field.key] || '#2d6441'}
                        onChange={(e) => handleCustomChange(field.key, e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
                        aria-label={field.label}
                      />
                      <span
                        className="font-mono text-[10px] w-16 text-center"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {customOverrides[field.key] || '#2d6441'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
