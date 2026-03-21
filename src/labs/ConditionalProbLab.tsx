import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Moon, Sun, ArrowRight, CheckCircle2, Target, GitBranch,
  RotateCcw, HelpCircle, GraduationCap,
} from 'lucide-react';
import { ExplainerPanel } from '../components/ExplainerPanel';
import { NotesPanel } from '../components/NotesPanel';
import { useProgressStore } from '../store/progressStore';

interface LabProps {
  darkMode: boolean;
  onToggleDark: () => void;
  onBack: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function r2(n: number) { return Math.round(n * 100) / 100; }
function r4(n: number) { return Math.round(n * 10000) / 10000; }

const MathDisplay = ({ children }: { children: React.ReactNode }) => (
  <div
    className="bg-slate-50 dark:bg-night-muted font-mono text-base text-center py-3 px-4 rounded-2xl my-3 dir-ltr"
    dir="ltr"
  >
    {children}
  </div>
);

// ── Scenario Data ─────────────────────────────────────────────────────────────
interface Scenario {
  name: string;
  unit: string;
  aLabel: string;  // e.g. "מכונה A"
  bLabel: string;  // e.g. "פגום"
  pA: number;      // P(A)
  pBgA: number;    // P(B|A)
  pBgAc: number;   // P(B|Aᶜ)
}

const SCENARIOS: Scenario[] = [
  { name: 'מפעל ייצור', unit: '', aLabel: 'מכונה A', bLabel: 'מוצר פגום', pA: 0.60, pBgA: 0.02, pBgAc: 0.04 },
  { name: 'בדיקה רפואית', unit: '', aLabel: 'חולה', bLabel: 'תוצאה חיובית', pA: 0.05, pBgA: 0.95, pBgAc: 0.10 },
  { name: 'שיווק דיגיטלי', unit: '', aLabel: 'ערוץ A', bLabel: 'המרה', pA: 0.40, pBgA: 0.08, pBgAc: 0.03 },
  { name: 'בקרת איכות', unit: '', aLabel: 'ספק A', bLabel: 'פריט לקוי', pA: 0.70, pBgA: 0.03, pBgAc: 0.07 },
];

function generateScenario(lvl: number): Scenario {
  const base = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  if (lvl === 5) return SCENARIOS[0]; // fixed factory for exam
  return base;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ConditionalProbLab({ darkMode, onToggleDark, onBack }: LabProps) {
  const { topics, completeStage } = useProgressStore();
  const [level, setLevel] = useState(1);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Scenario | null>(null);
  const [inputs, setInputs] = useState({ pA: '', pAc: '', pBgA: '', pBgAc: '', pB: '', pAgB: '' });
  const [feedback, setFeedback] = useState<Record<string, boolean | null>>({});
  const [examSelected, setExamSelected] = useState<number | null>(null);
  const [examOptions, setExamOptions] = useState<number[]>([]);
  const [examResult, setExamResult] = useState<0 | 1 | -1>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const start = useCallback((lvl: number) => {
    setLevel(lvl);
    setStep(1);
    setInputs({ pA: '', pAc: '', pBgA: '', pBgAc: '', pB: '', pAgB: '' });
    setFeedback({});
    setExamSelected(null);
    setExamResult(0);
    const s = generateScenario(lvl);
    setData(s);
    // generate exam options
    if (lvl === 5) {
      const correct = r4(s.pBgA * s.pA / (s.pBgA * s.pA + s.pBgAc * (1 - s.pA)));
      const opts = new Set([correct]);
      while (opts.size < 4) {
        const noise = (Math.round((Math.random() * 0.3 - 0.15) * 100) / 100);
        opts.add(r4(Math.max(0.01, Math.min(0.99, correct + noise))));
      }
      setExamOptions([...opts].sort(() => Math.random() - 0.5));
    }
  }, []);

  useEffect(() => { start(1); }, [start]);

  // ── Canvas: probability tree ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const bg = darkMode ? '#181c1a' : '#f2f5f2';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const lineColor = darkMode ? '#5a9e6e' : '#2d6441';
    const textColor = darkMode ? '#cbd5e1' : '#1e293b';
    const nodeColor = darkMode ? '#242d26' : '#fff';
    const nodeBorder = darkMode ? '#2a3028' : '#c8d8c8';

    // derived values
    const pAc = r4(1 - data.pA);
    const pAB = r4(data.pA * data.pBgA);
    const pAcB = r4(pAc * data.pBgAc);
    const pABc = r4(data.pA * (1 - data.pBgA));
    const pAcBc = r4(pAc * (1 - data.pBgAc));

    // layout: root at left, 2 children, 4 grandchildren
    const root = { x: 80, y: H / 2 };
    const mid1 = { x: W / 2 - 20, y: H / 4 };
    const mid2 = { x: W / 2 - 20, y: 3 * H / 4 };
    const leaf1 = { x: W - 100, y: H / 8 };
    const leaf2 = { x: W - 100, y: 3 * H / 8 };
    const leaf3 = { x: W - 100, y: 5 * H / 8 };
    const leaf4 = { x: W - 100, y: 7 * H / 8 };

    function drawLine(a: { x: number; y: number }, b: { x: number; y: number }, prob: number, label: string) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      ctx.fillStyle = textColor;
      ctx.font = 'bold 11px Heebo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${label}=${prob}`, mx, my - 8);
    }

    function drawNode(pos: { x: number; y: number }, label: string, prob?: number) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 26, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.fill();
      ctx.strokeStyle = nodeBorder;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.font = 'bold 10px Heebo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, pos.x, pos.y + (prob !== undefined ? -4 : 4));
      if (prob !== undefined) {
        ctx.font = '10px Heebo, sans-serif';
        ctx.fillStyle = lineColor;
        ctx.fillText(`p=${prob}`, pos.x, pos.y + 9);
      }
    }

    drawLine(root, mid1, data.pA, 'P(A)');
    drawLine(root, mid2, pAc, 'P(Aᶜ)');
    drawLine(mid1, leaf1, data.pBgA, 'P(B|A)');
    drawLine(mid1, leaf2, r4(1 - data.pBgA), 'P(Bᶜ|A)');
    drawLine(mid2, leaf3, data.pBgAc, 'P(B|Aᶜ)');
    drawLine(mid2, leaf4, r4(1 - data.pBgAc), 'P(Bᶜ|Aᶜ)');

    drawNode(root, 'S');
    drawNode(mid1, data.aLabel);
    drawNode(mid2, `${data.aLabel}ᶜ`);

    if (step >= 3) {
      drawNode(leaf1, data.bLabel, pAB);
      drawNode(leaf2, `${data.bLabel}ᶜ`, pABc);
      drawNode(leaf3, data.bLabel, pAcB);
      drawNode(leaf4, `${data.bLabel}ᶜ`, pAcBc);
    } else {
      drawNode(leaf1, data.bLabel);
      drawNode(leaf2, `${data.bLabel}ᶜ`);
      drawNode(leaf3, data.bLabel);
      drawNode(leaf4, `${data.bLabel}ᶜ`);
    }
  }, [data, darkMode, step]);

  if (!data) return null;

  const pAc = r4(1 - data.pA);
  const pB = r4(data.pA * data.pBgA + pAc * data.pBgAc);
  const pAgB = r4(data.pBgA * data.pA / pB);

  // ── Checks ─────────────────────────────────────────────────────────────────
  function check(key: string, expected: number, inputVal: string, next: number) {
    const val = parseFloat(inputVal);
    const ok = Math.abs(val - expected) < 0.005;
    setFeedback(f => ({ ...f, [key]: ok }));
    if (ok) {
      setStep(next);
      if (next > 4 && level <= 4) completeStage('conditionalProb', level);
    }
  }

  const LEVELS = [
    { id: 1, label: 'זיהוי הסתברויות' },
    { id: 2, label: 'נוסחת P(A|B)' },
    { id: 3, label: 'הסתברות כוללת' },
    { id: 4, label: 'עץ הסתברות' },
    { id: 5, label: 'סימולציית בחינה' },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 ${darkMode ? 'dark bg-night-bg text-slate-50' : 'bg-ono-50 text-slate-900'}`} dir="rtl">

      {/* ── Nav ── */}
      <nav className={`fixed top-0 w-full z-50 border-b backdrop-blur-xl transition-all ${darkMode ? 'bg-night-nav/80 border-night-border' : 'bg-white/40 border-slate-200/60'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
              <ArrowRight size={16} /> לוח בקרה
            </button>
            <span className="opacity-20">|</span>
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-ono-500" />
              <span className="font-black text-sm">הסתברות מותנית ובייס</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${darkMode ? 'bg-night-card2 text-ono-400' : 'bg-ono-100 text-ono-700'}`}>
              {topics.conditionalProb.topicReadiness}% מוכנות
            </span>
            <button onClick={onToggleDark} className={`p-2 rounded-xl border transition-all ${darkMode ? 'border-night-border bg-night-card/40 hover:bg-night-card' : 'border-ono-200 bg-white/50 hover:bg-slate-50'}`}>
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-ono-700" />}
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row gap-0 pt-16 min-h-screen" dir="rtl">
        {/* ── Sidebar ── */}
        <aside className={`w-full lg:w-72 shrink-0 p-4 flex flex-col gap-4 border-b lg:border-b-0 lg:border-l transition-colors lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto ${darkMode ? 'bg-night-nav/50 border-night-border' : 'bg-white/50 border-slate-200/60'}`}>

          <ExplainerPanel
            title="הסתברות מותנית"
            summary="P(A|B) — הסתברות שמאורע A יקרה בהינתן שידוע כי מאורע B כבר קרה. משתמשים בנוסחת בייס כדי להפוך את הכיוון."
            formulas={[
              { label: 'מותנית', formula: 'P(A|B) = P(A∩B) / P(B)' },
              { label: 'בייס', formula: 'P(A|B) = P(B|A)·P(A) / P(B)' },
              { label: 'כוללת', formula: 'P(B) = P(B|A)·P(A) + P(B|Aᶜ)·P(Aᶜ)' },
            ]}
            tips={[
              'זהו מה הנתון ומה השאלה — אל תבלבלו כיוון',
              'חשבו P(B) תמיד לפני P(A|B)',
              'שימוש בעץ הסתברות מונע טעויות',
            ]}
          />

          <div className={`p-4 rounded-[1.5rem] border backdrop-blur-xl ${darkMode ? 'bg-night-card/40 border-night-border' : 'bg-white/40 border-slate-200'}`}>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <GitBranch size={13} /> מסלול הכשרה
            </h2>
            <div className="flex flex-col gap-1.5">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => start(lvl.id)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 text-right ${level === lvl.id ? 'bg-ono-600 dark:bg-ono-700/70 text-white font-bold border border-ono-700 dark:border-ono-600/40' : level > lvl.id ? 'bg-slate-50 dark:bg-night-card2 border border-slate-200 dark:border-night-border text-slate-500 dark:text-slate-400 font-medium' : darkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-night-muted/40' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/60'}`}
                >
                  <span className="text-sm">{lvl.id}. {lvl.label}</span>
                  {level > lvl.id ? <CheckCircle2 size={15} className="text-ono-500" /> : <Target size={15} className="opacity-40" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <NotesPanel topic="conditionalProb" level={level} darkMode={darkMode} />
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 p-4 md:p-8 flex flex-col gap-6 max-w-4xl order-1 lg:order-none">

          {/* Scenario card */}
          <div className={`relative p-6 rounded-[2rem] border overflow-hidden ${darkMode ? 'bg-night-card/40 border-night-border' : 'bg-white/40 border-slate-200/60'} backdrop-blur-xl`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-ono-600/5 rounded-bl-[4rem]" />
            <p className="text-[10px] font-black text-ono-500 dark:text-ono-400 uppercase tracking-widest mb-2">תרחיש אקדמי</p>
            <h3 className="text-xl font-bold leading-relaxed mb-3">
              בניתוח <strong className="italic">{data.name}</strong>:
            </h3>
            <ul className="space-y-1 text-sm" dir="ltr">
              <li><span className="font-mono text-ono-600 dark:text-ono-400">P({data.aLabel}) = {data.pA}</span></li>
              <li><span className="font-mono text-ono-600 dark:text-ono-400">P({data.bLabel}|{data.aLabel}) = {data.pBgA}</span></li>
              <li><span className="font-mono text-ono-600 dark:text-ono-400">P({data.bLabel}|{data.aLabel}ᶜ) = {data.pBgAc}</span></li>
            </ul>
            {level <= 3 && (
              <div className="mt-4 flex items-center gap-2 py-2.5 px-4 bg-ono-50 dark:bg-ono-900/20 border border-ono-200 dark:border-ono-800/40 rounded-2xl w-fit">
                <HelpCircle size={14} className="text-ono-600 dark:text-ono-400" />
                <span className="font-bold text-ono-700 dark:text-ono-300 text-xs">
                  {level === 1 ? `מצאו את P(${data.aLabel}ᶜ)` : level === 2 ? `מצאו את P(${data.bLabel})` : `מצאו P(${data.aLabel}|${data.bLabel})`}
                </span>
              </div>
            )}
            <button onClick={() => start(level)} className="absolute top-4 left-4 p-2 rounded-xl opacity-40 hover:opacity-80 transition-opacity">
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Canvas: tree diagram */}
          <div className={`p-4 rounded-[2rem] border backdrop-blur-xl ${darkMode ? 'bg-night-card/40 border-night-border' : 'bg-white/40 border-slate-200/60'}`}>
            <canvas ref={canvasRef} width={900} height={280} className="w-full h-auto rounded-2xl canvas-glow" />
          </div>

          {/* Steps 1–3: input cards for levels 1–3 */}
          {level <= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Step 1: P(Aᶜ) */}
              <div className={`p-5 rounded-[1.5rem] border-2 transition-all ${step === 1 ? 'border-ono-600 bg-white dark:bg-night-card shadow-ono' : step > 1 ? 'border-ono-200 dark:border-night-border bg-ono-50/50 dark:bg-night-card2/30' : 'opacity-40 grayscale pointer-events-none'}`}>
                <p className="text-[10px] font-black text-ono-600 dark:text-ono-400 uppercase tracking-widest mb-3">01. הסתברות משלים</p>
                <MathDisplay>P({data.aLabel}ᶜ) = 1 − P({data.aLabel})</MathDisplay>
                <div className="flex flex-col gap-2" dir="ltr">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ono-600">P({data.aLabel}ᶜ) =</span>
                    <input
                      type="number" step="0.01" value={inputs.pAc}
                      onChange={e => setInputs(i => ({ ...i, pAc: e.target.value }))}
                      className="w-24 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center font-bold border outline-none"
                    />
                  </div>
                  <button onClick={() => check('pAc', pAc, inputs.pAc, 2)} className="w-full bg-ono-600 hover:bg-ono-700 text-white py-2 rounded-xl font-bold text-sm">אמת</button>
                  {feedback.pAc === false && <p className="text-red-500 text-xs text-center">שגוי — 1 − {data.pA} = ?</p>}
                </div>
              </div>

              {/* Step 2: P(B) total */}
              <div className={`p-5 rounded-[1.5rem] border-2 transition-all ${step === 2 ? 'border-ono-500 bg-white dark:bg-night-card shadow-ono' : step > 2 ? 'border-ono-200 dark:border-night-border bg-ono-50/50 dark:bg-night-card2/30' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <p className="text-[10px] font-black text-ono-600 dark:text-ono-400 uppercase tracking-widest mb-3">02. הסתברות כוללת P(B)</p>
                <MathDisplay>P(B) = P(B|A)·P(A) + P(B|Aᶜ)·P(Aᶜ)</MathDisplay>
                <div className="flex flex-col gap-2" dir="ltr">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ono-600">P({data.bLabel}) =</span>
                    <input
                      type="number" step="0.001" value={inputs.pB}
                      onChange={e => setInputs(i => ({ ...i, pB: e.target.value }))}
                      className="w-24 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center font-bold border outline-none"
                    />
                  </div>
                  <button onClick={() => check('pB', pB, inputs.pB, 3)} className="w-full bg-ono-600 hover:bg-ono-700 text-white py-2 rounded-xl font-bold text-sm">אמת</button>
                  {feedback.pB === false && <p className="text-red-500 text-xs text-center">שגוי — P(B|A)·P(A) + P(B|Aᶜ)·P(Aᶜ)</p>}
                </div>
              </div>

              {/* Step 3: P(A|B) Bayes */}
              {step >= 3 && (
                <div className="md:col-span-2 p-5 rounded-[1.5rem] border-2 border-ono-400 bg-white dark:bg-night-card shadow-ono fade-in">
                  <p className="text-[10px] font-black text-ono-600 dark:text-ono-400 uppercase tracking-widest mb-3">03. נוסחת בייס P(A|B)</p>
                  <MathDisplay>P(A|B) = P(B|A)·P(A) / P(B) = {data.pBgA}·{data.pA} / {pB}</MathDisplay>
                  <div className="flex flex-col gap-2" dir="ltr">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ono-600">P({data.aLabel}|{data.bLabel}) =</span>
                      <input
                        type="number" step="0.0001" value={inputs.pAgB}
                        onChange={e => setInputs(i => ({ ...i, pAgB: e.target.value }))}
                        className="w-28 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center font-bold border outline-none"
                      />
                    </div>
                    <button onClick={() => check('pAgB', pAgB, inputs.pAgB, 99)} className="w-full bg-ono-600 hover:bg-ono-700 text-white py-2 rounded-xl font-bold text-sm">בדוק תוצאה</button>
                    {feedback.pAgB === false && <p className="text-red-500 text-xs text-center">שגוי — {data.pBgA}×{data.pA} ÷ {pB}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Level 4: tree builder */}
          {level === 4 && (
            <div className={`p-6 rounded-[2rem] border backdrop-blur-xl fade-in ${darkMode ? 'bg-night-card/40 border-night-border' : 'bg-white/40 border-slate-200/60'}`}>
              <h3 className="text-lg font-black mb-4">עץ הסתברות — בייס</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                חשבו את הסתברות בייס עם הנוסחה. העץ בגרף מראה את כל הענפים.
              </p>
              <MathDisplay>
                P({data.aLabel}|{data.bLabel}) = {data.pBgA}×{data.pA} / ({data.pBgA}×{data.pA} + {data.pBgAc}×{pAc}) = {pAgB}
              </MathDisplay>
              <div className="flex flex-col gap-2" dir="ltr">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ono-600">P({data.aLabel}|{data.bLabel}) =</span>
                  <input
                    type="number" step="0.0001" value={inputs.pAgB}
                    onChange={e => setInputs(i => ({ ...i, pAgB: e.target.value }))}
                    className="w-28 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center font-bold border outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    const ok = Math.abs(parseFloat(inputs.pAgB) - pAgB) < 0.005;
                    setFeedback(f => ({ ...f, pAgB: ok }));
                    if (ok) { setStep(99); completeStage('conditionalProb', 4); }
                  }}
                  className="w-full bg-ono-600 hover:bg-ono-700 text-white py-2.5 rounded-xl font-bold"
                >סיים</button>
                {feedback.pAgB === false && <p className="text-red-500 text-xs text-center">שגוי — נסה שוב</p>}
                {step === 99 && (
                  <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-ono-800 rounded-2xl text-center fade-in">
                    <span className="font-black text-ono-700 dark:text-ono-300">מצוין! 🎉 P({data.aLabel}|{data.bLabel}) = {pAgB}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Level 5: exam */}
          {level === 5 && (
            <section className={`p-8 rounded-[2.5rem] border shadow-glass fade-in backdrop-blur-xl ${darkMode ? 'bg-night-card/40 border-night-border' : 'bg-white/40 border-slate-200/60'}`}>
              <h2 className="text-2xl font-black mb-6 text-center text-ono-700 dark:text-ono-300">סימולציית בחינה — בייס</h2>
              <div className={`p-5 rounded-2xl border mb-6 ${darkMode ? 'bg-night-card2 border-night-border' : 'bg-ono-50 border-slate-200'}`}>
                <p className="text-sm font-medium leading-relaxed">
                  במפעל, מכונה A מייצרת {data.pA * 100}% מהתוצרת עם שיעור פגמים {data.pBgA * 100}%.
                  מכונה Aᶜ מייצרת {pAc * 100}% עם שיעור פגמים {data.pBgAc * 100}%.
                  <br /><br />
                  <strong>נבחר פריט פגום — מה ההסתברות שיצא ממכונה A?</strong>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4" dir="ltr">
                {examOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setExamSelected(opt)}
                    className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${examSelected === opt ? 'border-ono-600 bg-ono-100 dark:bg-ono-900/30 text-ono-800 dark:text-ono-200' : 'border-slate-200 dark:border-night-border hover:border-ono-400 bg-slate-50 dark:bg-night-card'}`}
                  >{opt}</button>
                ))}
              </div>
              {examSelected !== null && examResult === 0 && (
                <button
                  onClick={() => {
                    if (Math.abs(examSelected - pAgB) < 0.005) {
                      setExamResult(1);
                      completeStage('conditionalProb', 5);
                    } else {
                      setExamResult(-1);
                    }
                  }}
                  className="w-full bg-ono-600 hover:bg-ono-700 text-white py-4 rounded-xl font-bold text-lg"
                >הגש תשובה</button>
              )}
              {examResult === 1 && (
                <div className="p-6 bg-ono-50 dark:bg-ono-900/20 border-2 border-ono-500 rounded-2xl text-center fade-in">
                  <span className="text-4xl block mb-2">🏆</span>
                  <h3 className="text-xl font-black text-ono-700 dark:text-ono-400">תשובה נכונה!</h3>
                  <p className="text-sm mt-1 opacity-70">P({data.aLabel}|{data.bLabel}) = {pAgB}</p>
                  <button onClick={() => start(5)} className="mt-4 bg-ono-600 text-white px-6 py-2 rounded-lg font-bold">שאלה נוספת</button>
                </div>
              )}
              {examResult === -1 && (
                <div className="text-center mt-4">
                  <p className="text-red-500 font-bold mb-2">שגוי. השתמשו בבייס: P(B|A)·P(A) / P(B)</p>
                  <button onClick={() => setExamResult(0)} className="text-ono-600 dark:text-ono-400 font-bold underline">נסה שוב</button>
                </div>
              )}
            </section>
          )}

          {/* Success banner for levels 1–3 */}
          {step === 99 && level <= 3 && (
            <div className="bg-ono-50 dark:bg-ono-900/20 p-5 rounded-2xl border border-ono-300 dark:border-ono-800 flex items-center justify-between fade-in">
              <div className="flex items-center gap-3">
                <div className="bg-ono-500 text-white p-2.5 rounded-full"><CheckCircle2 size={22} /></div>
                <div>
                  <h3 className="font-bold text-ono-800 dark:text-ono-300">תשובה נכונה! P({data.aLabel}|{data.bLabel}) = {pAgB}</h3>
                  <p className="text-xs text-ono-600 dark:text-ono-400">עץ הסתברות עודכן</p>
                </div>
              </div>
              <button onClick={() => start(level)} className={`px-5 py-2.5 rounded-xl font-bold text-sm ${darkMode ? 'bg-night-card2 hover:bg-night-muted text-white' : 'bg-slate-900 text-white hover:scale-105'} transition-all`}>
                תרגיל נוסף
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
