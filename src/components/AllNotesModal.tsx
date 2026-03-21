import { X, NotebookPen, Clipboard, ClipboardCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNotesStore, noteKey } from '../store/notesStore';

const TOPICS: { key: string; label: string }[] = [
  { key: 'normalDistribution',  label: 'התפלגות נורמלית' },
  { key: 'regression',          label: 'רגרסיה לינארית' },
  { key: 'probability',         label: 'הסתברות' },
  { key: 'descriptive',         label: 'סטטיסטיקה תיאורית' },
  { key: 'conditionalProb',     label: 'הסתברות מותנית' },
  { key: 'discrete',            label: 'התפלגויות בדידות' },
];

const LEVEL_LABELS: Record<number, string> = {
  1: 'שלב א׳ — נתונים',
  2: 'שלב ב׳ — נוסחה',
  3: 'שלב ג׳ — פתרון',
  4: 'שלב ד׳ — ויזואליזציה',
  5: 'שלב ה׳ — מבחן',
};

interface AllNotesModalProps {
  darkMode: boolean;
  onClose: () => void;
}

export function AllNotesModal({ darkMode, onClose }: AllNotesModalProps) {
  const { notes, clearNote } = useNotesStore();
  const [copied, setCopied] = useState(false);

  // Gather all non-empty notes ordered by topic → level
  const sections = TOPICS.map((t) => ({
    ...t,
    levels: [1, 2, 3, 4, 5]
      .map((lvl) => ({ lvl, text: notes[noteKey(t.key, lvl)] ?? '' }))
      .filter((n) => n.text.trim()),
  })).filter((s) => s.levels.length > 0);

  const totalCount = sections.reduce((s, t) => s + t.levels.length, 0);

  const handleCopyAll = () => {
    const lines = sections.flatMap((t) => [
      `── ${t.label} ──`,
      ...t.levels.map((n) => `${LEVEL_LABELS[n.lvl]}:\n${n.text}`),
      '',
    ]);
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div className={`relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[2rem] border shadow-glass-dark overflow-hidden
        ${darkMode
          ? 'bg-night-card border-night-border'
          : 'bg-white border-slate-200'
        }`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${darkMode ? 'border-night-border' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-ono-500/10">
              <NotebookPen size={18} className="text-ono-500" />
            </div>
            <div>
              <h2 className="font-black text-lg leading-tight">כל ההערות שלי</h2>
              <p className={`text-[11px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {totalCount === 0 ? 'אין הערות עדיין' : `${totalCount} הערות ב-${sections.length} נושאים`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <button
                onClick={handleCopyAll}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  copied
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : darkMode
                      ? 'bg-night-muted text-slate-400 hover:bg-night-border'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {copied ? <ClipboardCheck size={13} /> : <Clipboard size={13} />}
                {copied ? 'הועתק!' : 'העתק הכל'}
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-night-muted text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-night-muted' : 'bg-slate-100'}`}>
                <NotebookPen size={28} className={darkMode ? 'text-slate-600' : 'text-slate-300'} />
              </div>
              <p className={`text-sm font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                עדיין לא נכתבו הערות באף מודל
              </p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.key}>
                {/* Topic header */}
                <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${darkMode ? 'border-night-border' : 'border-slate-100'}`}>
                  <span className="w-2 h-2 rounded-full bg-ono-500 shrink-0" />
                  <h3 className="font-black text-sm text-ono-600 dark:text-ono-400">{section.label}</h3>
                </div>

                <div className="space-y-3 pr-4">
                  {section.levels.map(({ lvl, text }) => (
                    <div
                      key={lvl}
                      className={`p-4 rounded-2xl border group relative ${darkMode ? 'bg-night-card2 border-night-border' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className={`text-[10px] font-black uppercase tracking-widest mb-1.5 block ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            {LEVEL_LABELS[lvl]}
                          </span>
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {text}
                          </p>
                        </div>
                        <button
                          onClick={() => clearNote(section.key, lvl)}
                          title="מחק הערה"
                          className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0 ${darkMode ? 'hover:bg-red-900/30 text-slate-500 hover:text-red-400' : 'hover:bg-red-50 text-slate-400 hover:text-red-500'}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
