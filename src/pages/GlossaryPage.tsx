import React, { useState } from 'react';
import {
  BookOpen, Lightbulb, PieChart, TrendingUp,
  Layers, AlertCircle, ArrowRight, Moon, Sun
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
  items: GlossaryItem[];
}

const GLOSSARY: Record<string, GlossarySection> = {
  techniques: {
    title: 'טכניקות וטיפים למבחן',
    icon: <Lightbulb className="text-amber-500" size={20} />,
    color: 'border-amber-500',
    items: [
      {
        term: 'כלל הסימטריה (Z שלילי)',
        def: 'כאשר נתון שטח (הסתברות) הקטן מ-50% (0.5), המשמעות היא שהציון נמצא משמאל לממוצע. חובה לחשב את השטח המשלים (1 פחות השטח הנתון), לחפש בטבלה, ולהוסיף סימן מינוס (-) לציון התקן שמצאנו.',
      },
      {
        term: 'סדר פעולות ברגרסיה',
        def: 'תמיד חשבו קודם את הממוצעים (X̄, Ȳ). לאחר מכן מצאו את השיפוע (b). ורק בסוף הציבו את הממוצעים והשיפוע כדי למצוא את החותך (a). לעולם אל תעגלו תוצאות ביניים לפני החישוב הסופי!',
      },
      {
        term: 'זיהוי מאורעות בשאלה מילולית',
        def: 'המילה "וגם" מסמלת חיתוך (Intersection). המילה "או" מסמלת איחוד (Union). המילה "בלבד" או "אך לא" מסמלת חיתוך עם מאורע משלים.',
      },
    ],
  },
  descriptive: {
    title: 'סטטיסטיקה תיאורית',
    icon: <PieChart className="text-orange-500" size={20} />,
    color: 'border-orange-500',
    items: [
      { term: 'ממוצע (μ / X̄)', def: 'מרכז הכובד של הנתונים. סכום כל התצפיות חלקי מספר התצפיות (N).' },
      { term: 'חציון (Median)', def: 'הערך שחוצה את הנתונים בדיוק לשניים (50% מעליו ו-50% מתחתיו) לאחר שסודרו מהקטן לגדול.' },
      { term: 'שונות (Variance - σ²)', def: 'מדד לפיזור הנתונים סביב הממוצע. מחושב כממוצע ריבועי הסטיות מהממוצע.' },
      { term: 'סטיית תקן (σ)', def: 'השורש הריבועי של השונות. מייצגת את ה"מרחק הממוצע" של כל תצפית מהתוחלת.' },
      { term: 'טווח בין-רבעוני (IQR)', def: 'ההפרש בין הרבעון העליון (Q3) לרבעון התחתון (Q1). מכיל את 50% מהתצפיות המרכזיות.' },
    ],
  },
  normalDist: {
    title: 'התפלגות נורמלית',
    icon: <TrendingUp className="text-blue-500" size={20} />,
    color: 'border-blue-500',
    items: [
      { term: 'ציון תקן (Z)', def: 'מספר המציין בכמה סטיות תקן תצפית מסוימת רחוקה מהממוצע. Z חיובי = מעל הממוצע, Z שלילי = מתחת לממוצע.' },
      { term: 'אחוזון (Percentile)', def: 'אחוז התצפיות שנמצאות מתחת לערך מסוים. לדוגמה, האחוזון ה-90 אומר ש-90% מהאוכלוסייה מתחתיו.' },
      {
        term: 'נוסחת ציון התקן',
        def: <span dir="ltr">Z = <MathFraction numerator="X - μ" denominator="σ" /></span>,
      },
    ],
  },
  probability: {
    title: 'הסתברות ותורת הקבוצות',
    icon: <Layers className="text-emerald-500" size={20} />,
    color: 'border-emerald-500',
    items: [
      { term: 'חיתוך (Intersection - ∩)', def: 'ההסתברות ששני מאורעות (A וגם B) יקרו בו-זמנית.' },
      { term: 'איחוד (Union - ∪)', def: 'ההסתברות שלפחות אחד משני המאורעות (A או B או שניהם) יקרה.' },
      { term: 'נוסחת האיחוד', def: <span dir="ltr">P(A∪B) = P(A) + P(B) - P(A∩B)</span> },
      { term: 'מאורע משלים (Complement)', def: 'ההסתברות שמאורע מסוים לא יקרה. מחושב כ- 1 פחות ההסתברות שהמאורע כן יקרה.' },
    ],
  },
};

export function GlossaryPage({ darkMode, onToggleDark, onBack }: LabProps) {
  const [activeSection, setActiveSection] = useState<keyof typeof GLOSSARY>('techniques');
  const section = GLOSSARY[activeSection];

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-500 ${darkMode ? 'dark bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}
      dir="rtl"
    >
      {/* Header */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <ArrowRight size={16} /> לוח בקרה
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg">
                <BookOpen size={18} />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight">מאגר ידע וטכניקות</h1>
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest leading-none">Cheat Sheet אקדמי</p>
              </div>
            </div>
          </div>
          <button
            onClick={onToggleDark}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-transform active:scale-90"
          >
            {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-blue-600" />}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto w-full px-4 py-8 md:px-8 flex flex-col gap-8">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3">
          {(Object.entries(GLOSSARY) as [keyof typeof GLOSSARY, GlossarySection][]).map(([key, sec]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeSection === key
                  ? `bg-white dark:bg-slate-800 shadow-md border-b-4 ${sec.color}`
                  : 'bg-slate-200 dark:bg-slate-800/50 text-slate-500 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {sec.icon}
              <span className="hidden sm:inline">{sec.title}</span>
            </button>
          ))}
        </div>

        {/* Content Card */}
        <div className={`bg-white dark:bg-slate-900 rounded-3xl shadow-xl border-t-8 ${section.color} p-6 md:p-10`}>
          <div className="flex items-center gap-4 mb-8 border-b dark:border-slate-800 pb-4">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">{section.icon}</div>
            <h2 className="text-xl md:text-2xl font-bold">{section.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {section.items.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-base mb-2 text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-current shrink-0" />
                  {item.term}
                </h3>
                <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">{item.def}</div>
              </div>
            ))}
          </div>

          {activeSection === 'techniques' && (
            <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl flex gap-4 items-start">
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-amber-800 dark:text-amber-300 mb-1">טיפ זהב למבחן!</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400/80">
                  קראו היטב את הנתונים. רוב הטעויות נובעות מבלבול בין "אחוזון" (שטח P) לבין "ערך גולמי" (X). ודאו תמיד מה נתון לכם לפני שאתם בוחרים בנוסחה.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
