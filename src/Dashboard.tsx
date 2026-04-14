import { useState } from 'react';
import { GraduationCap, Activity, LineChart, Layers, BarChart2, ArrowRight, BookOpen, ShieldCheck, CheckCircle2, TrendingUp, Calculator, GitBranch, Download, MessageSquareWarning, X } from 'lucide-react';
import { useProgressStore, type TopicKey } from './store/progressStore';
import { useNotesStore, type NoteEntry } from './store/notesStore';
import { NotesPanel } from './components/NotesPanel';
import { AllNotesModal } from './components/AllNotesModal';
import { ThemeSelector } from './components/ThemeSelector';

interface DashboardProps {
  onNavigate: (lab: TopicKey) => void;
  onOpenGlossary: () => void;
}

const TOPICS: {
  key: TopicKey;
  title: string;
  subtitle: string;
  desc: string;
  icon: React.ReactNode;
  steps: string[];
}[] = [
  {
    key: 'normalDistribution',
    title: 'התפלגות נורמלית',
    subtitle: 'Normal Distribution',
    desc: 'עקומת הפעמון, ציוני Z וחישוב הסתברויות.',
    icon: <TrendingUp size={22} />,
    steps: ['מציאת X', 'חילוץ μ', 'מציאת σ', 'בונה גרפים', 'מבחן'],
  },
  {
    key: 'regression',
    title: 'רגרסיה לינארית',
    subtitle: 'Linear Regression',
    desc: 'ניבוי קשרים ליניאריים ובניית מודלים עסקיים.',
    icon: <Calculator size={22} />,
    steps: ['ממוצעים X̄ Ȳ', 'שיפוע b', 'חיתוך a', 'סימולטור', 'מבחן'],
  },
  {
    key: 'probability',
    title: 'הסתברות',
    subtitle: 'Probability',
    desc: 'דיאגרמות ון, איחוד, חיתוך ומאורעות מורכבים.',
    icon: <Layers size={22} />,
    steps: ['הסתברויות בסיס', 'חיתוך A∩B', 'איחוד A∪B', 'משלים', 'מבחן'],
  },
  {
    key: 'descriptive',
    title: 'סטטיסטיקה תיאורית',
    subtitle: 'Descriptive Statistics',
    desc: 'מדדי מרכז, פיזור, צפיפות ותרשימי Box Plot.',
    icon: <BarChart2 size={22} />,
    steps: ['ממוצע X̄', 'חציון', 'שונות וסט"ת', 'Box Plot', 'מבחן'],
  },
  {
    key: 'conditionalProb',
    title: 'הסתברות מותנית',
    subtitle: 'Conditional Probability',
    desc: 'עצי הסתברות, נוסחת בייס והסתברות כוללת.',
    icon: <GitBranch size={22} />,
    steps: ['הסתברות מוקדמת', 'נוסחת P(A|B)', 'בייס', 'עץ הסתברות', 'מבחן'],
  },
  {
    key: 'discrete',
    title: 'התפלגויות בדידות',
    subtitle: 'Discrete Distributions',
    desc: 'בינומי ופואסון — תוחלת, שונות ו-PMF.',
    icon: <LineChart size={22} />,
    steps: ['סוג התפלגות', 'E(X) ו-V(X)', 'חישוב PMF', 'סימולטור', 'מבחן'],
  },
];

// All topics for QA export — includes dashboard
const ALL_QA_TOPICS = [
  { key: 'globalDashboard',    label: 'דשבורד כללי' },
  { key: 'normalDistribution', label: 'התפלגות נורמלית' },
  { key: 'regression',         label: 'רגרסיה לינארית' },
  { key: 'probability',        label: 'הסתברות' },
  { key: 'descriptive',        label: 'סטטיסטיקה תיאורית' },
  { key: 'conditionalProb',    label: 'הסתברות מותנית' },
  { key: 'discrete',           label: 'התפלגויות בדידות' },
];

const STEP_LABELS: Record<number, string> = {
  0: 'כללי',
  1: 'שלב א׳ — נתונים',
  2: 'שלב ב׳ — נוסחה',
  3: 'שלב ג׳ — פתרון',
  4: 'שלב ד׳ — ויזואל',
  5: 'שלב ה׳ — מבחן',
};

const CAT_LABEL: Record<string, string> = {
  content: 'תוכן/רמה',
  ui:      'עיצוב/כללי',
  bug:     'באג קריטי',
};

const CAT_EMOJI: Record<string, string> = {
  content: '📘',
  ui:      '🎨',
  bug:     '🐛',
};

export function Dashboard({ onNavigate, onOpenGlossary }: DashboardProps) {
  const { overallReadiness, topics } = useProgressStore();
  const { savedNotes } = useNotesStore();
  const totalCompleted = Object.values(topics).reduce((s, t) => s + t.stagesCompleted.length, 0);
  const totalStages = 30; // 6 topics × 5 stages
  const [showQANote, setShowQANote] = useState(false);
  const [showQACenter, setShowQACenter] = useState(false);

  const currentTopic = TOPICS.find(t => topics[t.key].stagesCompleted.length < 5) ?? TOPICS[0];

  const totalQANotes = Object.values(savedNotes).reduce((s, arr) => s + arr.length, 0);

  const exportGlobalQA = () => {
    const lines: string[] = [
      '# דוח QA גלובלי — OnoStats Master',
      `Generated: ${new Date().toISOString()}`,
      `סה״כ הערות: ${totalQANotes}`,
      '',
      '---',
      '',
    ];

    ALL_QA_TOPICS.forEach((t) => {
      const notes: NoteEntry[] = savedNotes[t.key] ?? [];
      if (!notes.length) return;
      lines.push(`## מודול: ${t.label}`);
      lines.push(`_${notes.length} הערות_`);
      lines.push('');
      notes.forEach((n) => {
        const emoji = CAT_EMOJI[n.category] ?? '📝';
        const catLabel = CAT_LABEL[n.category] ?? n.category;
        const stepLabel = STEP_LABELS[n.currentStep] ?? `שלב ${n.currentStep}`;
        const date = new Date(n.createdAt).toLocaleString('he-IL');
        lines.push(`### ${emoji} [${catLabel}] ${stepLabel} — ${date}`);
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
    a.download = `QA-Global-OnoStats-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="min-h-screen font-sans transition-colors duration-700 bg-ono-50 text-slate-900 dark:bg-night-bg dark:text-slate-50"
      dir="rtl"
    >
      {/* ── Glass Nav ── */}
      <nav className="focus-hide fixed top-0 w-full z-50 border-b backdrop-blur-xl transition-all duration-500 bg-white/40 border-ono-200/50 dark:bg-night-nav/80 dark:border-night-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-ono bg-ono-600 dark:bg-ono-700">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight block">
                OnoStats <span className="opacity-40 font-light">Master</span>
              </span>
              <span className="text-[10px] uppercase font-black text-ono-600 dark:text-ono-400 tracking-[0.2em] leading-none">
                סטטיסטיקה לניהול עסקים א׳
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportGlobalQA}
              title={`הורד דוח QA גלובלי${totalQANotes > 0 ? ` (${totalQANotes} הערות)` : ''}`}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all ${
                totalQANotes > 0
                  ? 'border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50'
                  : 'border-slate-200 bg-white/40 text-slate-400 hover:bg-slate-50 dark:border-night-border dark:bg-night-card/50 dark:text-slate-500 dark:hover:bg-night-card'
              }`}
            >
              <Download size={14} />
              הורד דוח QA
              {totalQANotes > 0 && (
                <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black bg-teal-500 text-white dark:bg-teal-700 dark:text-teal-200">
                  {totalQANotes > 9 ? '9+' : totalQANotes}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowQACenter(true)}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all ${
                totalQANotes > 0
                  ? 'border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-800/50'
                  : 'border-slate-200 bg-white/40 text-slate-500 hover:bg-slate-50 dark:border-night-border dark:bg-night-card/50 dark:text-slate-400 dark:hover:bg-night-card'
              }`}
            >
              <MessageSquareWarning size={14} />
              מרכז QA
              {totalQANotes > 0 && (
                <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black bg-teal-500 text-white dark:bg-teal-700 dark:text-teal-200">
                  {totalQANotes > 9 ? '9+' : totalQANotes}
                </span>
              )}
            </button>
            <button
              onClick={onOpenGlossary}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all border-slate-200 bg-white/40 text-ono-700 hover:bg-slate-50 dark:border-night-border dark:bg-night-card/50 dark:text-ono-300 dark:hover:bg-night-card"
            >
              <BookOpen size={15} /> מאגר ידע
            </button>
            <ThemeSelector />
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="pt-40 pb-16 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: text */}
        <div className="space-y-8 fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-black uppercase tracking-widest bg-slate-100 border-slate-200 text-slate-600 dark:bg-ono-600/10 dark:border-ono-700/30 dark:text-ono-400">
            <ShieldCheck size={13} /> פלטפורמת הלמידה הרשמית — אונו 2024
          </div>

          <h1 className="text-6xl md:text-7xl font-black leading-[0.9] tracking-tighter">
            למידה<br />
            <span className="text-ono-600 dark:text-ono-400">אנליטית.</span>
          </h1>

          <p className="text-lg max-w-md leading-relaxed font-medium text-slate-600 dark:text-slate-400">
            מערכת למידה אדפטיבית המזקקת את חומר הסטטיסטיקה של אונו לכדי חווית תרגול מדויקת, קלינית ונטולת רעשים.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => onNavigate(currentTopic.key)}
              className="px-8 py-4 rounded-2xl font-black text-lg text-white transition-all shadow-ono-lg flex items-center justify-center gap-3 group bg-ono-600 hover:bg-ono-700 dark:hover:bg-ono-500"
            >
              כניסה למערכת
              <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onOpenGlossary}
              className="px-8 py-4 rounded-2xl font-black text-lg border-2 transition-all flex items-center justify-center gap-2 border-ono-200 bg-white/50 text-slate-700 hover:bg-slate-200 dark:border-night-border dark:bg-night-card/30 dark:text-slate-300 dark:hover:bg-night-card"
            >
              <BookOpen size={18} /> מאגר ידע
            </button>
          </div>
        </div>

        {/* Right: big readiness card */}
        <div className="relative flex justify-center items-center fade-in delay-200">
          <div className="absolute w-80 h-80 rounded-full blur-[80px] opacity-10 bg-ono-300 dark:bg-ono-500" />

          <div className="w-72 h-72 md:w-[360px] md:h-[360px] rounded-[3rem] border backdrop-blur-2xl flex flex-col items-center justify-center relative z-10 shadow-glass transition-all duration-500 bg-white/40 border-ono-200/60 dark:bg-night-card/50 dark:border-night-border">
            <div className="absolute top-10 flex flex-col items-center gap-2">
              <div className="p-2.5 bg-ono-500/10 rounded-2xl">
                <Activity size={22} className="text-ono-500" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40">Readiness Score</span>
            </div>

            <div className="flex items-end leading-none">
              <span className="text-[8rem] md:text-[10rem] font-black tracking-tighter text-slate-900 dark:text-slate-50">
                {overallReadiness}
              </span>
              <span className="text-4xl font-black opacity-30 mb-4">%</span>
            </div>

            <div className="absolute bottom-10 flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black opacity-40 uppercase">הושלמו</span>
                <span className="text-lg font-bold">{totalCompleted}/{totalStages}</span>
              </div>
              <div className="w-px h-7 bg-slate-400/20" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black opacity-40 uppercase">מודולים</span>
                <span className="text-lg font-bold">{Object.values(topics).filter(t => t.topicReadiness === 100).length}/6</span>
              </div>
            </div>
          </div>

          {/* floating card */}
          <div className="absolute -bottom-4 -left-4 md:-right-6 md:left-auto p-5 rounded-[1.5rem] shadow-glass backdrop-blur-xl border z-20 animate-float bg-white/90 border-ono-200/60 dark:bg-night-nav/90 dark:border-night-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ono-500/10 flex items-center justify-center text-ono-500">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">משימה נוכחית</p>
                <p className="font-bold text-sm leading-tight">{currentTopic.title}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Topic Cards ── */}
      <section className="py-24 px-6 transition-colors bg-slate-100/40 dark:bg-night-card/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center mb-14 gap-3">
            <h2 className="text-3xl md:text-5xl font-black text-center">שישה עמודי התווך</h2>
            <div className="w-16 h-1.5 bg-ono-500 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOPICS.map((t) => {
              const prog = topics[t.key];
              const completed = prog.stagesCompleted.length;
              return (
                <div
                  key={t.key}
                  className="group p-7 rounded-[2rem] border backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 cursor-pointer bg-white/40 border-ono-200/60 hover:border-ono-400/60 shadow-ono dark:bg-night-card2/40 dark:border-night-border dark:hover:border-ono-700/40 dark:shadow-glass"
                  onClick={() => onNavigate(t.key)}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 bg-slate-100 text-ono-600 group-hover:bg-ono-600 group-hover:text-white dark:bg-night-muted dark:text-ono-400 dark:group-hover:bg-ono-700/30 dark:group-hover:text-ono-400">
                    {t.icon}
                  </div>

                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">{t.subtitle}</p>
                  <h3 className="text-xl font-black mb-2 leading-tight">{t.title}</h3>
                  <p className="text-sm leading-relaxed mb-5 text-slate-500 dark:text-slate-400">{t.desc}</p>

                  {/* Progress */}
                  <div className="flex items-center justify-between text-xs font-bold opacity-60 mb-2">
                    <span>התקדמות</span>
                    <span>{completed}/5</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-night-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-ono-500 to-ono-400 transition-all duration-700"
                      style={{ width: `${prog.topicReadiness}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs font-bold text-ono-600 dark:text-ono-400">{prog.topicReadiness}% מוכנות</span>
                    <ArrowRight size={16} className="transition-transform group-hover:-translate-x-1 text-ono-600 dark:text-ono-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer tip ── */}
      <div className="py-8 px-6 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
        השלם שלבי הכנה (1–4) לפני סימולציית הבחינה — שלב 5 שווה <strong>60%</strong> מהמוכנות
      </div>

      {/* ── Floating QA Button ── */}
      <button
        onClick={() => setShowQANote(true)}
        title="הוסף הערת QA כללית"
        className="focus-hide fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm shadow-glass-dark transition-all hover:-translate-y-1 min-h-[44px] bg-teal-500 text-white hover:bg-teal-600 shadow-lg dark:bg-teal-800/80 dark:border dark:border-teal-700 dark:text-teal-200 dark:hover:bg-teal-700/80 dark:backdrop-blur-xl"
      >
        <MessageSquareWarning size={16} />
        <span className="hidden sm:inline">הערת QA</span>
        {(savedNotes['globalDashboard']?.length ?? 0) > 0 && (
          <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black bg-white/30 text-white">
            {savedNotes['globalDashboard']!.length}
          </span>
        )}
      </button>

      {/* ── QA Center (All Notes) ── */}
      {showQACenter && (
        <AllNotesModal onClose={() => setShowQACenter(false)} />
      )}

      {/* ── QA Note Modal ── */}
      {showQANote && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
          dir="rtl"
          onClick={(e) => { if (e.target === e.currentTarget) setShowQANote(false); }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md rounded-[2rem] border shadow-glass-dark overflow-hidden bg-white border-slate-200 dark:bg-night-card dark:border-night-border">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-night-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-teal-500/10">
                  <MessageSquareWarning size={16} className="text-teal-500" />
                </div>
                <div>
                  <h3 className="font-black text-sm">הערת QA כללית</h3>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">על הדשבורד, ניווט, חוויה כללית</p>
                </div>
              </div>
              <button
                onClick={() => setShowQANote(false)}
                className="p-2 rounded-xl transition-colors hover:bg-slate-100 text-slate-500 dark:hover:bg-night-muted dark:text-slate-400"
              >
                <X size={16} />
              </button>
            </div>
            {/* NotesPanel inside modal */}
            <div className="p-4">
              <NotesPanel
                topic="globalDashboard"
                level={0}
                moduleName="דשבורד כללי"
                renderedData={{ screen: 'dashboard', overallReadiness, totalCompleted }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
