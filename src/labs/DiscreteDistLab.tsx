import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowRight, CheckCircle2, Target,
  RotateCcw, HelpCircle, BarChart2,
} from 'lucide-react';
import { ThemeSelector } from '../components/ThemeSelector';
import { useTheme } from '../context/ThemeContext';
import { ExplainerPanel } from '../components/ExplainerPanel';
import { NotesPanel } from '../components/NotesPanel';
import ConceptCard from '../components/ConceptCard';
import { WhyBridge } from '../components/WhyBridge';

const DISCRETE_EXAM_QUESTIONS = [
  {
    question: 'במפעל: 5% מהמוצרים פגומים. נבדקים 20 מוצרים. מהי תוחלת מספר הפגומים E(X)?',
    options: ['1', '0.5', '4', '2'],
    correct: 0,
    explanation: 'X~Binomial(n=20, p=0.05). E(X) = n·p = 20×0.05 = 1',
  },
  {
    question: 'מרכז שירות מקבל בממוצע 4 פניות לשעה. מה מתאים יותר — בינומי או פואסון?',
    options: ['פואסון', 'בינומי', 'שניהם שקולים', 'לא ניתן לדעת'],
    correct: 0,
    explanation: 'פואסון מתאים כשיש "מספר ממוצע של אירועים בזמן/מרחב" (λ=4), לא ניסויים קבועים עם p.',
  },
  {
    question: 'אם X~Poisson(λ=4), מהי השונות V(X)?',
    options: ['4', '2', '16', '0.25'],
    correct: 0,
    explanation: 'בהתפלגות פואסון: V(X) = λ = 4. זה ייחודי לפואסון — תוחלת = שונות.',
  },
];
import { useProgressStore } from '../store/progressStore';

interface LabProps {
  onBack: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function r2(n: number) { return Math.round(n * 100) / 100; }
function factorial(n: number): number { return n <= 1 ? 1 : n * factorial(n - 1); }
function binomPMF(n: number, k: number, p: number): number {
  const c = factorial(n) / (factorial(k) * factorial(n - k));
  return r2(c * Math.pow(p, k) * Math.pow(1 - p, n - k));
}
function poissonPMF(lambda: number, k: number): number {
  return r2(Math.pow(Math.E, -lambda) * Math.pow(lambda, k) / factorial(k));
}

// ── Scenario Types ────────────────────────────────────────────────────────────
type DistType = 'binomial' | 'poisson';

interface Scenario {
  name: string;
  distType: DistType;
  description: string;
  n?: number;   // Binomial only
  p?: number;   // Binomial only
  lambda?: number; // Poisson only
}

const SCENARIOS: Scenario[] = [
  { name: 'פגמים בקו ייצור', distType: 'binomial', description: 'קו ייצור מוציא פריטים עם הסתברות פגם p בכל פריט מתוך n פריטים.', n: 20, p: 0.05 },
  { name: 'לקוחות בשעה', distType: 'poisson', description: 'ממוצע לקוחות המגיעים לחנות בשעה.', lambda: 4 },
  { name: 'מבחני קבלה', distType: 'binomial', description: 'n מועמדים עוברים מבחן עם הסתברות הצלחה p.', n: 10, p: 0.30 },
  { name: 'קליקים על מודעה', distType: 'poisson', description: 'ממוצע קליקים על מודעה דיגיטלית בדקה.', lambda: 3 },
  { name: 'פריטים תקינים', distType: 'binomial', description: 'n פריטים עם הסתברות p לפריט תקין.', n: 15, p: 0.80 },
];

function generateScenario(lvl: number): Scenario {
  if (lvl === 5) return SCENARIOS[0]; // fixed for exam
  return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
}

// ── Component ─────────────────────────────────────────────────────────────────
export function DiscreteDistLab({ onBack }: LabProps) {
  const { resolveVar, isDark } = useTheme();
  const { topics, completeStage } = useProgressStore();
  const [level, setLevel] = useState(1);
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Scenario | null>(null);
  const [inputs, setInputs] = useState({ distType: '', ex: '', vx: '', pmfK: '' });
  const [feedback, setFeedback] = useState<Record<string, boolean | null>>({});
  const [sliderK, setSliderK] = useState(0);
  const [examSelected, setExamSelected] = useState<number | null>(null);
  const [examOptions, setExamOptions] = useState<number[]>([]);
  const [examResult, setExamResult] = useState<0 | 1 | -1>(0);
  const [examQIdx, setExamQIdx] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const start = useCallback((lvl: number) => {
    setLevel(lvl);
    setStep(1);
    setInputs({ distType: '', ex: '', vx: '', pmfK: '' });
    setFeedback({});
    setSliderK(0);
    setExamSelected(null);
    setExamResult(0);
    const s = generateScenario(lvl);
    setData(s);

    if (lvl === 5) {
      const ex = s.distType === 'binomial' ? r2(s.n! * s.p!) : r2(s.lambda!);
      const opts = new Set([ex]);
      while (opts.size < 4) {
        opts.add(r2(Math.max(0.1, ex + (Math.round((Math.random() * 4 - 2) * 10) / 10))));
      }
      setExamOptions([...opts].sort(() => Math.random() - 0.5));
    }
  }, []);

  useEffect(() => { start(1); }, [start]);

  // ── Canvas: PMF bar chart ─────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = resolveVar('--canvas-bg');
    ctx.fillRect(0, 0, W, H);

    const barColor = resolveVar('--canvas-line');
    const highlightColor = resolveVar('--accent-success');
    const textColor = resolveVar('--canvas-text-dim');
    const axisColor = resolveVar('--canvas-grid');

    const padL = 60, padR = 20, padT = 30, padB = 50;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    // compute PMF values
    let probs: number[];
    let maxK: number;

    if (data.distType === 'binomial') {
      maxK = data.n!;
      probs = Array.from({ length: maxK + 1 }, (_, k) => binomPMF(data.n!, k, data.p!));
    } else {
      maxK = Math.ceil(data.lambda! * 3);
      probs = Array.from({ length: maxK + 1 }, (_, k) => poissonPMF(data.lambda!, k));
    }

    const maxProb = Math.max(...probs);

    // draw axes
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, H - padB);
    ctx.lineTo(W - padR, H - padB);
    ctx.stroke();

    // draw bars
    const barW = Math.min(chartW / probs.length - 2, 40);
    probs.forEach((prob, k) => {
      const barH = (prob / maxProb) * chartH;
      const x = padL + (k / probs.length) * chartW + (chartW / probs.length - barW) / 2;
      const y = H - padB - barH;

      ctx.fillStyle = k === sliderK ? highlightColor : barColor;
      ctx.beginPath();
      const rad = 4;
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + barW - rad, y);
      ctx.arcTo(x + barW, y, x + barW, y + rad, rad);
      ctx.lineTo(x + barW, H - padB);
      ctx.lineTo(x, H - padB);
      ctx.lineTo(x, y + rad);
      ctx.arcTo(x, y, x + rad, y, rad);
      ctx.closePath();
      ctx.fill();

      // k label
      ctx.fillStyle = textColor;
      ctx.font = '10px Heebo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(k), x + barW / 2, H - padB + 14);

      // prob label on highlighted bar
      if (k === sliderK) {
        ctx.fillStyle = highlightColor;
        ctx.font = 'bold 11px Heebo, sans-serif';
        ctx.fillText(`P(X=${k})=${prob}`, x + barW / 2, y - 8);
      }
    });

    // y-axis label
    ctx.save();
    ctx.translate(16, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = textColor;
    ctx.font = '10px Heebo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('P(X=k)', 0, 0);
    ctx.restore();

    ctx.fillStyle = textColor;
    ctx.font = '11px Heebo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('k', W / 2, H - 8);
  }, [data, isDark, sliderK, step, resolveVar]);

  if (!data) return null;

  const ex = data.distType === 'binomial' ? r2(data.n! * data.p!) : r2(data.lambda!);
  const vx = data.distType === 'binomial' ? r2(data.n! * data.p! * (1 - data.p!)) : r2(data.lambda!);
  const maxKSlider = data.distType === 'binomial' ? data.n! : Math.ceil(data.lambda! * 3);

  function check(key: string, expected: number, inputVal: string, next: number) {
    const val = parseFloat(inputVal);
    const ok = Math.abs(val - expected) < 0.05;
    setFeedback(f => ({ ...f, [key]: ok }));
    if (ok) {
      setStep(next);
      if (next > 3 && level <= 4) completeStage('discrete', level);
    }
  }

  const LEVELS = [
    { id: 1, label: 'זיהוי התפלגות' },
    { id: 2, label: 'תוחלת E(X)' },
    { id: 3, label: 'שונות V(X)' },
    { id: 4, label: 'PMF — סימולטור' },
    { id: 5, label: 'סימולציית בחינה' },
  ];

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-700 bg-ono-50 text-slate-900 dark:bg-night-bg dark:text-slate-50" dir="rtl">

      {/* ── Nav ── */}
      <nav className="focus-hide fixed top-0 w-full z-50 border-b backdrop-blur-xl transition-all bg-white/40 border-ono-200/50 dark:bg-night-nav/80 dark:border-night-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              <ArrowRight size={16} /> לוח בקרה
            </button>
            <span className="opacity-20">|</span>
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-ono-500" />
              <span className="font-black text-sm">התפלגויות בדידות</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-ono-100 text-ono-700 dark:bg-night-card2 dark:text-ono-400">
              {topics.discrete.topicReadiness}% מוכנות
            </span>
            <ThemeSelector />
          </div>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row gap-0 pt-16 min-h-screen">
        {/* ── Sidebar ── */}
        <aside className="focus-hide w-full lg:w-72 shrink-0 p-4 flex flex-col gap-4 border-b lg:border-b-0 lg:border-l transition-colors lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto order-2 lg:order-none bg-white/50 border-ono-200/50 dark:bg-night-nav/50 dark:border-night-border">

          <ExplainerPanel
            title="התפלגויות בדידות"
            summary="שתי התפלגויות מרכזיות: בינומי לניסיונות עצמאיים עם הצלחה/כישלון, פואסון למניית אירועים בזמן."
            formulas={[
              { label: 'E(X) בינומי', formula: 'E(X) = n·p' },
              { label: 'V(X) בינומי', formula: 'V(X) = n·p·(1-p)' },
              { label: 'E=V פואסון', formula: 'E(X) = V(X) = λ' },
              { label: 'P(X=k) בינומי', formula: 'C(n,k)·pᵏ·(1-p)ⁿ⁻ᵏ' },
            ]}
            tips={[
              'בינומי: n וp קבועים, ניסיונות עצמאיים',
              'פואסון: קצב λ קבוע, אין n מוגדר',
              'עוצמת הסימטריה — ככל שp קרוב ל-0.5 כן יותר סימטרי',
            ]}
          />

          <div className="p-4 rounded-[1.5rem] border backdrop-blur-xl bg-white/40 border-slate-200 dark:bg-night-card/40 dark:border-night-border">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <BarChart2 size={13} /> מסלול הכשרה
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
                topic="discrete"
                level={step}
                moduleName="התפלגויות בדידות"
                renderedData={data ? { ...data } : {}}
              />
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="focus-center flex-1 p-4 md:p-8 flex flex-col gap-6 max-w-4xl order-1 lg:order-none">

          {/* Scenario card */}
          <div className="relative p-6 rounded-[2rem] border overflow-hidden bg-white/40 border-ono-200/60 dark:bg-night-card/40 dark:border-night-border backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-ono-600/5 rounded-bl-[4rem]" />
            <p className="text-[10px] font-black text-ono-500 dark:text-ono-400 uppercase tracking-widest mb-2">תרחיש אקדמי</p>
            <h3 className="text-xl font-bold leading-relaxed mb-2">{data.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{data.description}</p>
            <div className="flex gap-3 flex-wrap" dir="ltr">
              {data.distType === 'binomial' ? (
                <>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-night-card2 border border-slate-200 dark:border-night-border text-sm font-mono font-bold text-slate-600 dark:text-slate-400">n = {data.n}</span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-night-card2 border border-slate-200 dark:border-night-border text-sm font-mono font-bold text-slate-600 dark:text-slate-400">p = {data.p}</span>
                </>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-night-card2 border border-slate-200 dark:border-night-border text-sm font-mono font-bold text-slate-600 dark:text-slate-400">λ = {data.lambda}</span>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 py-2.5 px-4 bg-ono-50 dark:bg-ono-900/20 border border-ono-200 dark:border-ono-800/40 rounded-2xl w-fit">
              <HelpCircle size={14} className="text-ono-600 dark:text-ono-400" />
              <span className="font-bold text-ono-700 dark:text-ono-300 text-xs">
                {level === 1 ? 'זהו: בינומי או פואסון?' : level === 2 ? 'חשב E(X)' : level === 3 ? 'חשב V(X)' : level === 4 ? 'שחק עם הסימולטור' : 'שאלת בחינה'}
              </span>
            </div>
            <button onClick={() => start(level)} className="absolute top-4 left-4 p-2 rounded-xl opacity-40 hover:opacity-80 transition-opacity">
              <RotateCcw size={16} />
            </button>
          </div>

          {step >= 2 && <WhyBridge topic="discrete" />}

          {/* Canvas: PMF bar chart */}
          <div className="p-4 rounded-[2rem] border backdrop-blur-xl min-h-[250px] flex items-center bg-white/40 border-ono-200/60 dark:bg-night-card/40 dark:border-night-border">
            <canvas ref={canvasRef} width={900} height={260} className="w-full h-auto rounded-2xl canvas-glow" />
            {(level === 4 || step >= 2) && (
              <div className="mt-4 px-2">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 text-center">הזזת k לראיית P(X=k)</p>
                <input
                  type="range" min={0} max={maxKSlider} step={1} value={sliderK}
                  onChange={e => setSliderK(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-ono-200 dark:bg-night-muted"
                />
                <p className="text-center mt-2 font-mono text-sm font-bold text-ono-600 dark:text-ono-400">
                  P(X={sliderK}) = {data.distType === 'binomial' ? binomPMF(data.n!, sliderK, data.p!) : poissonPMF(data.lambda!, sliderK)}
                </p>
              </div>
            )}
          </div>

          {/* Level 1–3: Step cards */}
          {level <= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Step 1: identify dist type */}
              <div className={`p-5 rounded-[1.5rem] border-2 transition-all ${step === 1 ? 'border-ono-600 bg-white dark:bg-night-card shadow-ono' : step > 1 ? 'border-ono-200 dark:border-night-border bg-ono-50/50 dark:bg-night-card2/30' : 'opacity-40 pointer-events-none grayscale'}`}>
                <p className="text-[10px] font-black text-ono-600 dark:text-ono-400 uppercase tracking-widest mb-3">01. סוג התפלגות</p>
                <p className="text-sm mb-4">האם זו התפלגות <strong>בינומית</strong> (n, p) או <strong>פואסון</strong> (λ)?</p>
                <div className="flex gap-3">
                  {(['binomial', 'poisson'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => {
                        setInputs(i => ({ ...i, distType: t }));
                        if (t === data.distType) {
                          setFeedback(f => ({ ...f, dist: true }));
                          setStep(2);
                        } else {
                          setFeedback(f => ({ ...f, dist: false }));
                        }
                      }}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${inputs.distType === t ? t === data.distType ? 'bg-ono-600 text-white border-ono-600' : 'bg-red-100 text-red-700 border-red-400' : 'border-ono-200 dark:border-night-border hover:bg-ono-50 dark:hover:bg-night-card2'}`}
                    >
                      {t === 'binomial' ? 'בינומי' : 'פואסון'}
                    </button>
                  ))}
                </div>
                {feedback.dist === false && <p className="text-red-500 text-xs text-center mt-2">שגוי — בדוק שוב את מאפייני הנתונים</p>}
              </div>

              {/* Step 2: E(X) */}
              <div className={`p-5 rounded-[1.5rem] border-2 transition-all ${step === 2 ? 'border-ono-500 bg-white dark:bg-night-card shadow-ono' : step > 2 ? 'border-ono-200 dark:border-night-border bg-ono-50/50 dark:bg-night-card2/30' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <p className="text-[10px] font-black text-ono-600 dark:text-ono-400 uppercase tracking-widest mb-3">02. תוחלת E(X)</p>
                <div className="font-mono text-xs bg-slate-50 dark:bg-night-muted rounded-xl px-3 py-2 mb-3 text-center" dir="ltr">
                  {data.distType === 'binomial' ? `E(X) = n·p = ${data.n}·${data.p}` : `E(X) = λ = ${data.lambda}`}
                </div>
                <div className="flex flex-col gap-2" dir="ltr">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-ono-600">E(X) =</span>
                    <input
                      type="number" step="0.01" value={inputs.ex}
                      onChange={e => setInputs(i => ({ ...i, ex: e.target.value }))}
                      className="w-24 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center font-bold border outline-none"
                    />
                  </div>
                  <button onClick={() => check('ex', ex, inputs.ex, 3)} className="w-full bg-ono-600 hover:bg-ono-700 text-white py-2 rounded-xl font-bold text-sm">אמת</button>
                  {feedback.ex === false && <p className="text-red-500 text-xs text-center">שגוי — E(X) = {ex}</p>}
                </div>
              </div>

              {/* Step 3: V(X) */}
              {step >= 3 && (
                <div className="md:col-span-2 p-5 rounded-[1.5rem] border-2 border-ono-400 bg-white dark:bg-night-card shadow-ono fade-in">
                  <p className="text-[10px] font-black text-ono-600 dark:text-ono-400 uppercase tracking-widest mb-3">03. שונות V(X)</p>
                  <div className="font-mono text-xs bg-slate-50 dark:bg-night-muted rounded-xl px-3 py-2 mb-3 text-center" dir="ltr">
                    {data.distType === 'binomial'
                      ? `V(X) = n·p·(1-p) = ${data.n}·${data.p}·${r2(1 - data.p!)}`
                      : `V(X) = λ = ${data.lambda}`}
                  </div>
                  <div className="flex flex-col gap-2" dir="ltr">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ono-600">V(X) =</span>
                      <input
                        type="number" step="0.01" value={inputs.vx}
                        onChange={e => setInputs(i => ({ ...i, vx: e.target.value }))}
                        className="w-24 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center font-bold border outline-none"
                      />
                    </div>
                    <button onClick={() => check('vx', vx, inputs.vx, 99)} className="w-full bg-ono-600 hover:bg-ono-700 text-white py-2 rounded-xl font-bold text-sm">בדוק תוצאה</button>
                    {feedback.vx === false && <p className="text-red-500 text-xs text-center">שגוי — V(X) = {vx}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Level 4: PMF explorer */}
          {level === 4 && (
            <div className="p-6 rounded-[2rem] border fade-in bg-white/40 border-ono-200/60 dark:bg-night-card/40 dark:border-night-border">
              <h3 className="text-lg font-black mb-2">סימולטור PMF</h3>
              <p className="text-sm text-slate-500 mb-4">הזיזו את הסליידר למעלה ובדקו ערכי P(X=k). חשבו את E(X) ו-V(X).</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-night-card2 border border-slate-200 dark:border-night-border">
                  <p className="text-xs font-bold opacity-50 mb-1">E(X)</p>
                  <p className="text-2xl font-black text-ono-600 dark:text-ono-400">{ex}</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-night-card2 border border-slate-200 dark:border-night-border">
                  <p className="text-xs font-bold opacity-50 mb-1">V(X)</p>
                  <p className="text-2xl font-black text-ono-600 dark:text-ono-400">{vx}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2" dir="ltr">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ono-600 text-sm">P(X={sliderK}) =</span>
                  <input
                    type="number" step="0.01" value={inputs.pmfK}
                    onChange={e => setInputs(i => ({ ...i, pmfK: e.target.value }))}
                    className="w-24 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center font-bold border outline-none"
                  />
                </div>
                <button
                  onClick={() => {
                    const expected = data.distType === 'binomial' ? binomPMF(data.n!, sliderK, data.p!) : poissonPMF(data.lambda!, sliderK);
                    const ok = Math.abs(parseFloat(inputs.pmfK) - expected) < 0.02;
                    setFeedback(f => ({ ...f, pmf: ok }));
                    if (ok) { setStep(99); completeStage('discrete', 4); }
                  }}
                  className="w-full bg-ono-600 hover:bg-ono-700 text-white py-2.5 rounded-xl font-bold"
                >אמת P(X={sliderK})</button>
                {feedback.pmf === false && <p className="text-red-500 text-xs text-center">שגוי — נסה שוב</p>}
                {step === 99 && (
                  <div className="mt-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 rounded-2xl text-center fade-in">
                    <span className="font-black text-ono-700 dark:text-ono-300">מעולה! 🎉</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Level 5: exam */}
          {level === 5 && (() => {
            const q = DISCRETE_EXAM_QUESTIONS[examQIdx % DISCRETE_EXAM_QUESTIONS.length];
            return (
              <section className="bg-slate-900 text-white p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl fade-in">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-black text-ono-300">בחינה מסכמת — שאלות אמיתיות</h2>
                  <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">שאלה {examQIdx % DISCRETE_EXAM_QUESTIONS.length + 1}/{DISCRETE_EXAM_QUESTIONS.length}</span>
                </div>
                <ConceptCard
                  title="בינומי vs פואסון"
                  intuition="בינומי: n ניסויים, כל אחד עם הצלחה p. פואסון: מספר אירועים בזמן/מרחב עם ממוצע λ."
                  formula="Binomial: E=np, V=np(1−p)  |  Poisson: E=V=λ"
                  tip="פואסון: V=E=λ (שניהם שווים!). בינומי: V<E תמיד"
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
                      if (examSelected === q.correct) { setExamResult(1); completeStage('discrete', 5); }
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
                  <h3 className="font-bold text-ono-800 dark:text-ono-300">מצוין! E(X)={ex}, V(X)={vx}</h3>
                  <p className="text-xs text-ono-600 dark:text-ono-400">גרף ה-PMF מוצג</p>
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
