import { useState, useEffect } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { whyBridges } from '../data/whyBridges';
import type { TopicKey } from '../store/progressStore';

interface WhyBridgeProps {
  topic: TopicKey;
}

interface Section {
  key: string;
  label: string;
  content: string;
}

function SectionBlock({ label, content, open, onToggle }: {
  label: string;
  content: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-amber-200 dark:border-amber-800/40 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-right text-sm font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
      >
        <span>{label}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="px-4 py-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-white dark:bg-night-card/40">
          {content}
        </div>
      )}
    </div>
  );
}

export function WhyBridge({ topic }: WhyBridgeProps) {
  const bridge = whyBridges[topic];
  const storageKey = `why-bridge-${topic}`;

  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    prerequisite: true,
    intuition: false,
    analogy: false,
    bridge: false,
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(open));
    } catch {}
  }, [open, storageKey]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!bridge) return null;

  const sections: Section[] = [
    { key: 'prerequisite', label: '❓ השאלה', content: bridge.prerequisite },
    { key: 'intuition',    label: '💡 האינטואיציה', content: bridge.intuition },
    { key: 'analogy',      label: '🔗 אנלוגיה מהחיים', content: bridge.analogy },
    { key: 'bridge',       label: '📐 גשר לנוסחה', content: bridge.bridgeToFormula },
  ];

  return (
    <div
      dir="rtl"
      className="rounded-2xl border-r-4 border-amber-400 dark:border-amber-500 border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-900/10 overflow-hidden mb-4"
      style={{ borderRightWidth: '4px' }}
    >
      {/* Header — top-level toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-right"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <Lightbulb size={15} className="text-amber-600 dark:text-amber-400" />
          </div>
          <span className="font-black text-sm text-amber-800 dark:text-amber-300">?למה זה עובד</span>
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-500 opacity-70">
            {open ? 'לחץ לסגירה' : 'לחץ לפתיחה'}
          </span>
        </div>
        {open ? (
          <ChevronUp size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
        )}
      </button>

      {/* Collapsible sections */}
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {sections.map((s) => (
            <SectionBlock
              key={s.key}
              label={s.label}
              content={s.content}
              open={!!openSections[s.key]}
              onToggle={() => toggleSection(s.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
