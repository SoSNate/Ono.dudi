import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight, CheckCircle2, Target, GitBranch,
  RotateCcw, HelpCircle, GraduationCap,
} from 'lucide-react';
import { ThemeSelector } from '../components/ThemeSelector';
import { useTheme } from '../context/ThemeContext';
import { r2, r4, MathDisplay } from '../utils/mathHelpers';
import { ExplainerPanel } from '../components/ExplainerPanel';
import { NotesPanel } from '../components/NotesPanel';
import { useProgressStore } from '../store/progressStore';
import ConceptCard from '../components/ConceptCard';
import { WhyBridge } from '../components/WhyBridge';
import { MagicSquare } from '../components/MagicSquare';

const COND_EXAM_QUESTIONS = [
  {
    question: 'בפרויקט: ותיק מסיים בזמן P=0.8, חדש P=0.6, שניהם P=0.5. מהי ההסתברות שהחדש יסיים בזמן והוותיק לא?',
    options: ['0.1', '0.2', '0.3', '0.4'],
    correct: 0,
    explanation: 'P(חדש∩לא ותיק) = P(חדש) − P(שניהם) = 0.6 − 0.5 = 0.1',
  },
  {
    question: 'מבחן רפואי: P(חולה)=0.01, רגישות P(חיובי|חולה)=0.95, P(חיובי|בריא)=0.05. מה P(חולה|חיובי)?',
    options: ['≈0.16', '≈0.95', '≈0.05', '≈0.01'],
    correct: 0,
    explanation: 'P(חיובי) = 0.95×0.01 + 0.05×0.99 = 0.0095+0.0495 = 0.059. P(חולה|חיובי) = 0.0095/0.059 ≈ 0.16',
  },
];

interface LabProps {
  onBack: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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
export function ConditionalProbLab({ onBack }: LabProps) {
  const { resolveVar, isDark } = useTheme();
  const { topics, completeStage } = useProgressStore();
  const [level, setLevel] = useState(1);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Scenario | null>(null);
  const [inputs, setInputs] = useState({ pA: '', pAc: '', pBgA: '', pBgAc: '', pB: '', pAgB: '' });
  const [feedback, setFeedback] = useState<Record<string, boolean | null>>({});
  const [examSelected, setExamSelected] = useState<number | null>(null);
  const [examOptions, setExamOptions] = useState<number[]>([]);
  const [examResult, setExamResult] = useState<0 | 1 | -1>(0);
  const [examQIdx, setExamQIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'tree' | 'square'>('tree');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const start = useCallback((lvl: number) => {
    setLevel(lvl);
    setStep(1);
    setInputs({ pA: '', pAc: '', pBgA: '', pBgAc: '', pB: '', pAgB: '' });
    setFeedback({});
    setExamSelected(null);
    setExamResult(0);
    setActiveTab('tree');
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

    ctx.fillStyle = resolveVar('--canvas-bg') || (isDark ? '#181c1a' : '#f2f5f2');
    ctx.fillRect(0, 0, W, H);

    const lineColor = resolveVar('--canvas-line');
    const textColor = resolveVar('--canvas-text');
    const nodeColor = isDark ? '#242d26' : '#fff';
    const nodeBorder = resolveVar('--canvas-grid');

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
  }, [data, isDark, step, resolveVar]);

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
    <div className="min-h-screen flex flex-col transition-colors duration-700 bg-ono-50 text-slate-900 dark:bg-night-bg dark:text-slate-50" dir="rtl">

      {/* ── Nav ── */}
      <nav className="focus-hide fixed top-0 w-full z-50 border-b backdrop-blur-xl transition-all bg-white/40 border-slate-200/60 dark:bg-night-nav/80 dark:border-night-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              <ArrowRight size={16} /> לוח בקרה
            </button>
            <span className="opacity-20">|</span>
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-ono-500" />
              <span className="font-black text-sm">הסתברות מותנית ובייס</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-ono-100 text-ono-700 dark:bg-night-card2 dark:text-ono-400">
              {topics.conditionalProb.topicReadiness}% מוכנות
            </span>
            <ThemeSelector />
          </div>
        </div>
      </nav>

      <div className="lab-flex flex flex-col lg:flex-row gap-0 pt-16 min-h-screen" dir="rtl">
        {/* ── Sidebar ── */}
        <aside className="focus-hide w-full lg:w-72 shrink-0 p-4 flex flex-col gap-4 border-b lg:border-b-0 lg:border-l transition-colors lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto order-2 lg:order-none bg-white/50 border-slate-200/60 dark:bg-night-nav/50 dark:border-night-border">

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

          <div className="p-4 rounded-[1.5rem] border backdrop-blur-xl bg-white/40 border-slate-200 dark:bg-night-card/40 dark:border-night-border">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <GitBranch size={13} /> מסלול הכשרה
            </h2>
            <div className="flex flex-col gap-1.5">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => start(lvl.id)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 text-right ${level === lvl.id ? 'bg-ono-600 dark:bg-ono-700/70 text-white font-bold border border-ono-700 dark:border-ono-600/40' : level > lvl.id ? 'bg-slate-50 dark:bg-night-card2 border border-slate-200 dark:border-night-border text-slate-500 dark:text-slate-400 font-medium' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/60 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-night-muted/40'}`}
                >
                  <span className="text-sm">{lvl.id}. {lvl.label}</span>
                  {level > lvl.id ? <CheckCircle2 size={15} className="text-ono-500" /> : <Target size={15} className="opacity-40" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <NotesPanel
                topic="conditionalProb"
                level={step}
                moduleName="הסתברות מותנית"
                renderedData={data ? { ...data } : {}}
              />
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="focus-center flex-1 p-4 md:p-8 flex flex-col gap-6 max-w-4xl order-1 lg:order-none">

          {/* Scenario card */}
          <div className="relative p-6 rounded-[2rem] border overflow-hidden bg-white/40 border-slate-200/60 dark:bg-night-card/40 dark:border-night-border backdrop-blur-xl">
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

          {/* Why Bridge — shown from step 2 onward */}
          {step >= 2 && <WhyBridge topic="conditionalProb" />}

          {/* Tab toggle for level 4 */}
          {level === 4 && (
            <div className="flex gap-2 p-1 rounded-2xl border bg-slate-100/70 dark:bg-night-card/60 border-slate-200 dark:border-night-border w-fit">
              <button
                onClick={() => setActiveTab('tree')}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'tree' ? 'bg-ono-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
              >עץ הסתברות</button>
              <button
                onClick={() => setActiveTab('square')}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'square' ? 'bg-ono-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
              >ריבוע הקסם</button>
            </div>
          )}

          {/* Canvas: tree diagram */}
          {!(level === 4 && activeTab === 'square') && (
            <div className="p-4 rounded-[2rem] border backdrop-blur-xl min-h-[250px] flex items-center bg-white/40 border-slate-200/60 dark:bg-night-card/40 dark:border-night-border">
              <canvas ref={canvasRef} width={900} height={280} className="w-full h-auto rounded-2xl canvas-glow" />
            </div>
          )}

          {/* Magic Square tab (level 4 only) */}
          {level === 4 && activeTab === 'square' && (
            <div className="p-4 rounded-[2rem] border backdrop-blur-xl bg-white/40 border-slate-200/60 dark:bg-night-card/40 dark:border-night-border fade-in">
              <MagicSquare
                aLabel={data.aLabel}
                bLabel={data.bLabel}
                pA={data.pA}
                pBgA={data.pBgA}
                pBgAc={data.pBgAc}
                difficulty="guided"
                onComplete={(ok) => { if (ok) { setStep(99); completeStage('conditionalProb', 4); } }}
              />
            </div>
          )}

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
            <div className="p-6 rounded-[2rem] border backdrop-blur-xl fade-in bg-white/40 border-slate-200/60 dark:bg-night-card/40 dark:border-night-border">
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
          {level === 5 && (() => {
            const q = COND_EXAM_QUESTIONS[examQIdx % COND_EXAM_QUESTIONS.length];
            return (
              <section className="bg-slate-900 text-white p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl fade-in">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-black text-ono-300">בחינה מסכמת — שאלות אמיתיות</h2>
                  <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">שאלה {examQIdx % COND_EXAM_QUESTIONS.length + 1}/{COND_EXAM_QUESTIONS.length}</span>
                </div>
                <ConceptCard
                  title="משפט בייס — הרעיון"
                  intuition="'עדכון אמונות לאור ראיות.' ידוע ש-B קרה — עכשיו נחשב כמה סביר שA גרם לו."
                  formula="P(A|B) = P(B|A)·P(A) / P(B)  |  P(B) = P(B|A)·P(A)+P(B|Ā)·P(Ā)"
                  tip="תמיד חשבו P(B) קודם (הסתברות שלמה), ואז הצבו בבייס"
                />
                <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-3xl text-right space-y-4">
                  <p className="text-base font-medium leading-relaxed">{q.question}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {q.options.map((opt, i) => (
                      <button key={i} onClick={() => { if (examResult === 0) setExamSelected(i); }}
                        className={`p-4 rounded-2xl border-2 font-medium text-right transition-all ${
                          examResult !== 0
                            ? i === q.correct ? 'border-emerald-500 bg-emerald-900/50 text-emerald-300'
                              : examSelected === i && i !== q.correct ? 'border-red-500 bg-red-900/30 text-red-300'
                              : 'border-slate-600 text-slate-500 opacity-40'
                            : examSelected === i ? 'border-ono-500 bg-ono-600/30 text-white'
                            : 'border-slate-600 bg-slate-900 hover:border-ono-400 text-slate-300'
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  {examSelected !== null && examResult === 0 && (
                    <button onClick={() => {
                      if (examSelected === q.correct) { setExamResult(1); completeStage('conditionalProb', 5); }
                      else setExamResult(-1);
                    }} className="w-full bg-ono-600 hover:bg-ono-700 text-white py-4 rounded-2xl font-black text-lg transition-colors">
                      הגש תשובה
                    </button>
                  )}
                  {examResult === 1 && (
                    <div className="space-y-3 fade-in">
                      <div className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl font-bold text-center">תשובה נכונה!</div>
                      <div className="bg-slate-700/60 border border-slate-600 text-slate-300 p-4 rounded-xl text-sm">{q.explanation}</div>
                      <button onClick={() => { setExamQIdx(i => i + 1); setExamSelected(null); setExamResult(0); }}
                        className="w-full bg-ono-600 hover:bg-ono-500 text-white py-3 rounded-2xl font-bold">שאלה הבאה ←</button>
                    </div>
                  )}
                  {examResult === -1 && (
                    <div className="space-y-3 fade-in">
                      <div className="bg-red-900/50 border border-red-500/50 text-red-400 p-4 rounded-xl font-bold text-center">שגוי</div>
                      <div className="bg-slate-700/60 border border-slate-600 text-slate-300 p-4 rounded-xl text-sm">{q.explanation}</div>
                      <button onClick={() => { setExamSelected(null); setExamResult(0); }}
                        className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-2xl font-bold">נסה שוב</button>
                    </div>
                  )}
                </div>
              </section>
            );
          })()}

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
              <button onClick={() => start(level)} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-900 text-white hover:scale-105 dark:bg-night-card2 dark:hover:bg-night-muted transition-all">
                תרגיל נוסף
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
