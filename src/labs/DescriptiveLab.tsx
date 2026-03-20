import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, CheckCircle2, Target, TrendingUp, GraduationCap, BarChart2, ArrowRight } from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { NotesPanel } from '../components/NotesPanel';

interface LabProps {
  darkMode: boolean;
  onToggleDark: () => void;
  onBack: () => void;
}

interface ScenarioData {
  values: number[];
  mean: number;
  median: number;
  variance: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  sumX: number;
}

function calcStats(values: number[]): Omit<ScenarioData, 'values'> {
  const n = values.length;
  const sumX = values.reduce((a, b) => a + b, 0);
  const mean = parseFloat((sumX / n).toFixed(2));

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0
    ? parseFloat(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2))
    : sorted[mid];

  const variance = parseFloat((sorted.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n).toFixed(2));
  const stdDev = parseFloat(Math.sqrt(variance).toFixed(2));

  const q1 = sorted[Math.floor(n / 4)];
  const q3 = sorted[Math.floor((3 * n) / 4)];
  const iqr = parseFloat((q3 - q1).toFixed(2));

  return { mean, median, variance, stdDev, q1, q3, iqr, sumX };
}

export function DescriptiveLab({ darkMode, onToggleDark, onBack }: LabProps) {
  const { completeStage } = useProgressStore();

  const [level, setLevel] = useState(1);
  const [data, setData] = useState<ScenarioData | null>(null);
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState({ sumX: '', mean: '', median: '', variance: '', stdDev: '' });
  const [feedback, setFeedback] = useState<Record<string, boolean | null>>({});
  const [sliderVal, setSliderVal] = useState(0);
  const [examOptions, setExamOptions] = useState<number[]>([]);
  const [examSelected, setExamSelected] = useState<number | null>(null);
  const [examProgress, setExamProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateScenario = (lvl: number) => {
    const n = 7 + Math.floor(Math.random() * 3); // 7-9
    const values: number[] = Array.from({ length: n }, () => Math.floor(Math.random() * 76) + 20);
    const stats = calcStats(values);

    const options = [
      stats.stdDev,
      stats.variance,
      stats.iqr,
      parseFloat((stats.stdDev + 1).toFixed(2)),
    ].sort(() => Math.random() - 0.5);

    setData({ values, ...stats });
    setSliderVal(values[0]);
    setExamOptions(options);
    setStep(1);
    setExamSelected(null);
    setExamProgress(0);
    setInputs({ sumX: '', mean: '', median: '', variance: '', stdDev: '' });
    setFeedback({});
  };

  useEffect(() => generateScenario(level), [level]);

  // ---- Canvas ----
  useEffect(() => {
    if (!canvasRef.current || !data) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const { width: W, height: H } = canvasRef.current;
    ctx.clearRect(0, 0, W, H);

    const pad = { top: 20, bottom: 40, left: 30, right: 20 };
    const colorBar = darkMode ? '#6366f1' : '#3b82f6';
    const colorMean = '#ef4444';
    const colorMedian = '#10b981';
    const colorText = darkMode ? '#e2e8f0' : '#1e293b';

    // --- Levels 1-3: Bar chart ---
    if (level <= 3) {
      const displayValues = level === 2
        ? [...data.values].sort((a, b) => a - b)
        : data.values;

      const maxVal = Math.max(...displayValues);
      const barW = (W - pad.left - pad.right) / displayValues.length - 4;
      const chartH = H - pad.top - pad.bottom;

      displayValues.forEach((v, i) => {
        const x = pad.left + i * (barW + 4);
        const barH = (v / maxVal) * chartH;
        const y = H - pad.bottom - barH;

        // Highlight median bar in level 2
        const mid = Math.floor(displayValues.length / 2);
        const isMedian = level === 2 && (i === mid || (displayValues.length % 2 === 0 && i === mid - 1));
        ctx.fillStyle = isMedian ? colorMedian : colorBar;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 4);
        ctx.fill();

        ctx.fillStyle = colorText;
        ctx.font = '10px Heebo';
        ctx.textAlign = 'center';
        ctx.fillText(String(v), x + barW / 2, H - pad.bottom + 14);
      });

      // Mean line
      if (step >= 2 && level === 1) {
        const meanY = H - pad.bottom - (data.mean / maxVal) * chartH;
        ctx.strokeStyle = colorMean;
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pad.left, meanY);
        ctx.lineTo(W - pad.right, meanY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = colorMean;
        ctx.font = 'bold 11px Heebo';
        ctx.textAlign = 'left';
        ctx.fillText(`X̄=${data.mean}`, pad.left + 4, meanY - 5);
      }
    }

    // --- Level 4: Box Plot ---
    if (level === 4) {
      const updatedValues = [...data.values];
      updatedValues[0] = sliderVal;
      const s = calcStats(updatedValues);

      const all = [s.q1 - 1.5 * s.iqr, s.q1, s.median, s.q3, s.q3 + 1.5 * s.iqr];
      const minV = Math.min(...updatedValues, all[0]);
      const maxV = Math.max(...updatedValues, all[4]);
      const range = maxV - minV || 1;

      const toX = (v: number) => pad.left + ((v - minV) / range) * (W - pad.left - pad.right);
      const midY = H / 2;
      const boxH = 40;

      // Whiskers
      ctx.strokeStyle = darkMode ? '#64748b' : '#94a3b8';
      ctx.lineWidth = 2;
      [toX(Math.min(...updatedValues)), toX(Math.max(...updatedValues))].forEach((wx) => {
        ctx.beginPath(); ctx.moveTo(wx, midY - boxH / 2); ctx.lineTo(wx, midY + boxH / 2); ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(toX(Math.min(...updatedValues)), midY);
      ctx.lineTo(toX(s.q1), midY);
      ctx.moveTo(toX(s.q3), midY);
      ctx.lineTo(toX(Math.max(...updatedValues)), midY);
      ctx.stroke();

      // Box Q1-Q3
      ctx.fillStyle = darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(59,130,246,0.15)';
      ctx.strokeStyle = colorBar;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(toX(s.q1), midY - boxH / 2, toX(s.q3) - toX(s.q1), boxH, 6);
      ctx.fill(); ctx.stroke();

      // Median line
      ctx.strokeStyle = colorMedian;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(toX(s.median), midY - boxH / 2); ctx.lineTo(toX(s.median), midY + boxH / 2); ctx.stroke();

      // Mean dot
      ctx.fillStyle = colorMean;
      ctx.beginPath(); ctx.arc(toX(s.mean), midY, 5, 0, Math.PI * 2); ctx.fill();

      // Labels
      ctx.font = 'bold 11px Heebo';
      ctx.textAlign = 'center';
      ctx.fillStyle = colorText;
      [
        { v: s.q1, label: `Q1=${s.q1}` },
        { v: s.median, label: `Med=${s.median}` },
        { v: s.q3, label: `Q3=${s.q3}` },
      ].forEach(({ v, label }) => {
        ctx.fillText(label, toX(v), midY - boxH / 2 - 8);
      });

      // Stats bar below
      const diff = parseFloat((s.mean - s.median).toFixed(2));
      const skew = diff > 0 ? 'זנב ימני ←' : diff < 0 ? '→ זנב שמאלי' : 'סימטרי';
      ctx.font = '12px Heebo';
      ctx.fillStyle = diff !== 0 ? '#f59e0b' : colorMedian;
      ctx.textAlign = 'center';
      ctx.fillText(`ממוצע=${s.mean} | חציון=${s.median} | הפרש=${Math.abs(diff)} → ${skew}`, W / 2, H - 8);
    }
  }, [data, darkMode, step, level, sliderVal]);

  const check = (type: string, expected: number, tolerance = 0.5) => {
    const val = parseFloat(inputs[type as keyof typeof inputs]);
    const ok = Math.abs(val - expected) <= tolerance;
    setFeedback({ ...feedback, [type]: ok });
    if (ok) {
      setStep((prev) => prev + 1);
      completeStage('descriptive', step <= 3 ? step : level);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${darkMode ? 'dark bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}
      dir="rtl"
    >
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
              <ArrowRight size={16} /> לוח בקרה
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-4">
              <div className="bg-orange-600/10 dark:bg-orange-500/20 p-2.5 rounded-xl border border-orange-200 dark:border-orange-500/30">
                <BarChart2 className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold tracking-tight">מרכז הסטטיסטיקה התיאורית</h1>
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none">מדדי מרכז ופיזור</p>
              </div>
            </div>
          </div>
          <button onClick={onToggleDark} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 md:p-8 flex-1">
        {/* Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp size={16} /> שלבי הלמידה
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { id: 1, label: 'ממוצע (Mean)' },
                { id: 2, label: 'חציון (Median)' },
                { id: 3, label: 'שונות וסטיית תקן (σ)' },
                { id: 4, label: 'Box Plot אינטראקטיבי' },
                { id: 5, label: 'סימולציית בחינה' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setLevel(lvl.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${level === lvl.id ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-bold shadow-inner' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 opacity-80'}`}
                >
                  <span className="text-sm">{lvl.id}. {lvl.label}</span>
                  {level > lvl.id ? <CheckCircle2 size={18} className="text-emerald-500" /> : lvl.id === 5 ? <GraduationCap size={18} /> : <Target size={18} className="opacity-50" />}
                </button>
              ))}
            </div>
          </div>

          {/* Data table */}
          {data && level < 5 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">נתוני המדגם</h2>
              <div className="flex flex-wrap gap-2" dir="ltr">
                {(level === 2 ? [...data.values].sort((a, b) => a - b) : data.values).map((v, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{v}</span>
                ))}
              </div>
              {level === 2 && <p className="text-[10px] text-orange-500 font-bold mt-2">* ממוינים לסדר עולה</p>}
            </div>
          )}

          <NotesPanel topic="descriptive" level={level} />
        </aside>

        {/* Main */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          {data && level <= 4 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">ציוני סטודנטים בקורס ניהול</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                המערכת הגרילה <span className="font-bold text-orange-600 dark:text-orange-400">{data.values.length} ציונים</span>.
                {level === 2 && ' הציונים ממוינים מהקטן לגדול.'}
                {level === 4 && ' גרור את הסליידר כדי לשנות ערך קצה ולראות כיצד הגרף מגיב.'}
              </p>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-inner">
                <canvas ref={canvasRef} width={800} height={level === 4 ? 200 : 260} className="w-full h-auto" />
              </div>

              {level === 4 && (
                <div className="mt-4">
                  <input
                    type="range"
                    min={Math.min(...data.values) - 15}
                    max={Math.max(...data.values) + 15}
                    step={1}
                    value={sliderVal}
                    onChange={(e) => {
                      setSliderVal(Number(e.target.value));
                      completeStage('descriptive', 4);
                    }}
                    className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-orange-500"
                  />
                  <p className="text-center text-xs text-slate-500 mt-1">ערך נוכחי: <strong>{sliderVal}</strong></p>
                </div>
              )}
            </div>
          )}

          {/* Level 1 — Mean */}
          {level === 1 && data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-[2rem] border-2 transition-all ${step >= 1 ? 'border-orange-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200'}`}>
                <p className="font-bold text-orange-600 text-sm mb-4">1. חישוב סכום (ΣX)</p>
                <div className="flex items-center gap-2" dir="ltr">
                  <span className="font-bold text-orange-600">ΣX =</span>
                  <input type="number" value={inputs.sumX} onChange={(e) => setInputs({ ...inputs, sumX: e.target.value })}
                    className="w-24 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-center font-bold border outline-none focus:ring-1 ring-orange-500" />
                </div>
                {step === 1 && (
                  <button onClick={() => check('sumX', data.sumX, 1)} className="mt-4 w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-bold text-sm">
                    אמת סכום
                  </button>
                )}
                {feedback.sumX === false && <p className="text-red-500 text-xs mt-2 text-center">נסה שוב — חבר את כל הערכים</p>}
              </div>

              <div className={`p-6 rounded-[2rem] border-2 transition-all ${step >= 2 ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200'}`}>
                <p className="font-bold text-blue-600 text-sm mb-4">2. חישוב ממוצע (X̄ = ΣX/n)</p>
                <div className="flex items-center gap-2" dir="ltr">
                  <span className="font-bold text-blue-600">X̄ =</span>
                  <input type="number" value={inputs.mean} onChange={(e) => setInputs({ ...inputs, mean: e.target.value })}
                    className="w-24 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-center font-bold border outline-none focus:ring-1 ring-blue-500" />
                </div>
                {step === 2 && (
                  <button onClick={() => check('mean', data.mean)} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm">
                    אמת ממוצע
                  </button>
                )}
                {feedback.mean === false && <p className="text-red-500 text-xs mt-2 text-center">חלק את הסכום ב-{data.values.length}</p>}
                {step >= 3 && (
                  <p className="mt-3 text-emerald-600 font-bold text-sm text-center fade-in">✓ X̄ = {data.mean}</p>
                )}
              </div>
            </div>
          )}

          {/* Level 2 — Median */}
          {level === 2 && data && (
            <div className={`p-6 rounded-[2rem] border-2 transition-all ${step >= 1 ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40'}`}>
              <p className="font-bold text-emerald-600 text-sm mb-4">מצא את הערך האמצעי (הציונים ממוינים)</p>
              <div className="flex items-center gap-2" dir="ltr">
                <span className="font-bold text-emerald-600">Median =</span>
                <input type="number" value={inputs.median} onChange={(e) => setInputs({ ...inputs, median: e.target.value })}
                  className="w-24 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-center font-bold border outline-none focus:ring-1 ring-emerald-500" />
              </div>
              {step === 1 && (
                <button onClick={() => check('median', data.median)} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm">
                  בדוק חציון
                </button>
              )}
              {feedback.median === false && (
                <p className="text-red-500 text-xs mt-2">
                  {data.values.length % 2 === 0 ? `ממוצע שני הערכים האמצעיים` : `הערך האמצעי (מקום ${Math.floor(data.values.length / 2) + 1})`}
                </p>
              )}
              {step >= 2 && <p className="mt-3 text-emerald-600 font-bold text-sm fade-in">✓ חציון = {data.median}</p>}
            </div>
          )}

          {/* Level 3 — Variance & StdDev */}
          {level === 3 && data && (
            <div className="flex flex-col gap-4">
              {/* Deviation table */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                <p className="font-bold text-slate-600 dark:text-slate-400 text-sm mb-3">טבלת סטיות מהממוצע (X̄ = {data.mean})</p>
                <table className="w-full text-center text-xs font-mono" dir="ltr">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                    <tr>
                      <th className="p-2 border-b">xi</th>
                      <th className="p-2 border-b">xi - X̄</th>
                      <th className="p-2 border-b">(xi - X̄)²</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {data.values.map((v, i) => (
                      <tr key={i}>
                        <td className="p-1.5 font-bold">{v}</td>
                        <td className="p-1.5 text-slate-500">{parseFloat((v - data.mean).toFixed(2))}</td>
                        <td className="p-1.5 text-indigo-600 dark:text-indigo-400">{parseFloat(Math.pow(v - data.mean, 2).toFixed(2))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-6 rounded-[2rem] border-2 transition-all ${step >= 1 ? 'border-violet-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40 grayscale pointer-events-none'}`}>
                  <p className="font-bold text-violet-600 text-sm mb-3" dir="ltr">σ² = Σ(xi-X̄)² / n</p>
                  <div className="flex items-center gap-2" dir="ltr">
                    <span className="font-bold text-violet-600">σ² =</span>
                    <input type="number" value={inputs.variance} onChange={(e) => setInputs({ ...inputs, variance: e.target.value })}
                      className="w-24 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-center font-bold border outline-none focus:ring-1 ring-violet-500" />
                  </div>
                  {step === 1 && (
                    <button onClick={() => check('variance', data.variance, 1)} className="mt-3 w-full bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-xl font-bold text-sm">
                      אמת שונות
                    </button>
                  )}
                  {step >= 2 && <p className="mt-2 text-emerald-600 font-bold text-sm fade-in">✓ σ² = {data.variance}</p>}
                </div>

                <div className={`p-6 rounded-[2rem] border-2 transition-all ${step >= 2 ? 'border-orange-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40 grayscale pointer-events-none'}`}>
                  <p className="font-bold text-orange-600 text-sm mb-3" dir="ltr">σ = √σ²</p>
                  <div className="flex items-center gap-2" dir="ltr">
                    <span className="font-bold text-orange-600">σ =</span>
                    <input type="number" value={inputs.stdDev} onChange={(e) => setInputs({ ...inputs, stdDev: e.target.value })}
                      className="w-24 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-center font-bold border outline-none focus:ring-1 ring-orange-500" />
                  </div>
                  {step === 2 && (
                    <button onClick={() => check('stdDev', data.stdDev, 0.1)} className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-xl font-bold text-sm">
                      אמת סטיית תקן
                    </button>
                  )}
                  {step >= 3 && <p className="mt-2 text-emerald-600 font-bold text-sm fade-in">✓ σ = {data.stdDev}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Level 5 — Exam */}
          {level === 5 && data && (
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden fade-in text-center border border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-t from-orange-900/40 to-transparent pointer-events-none" />
              <h2 className="text-3xl font-black mb-8 relative z-10 text-orange-300">בחינה מסכמת</h2>
              <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-8 rounded-3xl text-right relative z-10">
                <p className="text-lg font-medium mb-8 leading-relaxed">
                  נתונים: <span className="font-mono text-orange-300" dir="ltr">{data.values.join(', ')}</span>
                  <br /><br />
                  <strong>מהי סטיית התקן (σ) של הנתונים?</strong>
                </p>
                <div className="grid grid-cols-2 gap-4" dir="ltr">
                  {examOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setExamSelected(opt)}
                      className={`p-5 rounded-2xl border-2 font-bold text-xl transition-all font-mono ${examSelected === opt ? 'border-orange-500 bg-orange-600 text-white shadow-lg scale-[1.02]' : 'border-slate-600 bg-slate-900 hover:border-orange-400 hover:bg-slate-800 text-slate-300'}`}
                    >{opt}</button>
                  ))}
                </div>
                {examSelected !== null && examProgress === 0 && (
                  <button
                    onClick={() => {
                      if (examSelected === data.stdDev) {
                        setExamProgress(1);
                        completeStage('descriptive', 5);
                      } else {
                        setExamProgress(-1);
                      }
                    }}
                    className="mt-8 w-full bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-2xl font-black text-lg transition-colors"
                  >הגש תשובה</button>
                )}
                {examProgress === 1 && (
                  <div className="mt-8 bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl font-bold text-xl text-center fade-in">
                    תשובה נכונה! 🎓
                    <button onClick={() => generateScenario(level)} className="block mx-auto mt-3 bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm">שאלה נוספת</button>
                  </div>
                )}
                {examProgress === -1 && (
                  <div className="mt-8 bg-red-900/50 border border-red-500/50 text-red-400 p-4 rounded-xl font-bold text-center fade-in">
                    שגוי. σ = √(Σ(xi-X̄)²/n) = <span className="font-mono">{data.stdDev}</span>
                    <br />
                    <button onClick={() => setExamProgress(0)} className="mt-2 text-blue-400 underline text-sm">נסה שוב</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
