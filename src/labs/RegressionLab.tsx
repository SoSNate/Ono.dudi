import React, { useState, useEffect, useRef } from 'react';
import {
  Moon, Sun, CheckCircle2, Target,
  TrendingUp, GraduationCap, LineChart, ArrowRight
} from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { NotesPanel } from '../components/NotesPanel';
import { ExplainerPanel } from '../components/ExplainerPanel';

interface LabProps {
  darkMode: boolean;
  onToggleDark: () => void;
  onBack: () => void;
}

const MathFraction = ({ numerator, denominator, leading }: { numerator: React.ReactNode; denominator: React.ReactNode; leading?: string }) => (
  <div className="inline-flex items-center gap-2 font-serif italic tracking-tight" dir="ltr">
    {leading && <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">{leading} = </span>}
    <div className="flex flex-col items-center justify-center leading-none">
      <span className="px-3 pb-1 border-b-2 border-slate-800 dark:border-slate-300 text-lg text-slate-900 dark:text-white font-bold">{numerator}</span>
      <span className="px-3 pt-1 text-lg text-slate-900 dark:text-white font-bold">{denominator}</span>
    </div>
  </div>
);

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

export function RegressionLab({ darkMode, onToggleDark, onBack }: LabProps) {
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

    const colorPrimary = darkMode ? '#818cf8' : '#3b82f6';
    const colorAxis = darkMode ? '#475569' : '#94a3b8';
    const colorGrid = darkMode ? '#1e293b' : '#f1f5f9';

    ctx.strokeStyle = colorGrid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= maxX; i += 2) { ctx.beginPath(); ctx.moveTo(sX(i), pad); ctx.lineTo(sX(i), H - pad); ctx.stroke(); }
    for (let i = 0; i <= maxY; i += 2) { ctx.beginPath(); ctx.moveTo(pad, sY(i)); ctx.lineTo(W - pad, sY(i)); ctx.stroke(); }

    ctx.strokeStyle = colorAxis; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();

    data.points.forEach((p) => {
      ctx.fillStyle = colorPrimary;
      ctx.beginPath(); ctx.arc(sX(p.x), sY(p.y), 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = darkMode ? 'rgba(129,140,248,0.3)' : 'rgba(59,130,246,0.3)';
      ctx.lineWidth = 4; ctx.stroke();
    });

    if (step >= 2) {
      ctx.strokeStyle = darkMode ? '#64748b' : '#cbd5e1';
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
  }, [data, darkMode, step, liveX, level]);

  const checkValues = (type: string) => {
    if (!data) return;
    let isCorrect = false;
    if (type === 'means') isCorrect = Math.abs(parseFloat(inputs.meanX) - data.meanX) < 0.2 && Math.abs(parseFloat(inputs.meanY) - data.meanY) < 0.2;
    if (type === 'slope') isCorrect = Math.abs(parseFloat(inputs.slope) - data.slope) < 0.1;
    if (type === 'intercept') isCorrect = Math.abs(parseFloat(inputs.intercept) - data.intercept) < 0.5;

    setFeedback({ ...feedback, [type]: isCorrect });
    if (isCorrect) {
      const completedStage = level <= 3 ? step : level;
      setStep((prev) => prev + 1);
      completeStage('regression', completedStage);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${darkMode ? 'dark bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`} dir="rtl">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
              <ArrowRight size={16} /> לוח בקרה
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600/10 dark:bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30">
                <LineChart className="text-indigo-600 dark:text-indigo-400" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold tracking-tight">המרכז לניתוח סטטיסטי</h1>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">רגרסיה ליניארית וניבוי</p>
              </div>
            </div>
          </div>
          <button onClick={onToggleDark} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 md:p-8 flex-1">
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <ExplainerPanel
            title="רגרסיה לינארית"
            summary="רגרסיה לינארית מוצאת את הקו הישר המתאים ביותר לנתונים, ומאפשרת חיזוי ערכי Y חדשים על בסיס ערכי X. השיפוע מתאר את השינוי ב-Y לכל יחידת שינוי ב-X."
            formulas={[
              { label: 'משוואה', formula: 'ŷ = a + b·x' },
              { label: 'שיפוע', formula: 'b = [Σxy - n·X̄·Ȳ] / [Σx² - n·X̄²]' },
              { label: 'חותך', formula: 'a = Ȳ - b·X̄' },
            ]}
            tips={[
              'חשבו ממוצעים קודם, רק אז שיפוע, ורק אז חותך',
              'אל תעגלו תוצאות ביניים — גורם לשגיאות',
              'r² (R בריבוע) מציין כמה אחוזים מהשונות מוסברים על ידי המודל',
            ]}
          />
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800">
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
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${level === lvl.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-bold shadow-inner' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 opacity-80'}`}
                >
                  <span className="text-sm">{lvl.id}. {lvl.label}</span>
                  {level > lvl.id ? <CheckCircle2 size={18} className="text-emerald-500" /> : lvl.id === 5 ? <GraduationCap size={18} /> : <Target size={18} className="opacity-50" />}
                </button>
              ))}
            </div>
          </div>

          {data && level < 5 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">תצפיות (מדגם)</h2>
              <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <table className="w-full text-center text-sm font-mono" dir="ltr">
                  <thead className="bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <tr><th className="p-2 border-b dark:border-slate-700">X (שעות)</th><th className="p-2 border-b dark:border-slate-700">Y (ציון)</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.points.map((p, i) => (
                      <tr key={i} className="hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
                        <td className="p-2 font-bold text-slate-800 dark:text-slate-200">{p.x}</td>
                        <td className="p-2 text-slate-600 dark:text-slate-400">{p.y}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <NotesPanel topic="regression" level={level} />
        </aside>

        <main className="lg:col-span-8 flex flex-col gap-6">
          {data && level <= 4 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-bl-[5rem] pointer-events-none" />
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2 relative z-10">{data.name}</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm relative z-10">
                המערכת הגרילה <span className="font-bold text-indigo-600 dark:text-indigo-400">{data.points.length} תצפיות</span>. נשתמש בנתונים לבניית מודל הרגרסיה.
              </p>
              <div className="mt-8 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-inner">
                <canvas ref={canvasRef} width={800} height={280} className="w-full h-auto" />
              </div>
            </div>
          )}

          {level <= 3 && data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${step >= 1 ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50'}`}>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mb-4">1. מרכז הכובד</p>
                <div className="flex flex-col gap-4" dir="ltr">
                  <MathFraction leading="X̄" numerator={<input type="number" value={inputs.meanX} onChange={(e) => setInputs({ ...inputs, meanX: e.target.value })} className="w-16 bg-slate-100 dark:bg-slate-800 text-center rounded outline-none focus:ring-1 ring-indigo-500" />} denominator="N" />
                  <MathFraction leading="Ȳ" numerator={<input type="number" value={inputs.meanY} onChange={(e) => setInputs({ ...inputs, meanY: e.target.value })} className="w-16 bg-slate-100 dark:bg-slate-800 text-center rounded outline-none focus:ring-1 ring-indigo-500" />} denominator="N" />
                  {step === 1 && <button onClick={() => checkValues('means')} className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">אמת תוצאות</button>}
                </div>
              </div>

              <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${step >= 2 ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50'}`}>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-4">2. שיפוע הישר (b)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4" dir="ltr">Cov(X,Y) / Var(X)</p>
                <div className="flex flex-col gap-4" dir="ltr">
                  <MathFraction leading="b" numerator={<input type="number" value={inputs.slope} onChange={(e) => setInputs({ ...inputs, slope: e.target.value })} className="w-20 bg-slate-100 dark:bg-slate-800 text-center rounded outline-none focus:ring-1 ring-emerald-500" />} denominator="1" />
                  {step === 2 && <button onClick={() => checkValues('slope')} className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">הצב שיפוע</button>}
                </div>
              </div>

              <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${step >= 3 ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50'}`}>
                <p className="font-bold text-blue-600 dark:text-blue-400 text-sm mb-4">3. נקודת חיתוך (a)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-mono" dir="ltr">a = Ȳ - b × X̄</p>
                <div className="flex flex-col gap-4" dir="ltr">
                  <MathFraction leading="a" numerator={<input type="number" value={inputs.intercept} onChange={(e) => setInputs({ ...inputs, intercept: e.target.value })} className="w-20 bg-slate-100 dark:bg-slate-800 text-center rounded outline-none focus:ring-1 ring-blue-500" />} denominator="1" />
                  {step === 3 && <button onClick={() => checkValues('intercept')} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">סיים בניית מודל</button>}
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
                משוואת המודל: <span className="font-mono bg-white dark:bg-slate-950 px-2 py-1 rounded shadow-sm" dir="ltr">Y = {data.slope}X + {data.intercept}</span>
              </p>
              <input
                type="range" min="0" max="15" step="0.5" value={liveX}
                onChange={(e) => { setLiveX(parseFloat(e.target.value)); completeStage('regression', 4); }}
                className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500 shadow-inner mb-8"
              />
              <div className="flex justify-center items-center gap-6 text-2xl font-serif text-center" dir="ltr">
                <div className="flex flex-col items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm min-w-[100px]">
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

          {level === 5 && data && (
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden fade-in text-center border border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/50 to-transparent pointer-events-none" />
              <h2 className="text-3xl font-black mb-8 relative z-10 text-indigo-300">בחינה מסכמת</h2>
              <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-8 rounded-3xl text-right relative z-10">
                <p className="text-lg font-medium mb-8 leading-relaxed">
                  חוקר מצא משוואת רגרסיה:
                  <br /><span className="inline-block mt-4 text-xl font-mono bg-slate-900 px-4 py-2 rounded-xl text-indigo-400" dir="ltr">Y = {data.slope}X + {data.intercept}</span>
                  <br /><br />
                  <strong>נבא את הציון לעובד שהתאמן {data.examTargetX} שעות.</strong>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="ltr">
                  {examOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-5 rounded-2xl border-2 font-bold text-xl transition-all duration-200 ${selectedOption === opt ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg scale-[1.02]' : 'border-slate-600 bg-slate-900 hover:border-indigo-400 hover:bg-slate-800 text-slate-300'}`}
                    >{opt}</button>
                  ))}
                </div>
                {selectedOption !== null && examProgress === 0 && (
                  <button
                    onClick={() => {
                      if (selectedOption === data.examTargetY) {
                        setExamProgress(1);
                        completeStage('regression', 5);
                      } else {
                        setExamProgress(-1);
                      }
                    }}
                    className="mt-8 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-lg transition-colors shadow-lg"
                  >הגש תשובה</button>
                )}
                {examProgress === 1 && <div className="mt-8 bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl font-bold text-xl text-center fade-in">תשובה נכונה! 🎓</div>}
                {examProgress === -1 && <div className="mt-8 bg-red-900/50 border border-red-500/50 text-red-400 p-4 rounded-xl font-bold text-center fade-in">שגוי. הצב X={data.examTargetX} במשוואה.</div>}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
