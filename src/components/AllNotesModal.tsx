import { X, NotebookPen, Clipboard, ClipboardCheck, Trash2, Download, Filter } from 'lucide-react';
import { useState } from 'react';
import { useNotesStore, QACategory, NoteEntry } from '../store/notesStore';

const TOPICS: { key: string; label: string }[] = [
  { key: 'normalDistribution', label: 'התפלגות נורמלית' },
  { key: 'regression',         label: 'רגרסיה לינארית' },
  { key: 'probability',        label: 'הסתברות' },
  { key: 'descriptive',        label: 'סטטיסטיקה תיאורית' },
  { key: 'conditionalProb',    label: 'הסתברות מותנית' },
  { key: 'discrete',           label: 'התפלגויות בדידות' },
];

const STEP_LABELS: Record<number, string> = {
  1: 'שלב א׳ — נתונים',
  2: 'שלב ב׳ — נוסחה',
  3: 'שלב ג׳ — פתרון',
  4: 'שלב ד׳ — ויזואל',
  5: 'שלב ה׳ — מבחן',
};

const CAT_META: Record<QACategory, { label: string; emoji: string; badge: string }> = {
  content: { label: 'תוכן/רמה',   emoji: '📘', badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
  ui:      { label: 'עיצוב/כללי', emoji: '🎨', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  bug:     { label: 'באג קריטי',  emoji: '🐛', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

type FilterKey = 'all' | QACategory;

interface AllNotesModalProps {
  onClose: () => void;
}

export function AllNotesModal({ onClose }: AllNotesModalProps) {
  const { savedNotes, deleteNote } = useNotesStore();
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  // Build sections filtered by category
  const sections = TOPICS.map((t) => {
    const all: NoteEntry[] = savedNotes[t.key] ?? [];
    const filtered = activeFilter === 'all' ? all : all.filter((n) => n.category === activeFilter);
    return { ...t, notes: filtered };
  }).filter((s) => s.notes.length > 0);

  const totalCount = sections.reduce((s, t) => s + t.notes.length, 0);
  const allNotes = TOPICS.flatMap((t) => savedNotes[t.key] ?? []);

  // ─── Export QA Report ───────────────────────────────────────────
  const exportQAReport = () => {
    const lines: string[] = [
      '# דוח QA — OnoStats Master',
      `Generated: ${new Date().toISOString()}`,
      `סה״כ הערות: ${allNotes.length}`,
      '',
      '---',
      '',
    ];

    TOPICS.forEach((t) => {
      const notes: NoteEntry[] = savedNotes[t.key] ?? [];
      if (!notes.length) return;
      lines.push(`## מודול: ${t.label}`);
      lines.push(`_${notes.length} הערות_`);
      lines.push('');
      notes.forEach((n) => {
        const cat = CAT_META[n.category ?? 'content'];
        const date = new Date(n.createdAt).toLocaleString('he-IL');
        const stepLabel = STEP_LABELS[n.currentStep] ?? `שלב ${n.currentStep}`;
        lines.push(`### ${cat.emoji} [${cat.label}] ${stepLabel} — ${date}`);
        lines.push(`**סצנריו:** \`${JSON.stringify(n.renderedData ?? {})}\``);
        lines.push(`**משוב:** "${n.text}"`);
        lines.push('');
        lines.push('---');
        lines.push('');
      });
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QA-OnoStats-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Copy All ───────────────────────────────────────────────────
  const handleCopyAll = () => {
    const lines = TOPICS.flatMap((t) => {
      const notes: NoteEntry[] = savedNotes[t.key] ?? [];
      if (!notes.length) return [];
      return [
        `── ${t.label} ──`,
        ...notes.map((n) => {
          const cat = CAT_META[n.category ?? 'content'];
          return `[${cat.label}] ${STEP_LABELS[n.currentStep] ?? ''}:\n${n.text}`;
        }),
        '',
      ];
    });
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const FILTERS: { key: FilterKey; label: string; emoji: string }[] = [
    { key: 'all',     label: 'הכל',        emoji: '📋' },
    { key: 'content', label: 'תוכן/רמה',   emoji: '📘' },
    { key: 'ui',      label: 'עיצוב/כללי', emoji: '🎨' },
    { key: 'bug',     label: 'באגים',      emoji: '🐛' },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-2xl max-h-[88vh] flex flex-col rounded-[2rem] border shadow-glass-dark overflow-hidden bg-white border-slate-200 dark:bg-night-card dark:border-night-border">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 border-slate-100 dark:border-night-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10">
              <NotebookPen size={18} className="text-teal-500" />
            </div>
            <div>
              <h2 className="font-black text-lg leading-tight">מרכז QA</h2>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {totalCount === 0
                  ? 'אין הערות עדיין'
                  : `${allNotes.length} הערות ב-${TOPICS.filter(t => (savedNotes[t.key]?.length ?? 0) > 0).length} מודולים`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allNotes.length > 0 && (
              <>
                <button
                  onClick={exportQAReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-teal-500 text-white hover:bg-teal-600"
                  title="ייצא דוח QA (MD)"
                >
                  <Download size={13} /> ייצא דוח QA
                </button>
                <button
                  onClick={handleCopyAll}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    copied
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-night-muted dark:text-slate-400 dark:hover:bg-night-border'
                  }`}
                >
                  {copied ? <ClipboardCheck size={13} /> : <Clipboard size={13} />}
                  {copied ? 'הועתק!' : 'העתק הכל'}
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-slate-100 text-slate-500 dark:hover:bg-night-muted dark:text-slate-400">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {allNotes.length > 0 && (
          <div className="flex items-center gap-2 px-6 py-3 border-b shrink-0 flex-wrap border-slate-100 dark:border-night-border">
            <Filter size={12} className="text-slate-400 dark:text-slate-500" />
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  activeFilter === f.key
                    ? 'bg-teal-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-night-muted dark:text-slate-400 dark:hover:bg-night-border'
                }`}
              >
                {f.emoji} {f.label}
                <span className="opacity-70">
                  ({f.key === 'all'
                    ? allNotes.length
                    : allNotes.filter(n => n.category === f.key).length})
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-night-muted">
                <NotebookPen size={28} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                {activeFilter === 'all' ? 'עדיין לא נכתבו הערות QA' : `אין הערות מסוג "${CAT_META[activeFilter as QACategory]?.label}"`}
              </p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.key}>
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-night-border">
                  <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                  <h3 className="font-black text-sm text-teal-600 dark:text-teal-400">{section.label}</h3>
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">({section.notes.length})</span>
                </div>

                <div className="space-y-3 pr-4">
                  {[...section.notes].reverse().map((note) => {
                    const cat = CAT_META[note.category ?? 'content'];
                    const hasScenario = note.renderedData && Object.keys(note.renderedData).length > 0;
                    const isExpanded = expandedScenario === note.id;
                    return (
                      <div key={note.id} className="p-4 rounded-2xl border group relative bg-slate-50 border-slate-200 dark:bg-night-card2 dark:border-night-border">
                        {/* Meta Row */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${cat.badge}`}>
                            {cat.emoji} {cat.label}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            {STEP_LABELS[note.currentStep] ?? `שלב ${note.currentStep}`}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {new Date(note.createdAt).toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Feedback Text */}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                          {note.text}
                        </p>

                        {/* Scenario Toggle */}
                        {hasScenario && (
                          <button
                            onClick={() => setExpandedScenario(isExpanded ? null : note.id)}
                            className="mt-2 text-[10px] font-medium underline underline-offset-2 text-slate-400 dark:text-slate-500"
                          >
                            {isExpanded ? 'הסתר נתוני סצנריו' : 'הצג נתוני סצנריו'}
                          </button>
                        )}
                        {isExpanded && (
                          <pre className="mt-2 text-[10px] leading-relaxed p-2 rounded-lg overflow-x-auto bg-slate-100 text-slate-500 dark:bg-night-bg dark:text-slate-400">
                            {JSON.stringify(note.renderedData, null, 2)}
                          </pre>
                        )}

                        {/* Delete */}
                        <button
                          onClick={() => deleteNote(section.key, note.id)}
                          title="מחק הערה"
                          className="absolute top-3 left-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 text-slate-400 hover:text-red-500 dark:hover:bg-red-900/30 dark:text-slate-500 dark:hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
