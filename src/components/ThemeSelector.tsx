import { useRef, useState, useEffect } from 'react';
import { Sun, Moon, Focus } from 'lucide-react';
import { useTheme, type ThemeName } from '../context/ThemeContext';

const THEMES: { key: ThemeName; label: string; icon: React.ReactNode }[] = [
  { key: 'light',         label: 'בהיר',     icon: <Sun size={15} /> },
  { key: 'dark',          label: 'כהה',      icon: <Moon size={15} /> },
  { key: 'high-contrast', label: 'ניגודיות', icon: <span className="font-black text-xs">HC</span> },
];

export function ThemeSelector() {
  const { theme, setTheme, focusMode, setFocusMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = THEMES.find(t => t.key === theme) ?? THEMES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all
          bg-white/50 border-slate-200 text-slate-700 hover:bg-slate-100
          dark:bg-night-card/50 dark:border-night-border dark:text-slate-300 dark:hover:bg-night-card"
        aria-label="ערכת נושא"
      >
        {current.icon}
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-[200] w-48 rounded-2xl border shadow-xl p-2 flex flex-col gap-1
            bg-white border-slate-200 dark:bg-night-card dark:border-night-border"
          dir="rtl"
        >
          {THEMES.map(t => (
            <button
              key={t.key}
              onClick={() => { setTheme(t.key); setOpen(false); }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-right transition-all w-full ${
                theme === t.key
                  ? 'bg-ono-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-night-card2'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}

          <div className="border-t border-slate-100 dark:border-night-border my-1" />

          <button
            onClick={() => { setFocusMode(!focusMode); setOpen(false); }}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-right transition-all w-full ${
              focusMode
                ? 'bg-amber-500 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-night-card2'
            }`}
          >
            <Focus size={15} />
            מצב ריכוז {focusMode ? '(פעיל)' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
