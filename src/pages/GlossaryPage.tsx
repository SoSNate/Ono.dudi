import React, { useState } from 'react';
import {
  BookOpen, Lightbulb, PieChart, TrendingUp,
  Layers, AlertCircle, ArrowRight, Moon, Sun, GitBranch, BarChart2
} from 'lucide-react';

interface LabProps {
  darkMode: boolean;
  onToggleDark: () => void;
  onBack: () => void;
}

const MathFraction = ({ numerator, denominator }: { numerator: React.ReactNode; denominator: string }) => (
  <span className="inline-flex flex-col items-center justify-center leading-none mx-1 align-middle" dir="ltr">
    <span className="px-1 border-b border-slate-400 dark:border-slate-500 text-sm font-bold">{numerator}</span>
    <span className="px-1 text-sm font-bold">{denominator}</span>
  </span>
);

interface GlossaryItem {
  term: string;
  def: React.ReactNode;
}

interface GlossarySection {
  title: string;
  icon: React.ReactNode;
  color: string;
}

const SECTIONS: Record<string, GlossarySection> = {
  techniques:   { title: 'טכניקות מבחן',        icon: <Lightbulb size={18} />,  color: 'amber'   },
  descriptive:  { title: 'סטטיסטיקה תיאורית',   icon: <PieChart size={18} />,   color: 'orange'  },
  normalDist:   { title: 'התפלגות נורמלית',      icon: <TrendingUp size={18} />, color: 'ono'     },
  probability:  { title: 'הסתברות',              icon: <Layers size={18} />,     color: 'emerald' },
  conditional:  { title: 'הסתברות מותנית',       icon: <GitBranch size={18} />,  color: 'sky'     },
  discrete:     { title: 'התפלגויות בדידות',     icon: <BarChart2 size={18} />,  color: 'violet'  },
};

const ITEMS: Record<string, GlossaryItem[]> = {
  techniques: [
    { term: 'כלל הסימטריה (Z שלילי)', def: 'כאשר שטח (הסתברות) קטן מ-0.5, הציון נמצא משמאל לממוצע. חשבו את השטח המשלים (1 − P), חפשו בטבלה, הוסיפו מינוס (−) לציון התקן.' },
    { term: 'סדר פעולות ברגרסיה', def: 'חשבו קודם ממוצעים X̄, Ȳ → שיפוע b → חותך a. אל תעגלו תוצאות ביניים.' },
    { term: 'זיהוי מאורעות בשאלה', def: '"וגם" = חיתוך (∩). "או" = איחוד (∪). "בלבד / אך לא" = עם מאורע משלים.' },
    { term: 'צפיפות (Density)', def: 'כאשר הרווחים אינם שווים — השתמשו בצפיפות d = f/L ולא בתדירות. המוד = רווח בעל הצפיפות הגבוהה ביותר.' },
  ],
  descriptive: [
    { term: 'ממוצע (X̄)', def: 'סכום התצפיות חלקי מספרן. מושפע מחריגים.' },
    { term: 'חציון (Median)', def: 'הערך האמצעי לאחר מיון. עמיד בפני חריגים.' },
    { term: 'שונות (S²)', def: 'ממוצע ריבועי הסטיות מהממוצע. S² = Σ(xi−x̄)² / (n−1).' },
    { term: 'סטיית תקן (S)', def: 'שורש השונות. יחידות זהות לנתונים המקוריים.' },
    { term: 'IQR', def: 'Q3 − Q1. טווח 50% הנתונים המרכזיים. גבולות חריגים: Q1 − 1.5·IQR ו-Q3 + 1.5·IQR.' },
    { term: 'סימטריה / עיוות', def: 'Mean > Median → עיוות חיובי (ימני). Mean < Median → עיוות שלילי (שמאלי).' },
  ],
  normalDist: [
    { term: 'ציון תקן (Z)', def: <span dir="ltr">Z = <MathFraction numerator="X − μ" denominator="σ" /> | Z+ = מעל ממוצע, Z− = מתחת</span> },
    { term: 'אחוזון', def: 'אחוז התצפיות מתחת לערך נתון. P(Z < z) = ערך מהטבלה.' },
    { term: 'כלל הסימטריה', def: <span dir="ltr">P(Z &lt; −z) = 1 − P(Z &lt; z)</span> },
    { term: 'חישוב X', def: <span dir="ltr">X = μ + Z·σ</span> },
  ],
  probability: [
    { term: 'חיתוך (∩)', def: <span dir="ltr">P(A∩B) — שני המאורעות מתרחשים יחד</span> },
    { term: 'איחוד (∪)', def: <span dir="ltr">P(A∪B) = P(A) + P(B) − P(A∩B)</span> },
    { term: 'משלים (Aᶜ)', def: <span dir="ltr">P(Aᶜ) = 1 − P(A)</span> },
    { term: 'דה-מורגן', def: <span dir="ltr">(A∪B)ᶜ = Aᶜ∩Bᶜ &nbsp;|&nbsp; (A∩B)ᶜ = Aᶜ∪Bᶜ</span> },
  ],
  conditional: [
    { term: 'הסתברות מותנית', def: <span dir="ltr">P(A|B) = <MathFraction numerator="P(A∩B)" denominator="P(B)" /></span> },
    { term: 'נוסחת בייס', def: <span dir="ltr">P(A|B) = <MathFraction numerator="P(B|A)·P(A)" denominator="P(B)" /></span> },
    { term: 'הסתברות כוללת', def: <span dir="ltr">P(B) = P(B|A)·P(A) + P(B|Aᶜ)·P(Aᶜ)</span> },
    { term: 'עצמאות', def: <span dir="ltr">A,B עצמאיים אם P(A∩B) = P(A)·P(B)</span> },
  ],
  discrete: [
    { term: 'בינומי — תוחלת', def: <span dir="ltr">E(X) = n·p</span> },
    { term: 'בינומי — שונות', def: <span dir="ltr">V(X) = n·p·(1−p)</span> },
    { term: 'פואסון — תוחלת ושונות', def: <span dir="ltr">E(X) = V(X) = λ</span> },
    { term: 'מתי בינומי?', def: 'n ניסיונות עצמאיים עם הסתברות הצלחה p קבועה.' },
    { term: 'מתי פואסון?', def: 'מספר אירועים ביחידת זמן/מרחק, עם קצב ממוצע λ.' },
  ],
};

const COLOR_MAP: Record<string, { active: string; dot: string; icon: string }> = {
  amber:   { active: 'border-b-2 border-amber-500 text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500',   icon: 'text-amber-500'  },
  orange:  { active: 'border-b-2 border-orange-500 text-orange-700 dark:text-orange-400', dot: 'bg-orange-400', icon: 'text-orange-500' },
  ono:     { active: 'border-b-2 border-ono-500 text-ono-700 dark:text-ono-400',          dot: 'bg-ono-500',    icon: 'text-ono-500'    },
  emerald: { active: 'border-b-2 border-emerald-500 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', icon: 'text-emerald-500' },
  sky:     { active: 'border-b-2 border-teal-500 text-teal-700 dark:text-teal-400',        dot: 'bg-teal-500',   icon: 'text-teal-600'   },
  violet:  { active: 'border-b-2 border-violet-500 text-violet-700 dark:text-violet-400', dot: 'bg-violet-500', icon: 'text-violet-500' },
};

export function GlossaryPage({ darkMode, onToggleDark, onBack }: LabProps) {
  const [active, setActive] = useState<keyof typeof SECTIONS>('techniques');
  const sec = SECTIONS[active];
  const items = ITEMS[active];
  const colors = COLOR_MAP[sec.color];

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-500 ${darkMode ? 'dark bg-night-bg text-slate-200' : 'bg-ono-50 text-slate-800'}`}
      dir="rtl"
    >
      {/* Header */}
      <nav className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${darkMode ? 'bg-night-nav/80 border-night-border' : 'bg-white/40 border-ono-200/60'}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <ArrowRight size={16} /> לוח בקרה
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-2.5">
              <div className="bg-ono-600 p-2 rounded-xl text-white">
                <BookOpen size={16} />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight">מאגר ידע וטכניקות</h1>
                <p className="text-[9px] font-bold text-ono-600 dark:text-ono-400 uppercase tracking-widest leading-none">Cheat Sheet אקדמי</p>
              </div>
            </div>
          </div>
          <button
            onClick={onToggleDark}
            className={`p-2.5 rounded-xl border transition-all ${darkMode ? 'border-night-border bg-night-card/50 hover:bg-night-card' : 'border-ono-200 bg-white/50 hover:bg-ono-100'}`}
          >
            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-ono-700" />}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto w-full px-4 py-8 md:px-8 flex flex-col gap-6">
        {/* Category Tabs */}
        <div className={`flex flex-wrap gap-1 p-1.5 rounded-2xl ${darkMode ? 'bg-night-card' : 'bg-slate-100/70'}`}>
          {(Object.entries(SECTIONS) as [string, GlossarySection][]).map(([key, s]) => {
            const c = COLOR_MAP[s.color];
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs transition-all flex-1 justify-center ${
                  isActive
                    ? `bg-white dark:bg-night-card2 shadow-glass ${c.active}`
                    : `text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400`
                }`}
              >
                <span className={isActive ? c.icon : ''}>{s.icon}</span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Card */}
        <div className={`rounded-3xl overflow-hidden border shadow-glass ${darkMode ? 'bg-night-card border-night-border' : 'bg-white border-slate-200/80'}`}>
          <div className={`px-6 py-4 border-b flex items-center gap-3 ${darkMode ? 'border-night-border bg-night-card2/60' : 'border-slate-100 bg-slate-50/60'}`}>
            <span className={colors.icon}>{sec.icon}</span>
            <h2 className="text-lg font-black">{sec.title}</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-shadow hover:shadow-md ${darkMode ? 'bg-night-card2/60 border-night-border' : 'bg-white border-slate-200'}`}
              >
                <h3 className={`font-bold text-sm mb-2 flex items-center gap-2 ${darkMode ? colors.icon.replace('text-', 'text-') : colors.icon}`}>
                  <span className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />
                  {item.term}
                </h3>
                <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">{item.def}</div>
              </div>
            ))}
          </div>

          {active === 'techniques' && (
            <div className="px-6 pb-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl flex gap-3 items-start">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-1 text-sm">טיפ זהב למבחן!</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed">
                    קראו היטב את הנתונים. רוב הטעויות נובעות מבלבול בין "אחוזון" (שטח P) לבין "ערך גולמי" (X). ודאו תמיד מה נתון לפני בחירת הנוסחה.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
