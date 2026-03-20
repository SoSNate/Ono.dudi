import { Moon, Sun, GraduationCap, Activity, LineChart, Layers, BarChart2, ChevronLeft } from 'lucide-react';
import { ReadinessGauge } from './components/ReadinessGauge';
import { useProgressStore, type TopicKey } from './store/progressStore';

interface DashboardProps {
  onNavigate: (lab: TopicKey) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const TOPICS: {
  key: TopicKey;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  steps: string[];
}[] = [
  {
    key: 'normalDistribution',
    title: 'התפלגות נורמלית',
    subtitle: 'ציון Z, טבלת Z, עקומת פעמון',
    icon: <Activity size={28} />,
    color: 'blue',
    steps: ['מציאת X', 'חילוץ μ', 'מציאת σ', 'בונה גרפים', 'מבחן'],
  },
  {
    key: 'regression',
    title: 'רגרסיה ליניארית',
    subtitle: 'שיפוע b, חיתוך a, חיזוי Ŷ',
    icon: <LineChart size={28} />,
    color: 'violet',
    steps: ['ממוצעים X̄ Ȳ', 'שיפוע b', 'חיתוך a', 'סימולטור חיזוי', 'מבחן'],
  },
  {
    key: 'probability',
    title: 'הסתברות ודיאגרמות ון',
    subtitle: 'איחוד, חיתוך, מאורע משלים',
    icon: <Layers size={28} />,
    color: 'emerald',
    steps: ['הסתברויות בסיס', 'חיתוך A∩B', 'איחוד A∪B', 'מאורע משלים', 'מבחן'],
  },
  {
    key: 'descriptive',
    title: 'סטטיסטיקה תיאורית',
    subtitle: 'ממוצע, חציון, שונות, Box Plot',
    icon: <BarChart2 size={28} />,
    color: 'orange',
    steps: ['ממוצע X̄', 'חציון', 'שונות וסט"ת', 'Box Plot', 'מבחן'],
  },
];

const COLOR_MAP: Record<string, string> = {
  blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  violet: 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300',
  emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
  orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
};

const BTN_MAP: Record<string, string> = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  violet: 'bg-violet-600 hover:bg-violet-700',
  emerald: 'bg-emerald-600 hover:bg-emerald-700',
  orange: 'bg-orange-600 hover:bg-orange-700',
};

const BAR_MAP: Record<string, string> = {
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  orange: 'bg-orange-500',
};

export function Dashboard({ onNavigate, darkMode, onToggleDark }: DashboardProps) {
  const { overallReadiness, topics } = useProgressStore();

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${darkMode ? 'dark bg-[#0F172A] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'}`}
      dir="rtl"
    >
      {/* Header */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg">
              <GraduationCap size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Ono Stats Master</h1>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">
                סטטיסטיקה לניהול עסקים א' | המכללה האקדמית אונו
              </p>
            </div>
          </div>
          <button
            onClick={onToggleDark}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-10">
        {/* Readiness Gauge */}
        <section className="flex flex-col items-center gap-4 py-6">
          <ReadinessGauge score={overallReadiness} size={220} />
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
            השלם שלבי הכנה (1-4) וסימולציית בחינה (שלב 5) כדי להעלות את הציון
          </p>
        </section>

        {/* Topic Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TOPICS.map((t) => {
            const prog = topics[t.key];
            const completed = prog.stagesCompleted.length;
            return (
              <div
                key={t.key}
                className={`bg-white dark:bg-slate-900 rounded-[2rem] border-2 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex flex-col overflow-hidden ${COLOR_MAP[t.color]}`}
              >
                {/* Card Header */}
                <div className="p-6 flex items-start gap-4 border-b border-inherit">
                  <div className={`p-3 rounded-2xl ${BTN_MAP[t.color]} text-white shrink-0`}>{t.icon}</div>
                  <div>
                    <h2 className="font-black text-lg leading-tight">{t.title}</h2>
                    <p className="text-xs opacity-70 mt-1">{t.subtitle}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="px-6 pt-4 pb-2 flex flex-col gap-3">
                  <div className="flex justify-between text-xs font-bold opacity-60">
                    <span>שלבים שהושלמו</span>
                    <span>{completed}/{t.steps.length}</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${BAR_MAP[t.color]}`}
                      style={{ width: `${prog.topicReadiness}%` }}
                    />
                  </div>
                  <div className="text-xs opacity-60 font-medium">{prog.topicReadiness}% מוכנות</div>

                  {/* Steps list */}
                  <ul className="flex flex-col gap-1.5 mt-1">
                    {t.steps.map((s, i) => {
                      const done = prog.stagesCompleted.includes(i + 1);
                      return (
                        <li key={i} className={`flex items-center gap-2 text-xs ${done ? 'opacity-100' : 'opacity-40'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${done ? `${BTN_MAP[t.color]} text-white` : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                            {done ? '✓' : i + 1}
                          </span>
                          {s}
                          {i + 1 === 5 && <span className="text-[9px] font-black opacity-80">60%</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6 pt-2 mt-auto">
                  <button
                    onClick={() => onNavigate(t.key)}
                    className={`w-full ${BTN_MAP[t.color]} text-white py-3 rounded-xl font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2`}
                  >
                    כנס למעבדה
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Tip */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl px-6 py-4 text-sm text-indigo-700 dark:text-indigo-300 text-center">
          💡 <strong>טיפ:</strong> השלם את כל שלבי ההכנה (שלבים 1-4) לפני סימולציית הבחינה — שלב 5 שווה 60% מהמוכנות!
        </div>
      </main>
    </div>
  );
}
