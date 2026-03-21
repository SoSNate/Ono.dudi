import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

interface Formula {
  label: string;
  formula: string;
}

interface ExplainerPanelProps {
  title: string;
  summary: string;
  formulas: Formula[];
  tips: string[];
}

export function ExplainerPanel({ title, summary, formulas, tips }: ExplainerPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          <BookOpen size={13} />
          מדריך — {title}
        </div>
        {isOpen ? (
          <ChevronUp size={15} className="text-slate-400" />
        ) : (
          <ChevronDown size={15} className="text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 pt-3">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{summary}</p>

          {formulas.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">נוסחאות מפתח</p>
              <div className="flex flex-col gap-1.5">
                {formulas.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2"
                  >
                    <span className="text-[10px] text-slate-400 font-bold w-20 shrink-0">{f.label}</span>
                    <code className="text-xs font-mono text-blue-600 dark:text-blue-400" dir="ltr">
                      {f.formula}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tips.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Lightbulb size={11} /> טיפים
              </p>
              <ul className="flex flex-col gap-1">
                {tips.map((tip, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex gap-2">
                    <span className="text-blue-400 shrink-0">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
