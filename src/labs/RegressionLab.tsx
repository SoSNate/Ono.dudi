import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, Target,
  TrendingUp, GraduationCap, LineChart, ArrowRight
} from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { NotesPanel } from '../components/NotesPanel';
import { ExplainerPanel } from '../components/ExplainerPanel';
import ConceptCard from '../components/ConceptCard';
import { WhyBridge } from '../components/WhyBridge';
import { ThemeSelector } from '../components/ThemeSelector';
import { useTheme } from '../context/ThemeContext';
import { MathFraction } from '../utils/mathHelpers';

const REGRESSION_EXAM_QUESTIONS = [
  {
    question: 'חברה בדקה שעות תרגול (X) מול ציון (Y): (1,5),(3,6),(2,4),(5,8),(4,7). מהו מתאם פירסון?',
    options: ['0.98', '0.74', '0.85', '0.50'],
    correct: 0,
    explanation: 'r = Σ(xᵢ−x̄)(yᵢ−ȳ) / √[Σ(xᵢ−x̄)² · Σ(yᵢ−ȳ)²]. x̄=3, ȳ=6. r ≈ 0.98 — מתאם חיובי חזק מאוד.',
  },
  {
    question: 'אותם נתונים: (1,5),(3,6),(2,4),(5,8),(4,7). מהו השיפוע של קו הרגרסיה?',
    options: ['0.9', '0.85', '0.74', '0.5'],
    correct: 0,
    explanation: 'b = Σ(xᵢ−x̄)(yᵢ−ȳ) / Σ(xᵢ−x̄)² = 9/10 = 0.9',
  },
  {
    question: 'אם b=0.9 ו-a=3.3, נבא את הציון לעובד שהתאמן 6 שעות.',
    options: ['8.7', '7.3', '8.1', '9.2'],
    correct: 0,
    explanation: 'ŷ = 3.3 + 0.9×6 = 3.3 + 5.4 = 8.7',
  },
];

interface LabProps {
  onBack: () => void;
}

interface DataPoint { x: number; y: number; }
interface ScenarioData {
  name: string;
  points: DataPoint[];
  meanX: number;
  meanY: number;
  slope: number;
  intercept: number;
  examTargetX: number;
  examTargetY: number;
}

export function RegressionLab({ onBack }: LabProps) {
  const { resolveVar, isDark } = useTheme();
  const { completeStage } = useProgressStore();

  const [level, setLevel] = useState(1);
  const [data, setData] = useState<ScenarioData | null>(null);
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState({ meanX: '', meanY: '', slope: '', intercept: '' });
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [liveX, setLiveX] = useState(5);
  const [examProgress, setExamProgress] = useState(0);
  const [examOptions, setExamOptions] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [examQIdx, setExamQIdx] = useState(0);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateScenario = (lvl: number) => {
    const baseSlope = parseFloat((Math.random() * 1.5 + 0.5).toFixed(2));
    const baseIntercept = Math.floor(Math.random() * 5);
    let points: DataPoint[] = [];
    let sumX = 0, sumY = 0;

    for (let i = 0; i < 6; i++) {
      const x = i * 2 + Math.floor(Math.random() * 3);
      const noise = Math.random() * 2 - 1;
      const y = parseFloat((x * baseSlope + baseIntercept + noise).toFixed(1));
      points.push({ x, y });
      sumX += x; sumY += y;
    }

    const meanX = parseFloat((sumX / points.length).toFixed(2));
    const meanY = parseFloat((sumY / points.length).toFixed(2));
    let num = 0, den = 0;
    points.forEach((p) => { num += (p.x - meanX) * (p.y - meanY); den += Math.pow(p.x - meanX, 2); });

    const slope = parseFloat((num / den).toFixed(2));
    const intercept = parseFloat((meanY - slope * meanX).toFixed(2));
    const examTargetX = Math.floor(Math.random() * 5) + 6;
    const examTargetY = parseFloat((slope * examTargetX + intercept).toFixed(2));

    const options = [
      examTargetY,
      parseFloat((examTargetY + 1.2).toFixed(2)),
      parseFloat((examTargetY - 0.8).toFixed(2)),
      parseFloat((slope * (examTargetX - 1) + intercept).toFixed(2)),
    ].sort(() => Math.random() - 0.5);

    setData({ name: 'השפעת שעות הדרכה על ביצועי עובדים', points, meanX, meanY, slope, intercept, examTargetX, examTargetY });
    setExamOptions(options);
    setLiveX(meanX);
    setStep(1);
    setExamProgress(0);
    setSelectedOption(null);
    setInputs({ meanX: '', meanY: '', slope: '', intercept: '' });
    setFeedback({});
  };

  useEffect(() => generateScenario(level), [level]);

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const { width: W, height: H } = canvasRef.current;
    ctx.clearRect(0, 0, W, H);

    const pad = 40;
    const maxX = Math.max(...data.points.map((p) => p.x)) + 2;
    const maxY = Math.max(...data.points.map((p) => p.y)) + 5;
    const sX = (val: number) => pad + (val / maxX) * (W - pad * 2);
    const sY = (val: number) => H - pad - (val / maxY) * (H - pad * 2);

    const colorPrimary = resolveVar('--canvas-line');
    const colorAxis = resolveVar('--canvas-axis');
    const colorGrid = resolveVar('--canvas-grid');

    ctx.strokeStyle = colorGrid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= maxX; i += 2) { ctx.beginPath(); ctx.moveTo(sX(i), pad); ctx.lineTo(sX(i), H - pad); ctx.stroke(); }
    for (let i = 0; i <= maxY; i += 2) { ctx.beginPath(); ctx.moveTo(pad, sY(i)); ctx.lineTo(W - pad, sY(i)); ctx.stroke(); }

    ctx.strokeStyle = colorAxis; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();

    data.points.forEach((p) => {
      ctx.fillStyle = colorPrimary;
      ctx.beginPath(); ctx.arc(sX(p.x), sY(p.y), 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(52,211,153,0.3)' : 'rgba(16,185,129,0.3)';
      ctx.lineWidth = 4; ctx.stroke();
    });

    if (step >= 2) {
      ctx.strokeStyle = resolveVar('--canvas-grid');
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(sX(data.meanX), H - pad); ctx.lineTo(sX(data.meanX), pad);
      ctx.moveTo(pad, sY(data.meanY)); ctx.lineTo(W - pad, sY(data.meanY));
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(sX(data.meanX), sY(data.meanY), 7, 0, Math.PI * 2); ctx.fill();
    }

    if (step >= 3) {
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sX(0), sY(data.intercept));
      ctx.lineTo(sX(maxX), sY(data.slope * maxX + data.intercept));
      ctx.stroke();
    }

    if (level === 4) {
      const pY = data.slope * liveX + data.intercept;
      ctx.strokeStyle = '#f59e0b'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sX(liveX), H - pad); ctx.lineTo(sX(liveX), sY(pY)); ctx.lineTo(pad, sY(pY));
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(sX(liveX), sY(pY), 6, 0, Math.PI * 2); ctx.fill();
    }
  }, [data, isDark, step, liveX, level, resolveVar]);

  const checkValues = (type: string) => {
    if (!data) return;
    let isCorrect = false;
    if (type === 'means') isCorrect = Math.abs(parseFloat(inputs.meanX) - data.meanX) < 0.2 && Math.abs(parseFloat(inputs.meanY) - data.meanY) < 0.2;
    if (type === 'slope') isCorrect = Math.abs(parseFloat(inputs.slope) - data.slope) < 0.1;
    if (type === 'intercept') isCorrect = Math.abs(parseFloat(inputs.intercept) - data.intercept) < 0.5;

    setFeedback({ ...feedback, [type]: isCorrect });
    if (!isCorrect) setAttempts((prev) => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
    if (isCorrect) {
      const completedStage = level <= 3 ? step : level;
      setStep((prev) => prev + 1);
      completeStage('regression', completedStage);
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-700 bg-ono-50 text-slate-900 dark:bg-night-bg dark:text-slate-50" dir="rtl">
      <nav className="focus-hide fixed top-0 w-full z-50 border-b backdrop-blur-xl transition-all duration-500 h-16 bg-white/50 border-slate-200/60 dark:bg-night-nav/70 dark:border-night-border">
        <div className="max-w-7xl mx-auto h-full flex justify-between items-center px-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              <ArrowRight size={16} /> לוח בקרה
            </button>
            <span className="opacity-20">|</span>
            <div className="flex items-center gap-3">
              <div className="bg-ono-600 p-2 rounded-xl text-white shadow-ono"><LineChart size={16} /></div>
              <div>
                <h1 className="text-sm font-black tracking-tight">Ono Analytics Lab</h1>
                <p className="text-[9px] font-black text-ono-500 dark:text-ono-400 uppercase tracking-widest leading-none">רגרסיה לינארית</p>
              </div>
            </div>
          </div>
          <ThemeSelector />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-8 pt-24">
        <aside className="focus-hide lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto order-2 lg:order-none">
          <ExplainerPanel
            title="רגרסיה לינארית"
            summary="מוצאים קו מגמה ŷ = a + b·x שמסביר את הקשר בין X ל-Y. סדר חישוב קבוע: ממוצעים ← מתאם Pearson ← שיפוע b ← חותך a ← חיזוי."
            formulas={[
              { label: 'משוואה', formula: 'ŷ = a + b·x' },
              { label: 'שיפוע', formula: 'b = [Σxy − n·X̄·Ȳ] / [Σx² − n·X̄²]' },
              { label: 'חותך', formula: 'a = Ȳ − b·X̄' },
              { label: 'מתאם Pearson', formula: 'r = b · (Sx / Sy)' },
              { label: 'חיזוי', formula: 'ŷ = a + b·x₀' },
            ]}
            tips={[
              'סדר בלתי ניתן לשינוי: X̄,Ȳ → b → a',
              'אל תעגלו תוצאות ביניים — גורם לשגיאות',
              '|r| > 0.7 = קשר חזק | 0.4–0.7 = בינוני | < 0.4 = חלש',
              'b > 0 = קשר חיובי, b < 0 = קשר שלילי',
            ]}
          />
          <div className="bg-white/40 dark:bg-night-card/40 backdrop-blur-xl p-5 rounded-[1.5rem] border border-slate-200 dark:border-night-border">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp size={16} /> תהליך בניית המודל
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { id: 1, label: 'מרכז הכובד (X̄, Ȳ)' },
                { id: 2, label: 'מציאת שיפוע הישר (b)' },
                { id: 3, label: 'נקודת החיתוך (a)' },
                { id: 4, label: 'מנוע הניבוי האנליטי' },
                { id: 5, label: 'סימולציית בחינה' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setLevel(lvl.id)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 text-right ${level === lvl.id ? 'bg-ono-600 dark:bg-ono-700/70 text-white font-bold border border-ono-700 dark:border-ono-600/40' : level > lvl.id ? 'bg-slate-50 dark:bg-night-card2 border border-slate-200 dark:border-night-border text-slate-500 dark:text-slate-400 font-medium' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-night-muted/40'}`}
                >
                  <span className="text-sm">{lvl.id}. {lvl.label}</span>
                  {level > lvl.id ? <CheckCircle2 size={18} className="text-emerald-500" /> : lvl.id === 5 ? <GraduationCap size={18} /> : <Target size={18} className="opacity-50" />}
                </button>
              ))}
            </div>
          </div>

          {data && level < 5 && (
            <div className="bg-white/40 dark:bg-night-card/40 backdrop-blur-xl p-5 rounded-[1.5rem] border border-slate-200 dark:border-night-border">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">תצפיות (מדגם)</h2>
              <div className="overflow-hidden border border-slate-100 dark:border-night-border rounded-xl bg-slate-50 dark:bg-night-card/50">
                <table className="w-full text-center text-sm font-mono" dir="ltr">
                  <thead className="bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <tr><th className="p-2 border-b dark:border-night-border">X (שעות)</th><th className="p-2 border-b dark:border-night-border">Y (ציון)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.points.map((p, i) => (
                      <tr key={i} className="hover:bg-ono-50 dark:hover:bg-ono-900/30 transition-colors">
                        <td className="p-2 font-bold text-slate-800 dark:text-slate-200">{p.x}</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">{p.y}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-2">
            <NotesPanel
                topic="regression"
                level={step}
                moduleName="רגרסיה לינארית"
                renderedData={data ? { ...data } : {}}
              />
          </div>
        </aside>

        <main className="focus-center lg:col-span-8 flex flex-col gap-6 order-1 lg:order-none">
          {data && level <= 4 && (
            <div className="bg-white/40 dark:bg-night-card/40 backdrop-blur-xl p-4 md:p-8 rounded-[2rem] border border-slate-200 dark:border-night-border shadow-glass relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ono-600/5 rounded-bl-[5rem] pointer-events-none" />
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2 relative z-10">{data.name}</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm relative z-10">
                המערכת הגרילה <span className="font-bold text-ono-600 dark:text-ono-400">{data.points.length} תצפיות</span>. נשתמש בנתונים לבניית מודל הרגרסיה.
              </p>
              {step >= 2 && <div className="relative z-10 mt-4"><WhyBridge topic="regression" /></div>}
              <div className="mt-6 bg-slate-50 dark:bg-night-card2 rounded-xl border border-slate-200 dark:border-night-border p-2 shadow-inner min-h-[250px] flex items-center">
                <canvas ref={canvasRef} width={900} height={320} className="w-full h-auto canvas-glow" />
              </div>
            </div>
          )}

          {level <= 3 && data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${step >= 1 ? 'border-ono-500 bg-white dark:bg-night-card shadow-ono' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50'}`}>
                <p className="font-bold text-ono-600 dark:text-ono-400 text-sm mb-4">1. מרכז הכובד</p>
                <div className="flex flex-col gap-4" dir="ltr">
                  <div className="inline-flex items-center gap-2"><span className="text-xl font-bold text-slate-800 dark:text-slate-200 font-serif italic">X̄ = </span><MathFraction top={<input type="number" value={inputs.meanX} onChange={(e) => setInputs({ ...inputs, meanX: e.target.value })} className="w-16 bg-slate-100 dark:bg-slate-800 text-center rounded outline-none focus:ring-1 ring-ono-500" />} bottom="N" /></div>
                  <div className="inline-flex items-center gap-2"><span className="text-xl font-bold text-slate-800 dark:text-slate-200 font-serif italic">Ȳ = </span><MathFraction top={<input type="number" value={inputs.meanY} onChange={(e) => setInputs({ ...inputs, meanY: e.target.value })} className="w-16 bg-slate-100 dark:bg-slate-800 text-center rounded outline-none focus:ring-1 ring-ono-500" />} bottom="N" /></div>
                  {step === 1 && <button onClick={() => checkValues('means')} className="mt-2 bg-ono-600 hover:bg-ono-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">אמת תוצאות</button>}
                  {feedback.means === false && (attempts.means || 0) >= 2 && data && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg" dir="rtl">
                      💡 X̄ = {data.meanX}, Ȳ = {data.meanY}
                    </p>
                  )}
                </div>
              </div>

              <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${step >= 2 ? 'border-ono-400 bg-white dark:bg-night-card shadow-ono' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50'}`}>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-4">2. שיפוע הישר (b)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4" dir="ltr">Cov(X,Y) / Var(X)</p>
                <div className="flex flex-col gap-4" dir="ltr">
                  <div className="inline-flex items-center gap-2"><span className="text-xl font-bold text-slate-800 dark:text-slate-200 font-serif italic">b = </span><MathFraction top={<input type="number" value={inputs.slope} onChange={(e) => setInputs({ ...inputs, slope: e.target.value })} className="w-20 bg-slate-100 dark:bg-slate-800 text-center rounded outline-none focus:ring-1 ring-emerald-500" />} bottom="1" /></div>
                  {step === 2 && <button onClick={() => checkValues('slope')} className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">הצב שיפוע</button>}
                  {feedback.slope === false && (attempts.slope || 0) >= 2 && data && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg" dir="rtl">
                      💡 b = Σ(xᵢ−x̄)(yᵢ−ȳ) / Σ(xᵢ−x̄)² = {data.slope}
                    </p>
                  )}
                </div>
              </div>

              <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${step >= 3 ? 'border-ono-600 bg-white dark:bg-night-card shadow-ono' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50'}`}>
                <p className="font-bold text-ono-600 dark:text-ono-400 text-sm mb-4">3. נקודת חיתוך (a)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-mono" dir="ltr">a = Ȳ - b × X̄</p>
                <div className="flex flex-col gap-4" dir="ltr">
                  <div className="inline-flex items-center gap-2"><span className="text-xl font-bold text-slate-800 dark:text-slate-200 font-serif italic">a = </span><MathFraction top={<input type="number" value={inputs.intercept} onChange={(e) => setInputs({ ...inputs, intercept: e.target.value })} className="w-20 bg-slate-100 dark:bg-slate-800 text-center rounded outline-none focus:ring-1 ring-ono-500" />} bottom="1" /></div>
                  {step === 3 && <button onClick={() => checkValues('intercept')} className="mt-2 bg-ono-600 hover:bg-ono-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">סיים בניית מודל</button>}
                  {feedback.intercept === false && (attempts.intercept || 0) >= 2 && data && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg" dir="rtl">
                      💡 a = Ȳ − b×X̄ = {data.meanY} − {data.slope}×{data.meanX} = {data.intercept}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {level === 4 && data && (
            <div className="p-8 rounded-[2rem] border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 dark:border-amber-600/50 shadow-lg fade-in">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-amber-700 dark:text-amber-400 text-lg">
                סימולטור ניבוי אנליטי
              </h4>
              <p className="mb-8 text-slate-700 dark:text-slate-300">
                משוואת המודל: <span className="font-mono bg-white dark:bg-night-card2 px-2 py-1 rounded shadow-sm" dir="ltr">Y = {data.slope}X + {data.intercept}</span>
              </p>
              <input
                type="range" min="0" max="15" step="0.5" value={liveX}
                onChange={(e) => { setLiveX(parseFloat(e.target.value)); completeStage('regression', 4); }}
                className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500 shadow-inner mb-8"
              />
              <div className="flex justify-center items-center gap-6 text-2xl font-serif text-center" dir="ltr">
                <div className="flex flex-col items-center bg-white dark:bg-night-card p-4 rounded-2xl shadow-sm min-w-[100px]">
                  <span className="text-xs font-sans font-bold text-slate-400 mb-1 uppercase">Input (X)</span>
                  <span className="font-bold text-slate-800 dark:text-white">{liveX.toFixed(1)}</span>
                </div>
                <span className="text-amber-500">➔</span>
                <div className="flex flex-col items-center bg-amber-100 dark:bg-amber-900/40 p-4 rounded-2xl shadow-sm border border-amber-200 dark:border-amber-700 min-w-[140px]">
                  <span className="text-xs font-sans font-bold text-amber-700 dark:text-amber-400 mb-1 uppercase">Prediction (Ŷ)</span>
                  <span className="font-bold text-amber-600 dark:text-amber-300">{(data.slope * liveX + data.intercept).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {level === 5 && (() => {
            const q = REGRESSION_EXAM_QUESTIONS[examQIdx % REGRESSION_EXAM_QUESTIONS.length];
            return (
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-800 fade-in">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-black text-ono-300">בחינה מסכמת — שאלות אמיתיות</h2>
                  <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">שאלה {examQIdx % REGRESSION_EXAM_QUESTIONS.length + 1}/{REGRESSION_EXAM_QUESTIONS.length}</span>
                </div>
                <ConceptCard
                  title="רגרסיה לינארית — הרעיון"
                  intuition="קו שממזער את סכום ריבועי השגיאות. השיפוע b אומר: 'כשX עולה ב-1, Y עולה בממוצע ב-b'."
                  formula="b = Σ(xᵢ−x̄)(yᵢ−ȳ)/Σ(xᵢ−x̄)²  |  a = ȳ−b·x̄  |  ŷ = a+bx"
                  tip="r קרוב ל-±1 = קשר חזק. b>0 = חיובי, b<0 = שלילי"
                />
                <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-3xl text-right space-y-4">
                  <p className="text-base font-medium leading-relaxed">{q.question}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {q.options.map((opt, i) => (
                      <button key={i} onClick={() => { if (examProgress === 0) setSelectedOption(i); }}
                        className={`p-4 rounded-2xl border-2 font-medium text-right transition-all ${
                          examProgress !== 0
                            ? i === q.correct ? 'border-emerald-500 bg-emerald-900/50 text-emerald-300'
                              : selectedOption === i && i !== q.correct ? 'border-red-500 bg-red-900/30 text-red-300'
                              : 'border-slate-600 text-slate-500 opacity-40'
                            : selectedOption === i ? 'border-ono-500 bg-ono-600/30 text-white'
                            : 'border-slate-600 bg-slate-900 hover:border-ono-400 text-slate-300'
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  {selectedOption !== null && examProgress === 0 && (
                    <button onClick={() => {
                      if (selectedOption === q.correct) { setExamProgress(1); completeStage('regression', 5); }
                      else setExamProgress(-1);
                    }} className="w-full bg-ono-600 hover:bg-ono-700 text-white py-4 rounded-2xl font-black text-lg transition-colors">
                      הגש תשובה
                    </button>
                  )}
                  {examProgress === 1 && (
                    <div className="space-y-3 fade-in">
                      <div className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl font-bold text-center">תשובה נכונה!</div>
                      <div className="bg-slate-700/60 border border-slate-600 text-slate-300 p-4 rounded-xl text-sm">{q.explanation}</div>
                      <button onClick={() => { setExamQIdx(i => i + 1); setSelectedOption(null); setExamProgress(0); }}
                        className="w-full bg-ono-600 hover:bg-ono-500 text-white py-3 rounded-2xl font-bold">שאלה הבאה ←</button>
                    </div>
                  )}
                  {examProgress === -1 && (
                    <div className="space-y-3 fade-in">
                      <div className="bg-red-900/50 border border-red-500/50 text-red-400 p-4 rounded-xl font-bold text-center">שגוי</div>
                      <div className="bg-slate-700/60 border border-slate-600 text-slate-300 p-4 rounded-xl text-sm">{q.explanation}</div>
                      <button onClick={() => { setSelectedOption(null); setExamProgress(0); }}
                        className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-2xl font-bold">נסה שוב</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </main>
      </div>
    </div>
  );
}
