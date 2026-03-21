import React, { useState, useEffect, useRef } from 'react';
import {
  Moon, Sun, CheckCircle2, Target,
  TrendingUp, Activity, GraduationCap,
  BarChart2, ArrowRight
} from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { NotesPanel } from '../components/NotesPanel';
import { ExplainerPanel } from '../components/ExplainerPanel';

interface LabProps {
  darkMode: boolean;
  onToggleDark: () => void;
  onBack: () => void;
}

interface MathFractionProps {
  numerator: React.ReactNode;
  denominator: React.ReactNode;
  leading?: string;
}

const MathFraction = ({ numerator, denominator, leading }: MathFractionProps) => (
  <div className="inline-flex items-center gap-2 font-serif italic tracking-tight" dir="ltr">
    {leading && <span className="text-xl font-bold text-slate-800 dark:text-slate-200">{leading} = </span>}
    <div className="flex flex-col items-center justify-center leading-none">
      <span className="px-3 pb-1 border-b-2 border-slate-800 dark:border-slate-300 text-lg text-slate-900 dark:text-white font-bold">{numerator}</span>
      <span className="px-3 pt-1 text-lg text-slate-900 dark:text-white font-bold">{denominator}</span>
    </div>
  </div>
);

interface ScenarioData {
  name: string;
  raw: number[];
  sorted: number[];
  n: number;
  mean: number;
  median: number;
  variance: number;
  stdDev: number;
  min: number;
  q1: number;
  q3: number;
  max: number;
  examTarget: 'mean' | 'stdDev';
  correctAnswer: number;
}

export function DescriptiveLab({ darkMode, onToggleDark, onBack }: LabProps) {
  const { completeStage } = useProgressStore();

  const [level, setLevel] = useState(1);
  const [data, setData] = useState<ScenarioData | null>(null);
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState({ mean: '', median: '', variance: '' });
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [examOptions, setExamOptions] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [examProgress, setExamProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateScenario = (lvl: number) => {
    const baseVal = Math.floor(Math.random() * 50) + 50;
    const rawData: number[] = [];
    for (let i = 0; i < 7; i++) {
      rawData.push(baseVal + Math.floor(Math.random() * 30));
    }
    const sortedData = [...rawData].sort((a, b) => a - b);
    const n = sortedData.length;

    const sum = sortedData.reduce((acc, val) => acc + val, 0);
    const mean = parseFloat((sum / n).toFixed(2));
    const median = sortedData[Math.floor(n / 2)];

    const sumSqDiff = sortedData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    const variance = parseFloat((sumSqDiff / n).toFixed(2));
    const stdDev = parseFloat(Math.sqrt(variance).toFixed(2));

    const min = sortedData[0];
    const max = sortedData[n - 1];
    const q1 = sortedData[Math.floor(n * 0.25)];
    const q3 = sortedData[Math.floor(n * 0.75)];

    const examTarget: 'mean' | 'stdDev' = Math.random() > 0.5 ? 'mean' : 'stdDev';
    const correctAnswer = examTarget === 'mean' ? mean : stdDev;
    const options = [
      correctAnswer,
      parseFloat((correctAnswer + 2.5).toFixed(2)),
      parseFloat((correctAnswer - 1.8).toFixed(2)),
      parseFloat((correctAnswer * 1.1).toFixed(2)),
    ].sort(() => Math.random() - 0.5);

    setData({ name: 'התפלגות ציוני מבחן (קורס מימון)', raw: rawData, sorted: sortedData, n, mean, median, variance, stdDev, min, q1, q3, max, examTarget, correctAnswer });
    setExamOptions(options);
    setStep(1);
    setExamProgress(0);
    setSelectedOption(null);
    setInputs({ mean: '', median: '', variance: '' });
    setFeedback({});
    void lvl;
  };

  useEffect(() => generateScenario(level), [level]);

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { width: W, height: H } = canvasRef.current;
    ctx.clearRect(0, 0, W, H);

    const padX = 40;
    const padY = 40;
    const minX = Math.floor(data.min / 10) * 10 - 10;
    const maxX = Math.ceil(data.max / 10) * 10 + 10;
    const sX = (val: number) => padX + ((val - minX) / (maxX - minX)) * (W - padX * 2);

    const colorPrimary = darkMode ? '#f97316' : '#ea580c';
    const colorAxis = darkMode ? '#475569' : '#94a3b8';
    const colorText = darkMode ? '#f8fafc' : '#1e293b';

    ctx.strokeStyle = colorAxis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padX, H - padY);
    ctx.lineTo(W - padX, H - padY);
    ctx.stroke();

    ctx.fillStyle = colorText;
    ctx.font = '12px Heebo';
    ctx.textAlign = 'center';
    for (let i = minX; i <= maxX; i += 10) {
      ctx.beginPath();
      ctx.moveTo(sX(i), H - padY);
      ctx.lineTo(sX(i), H - padY + 5);
      ctx.stroke();
      ctx.fillText(String(i), sX(i), H - padY + 20);
    }

    if (level === 4) {
      const centerY = H / 2 - 10;
      const boxHeight = 40;
      ctx.strokeStyle = colorPrimary;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sX(data.min), centerY); ctx.lineTo(sX(data.q1), centerY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sX(data.q3), centerY); ctx.lineTo(sX(data.max), centerY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sX(data.min), centerY - 10); ctx.lineTo(sX(data.min), centerY + 10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sX(data.max), centerY - 10); ctx.lineTo(sX(data.max), centerY + 10); ctx.stroke();
      ctx.fillStyle = darkMode ? 'rgba(249,115,22,0.2)' : 'rgba(234,88,12,0.1)';
      ctx.fillRect(sX(data.q1), centerY - boxHeight / 2, sX(data.q3) - sX(data.q1), boxHeight);
      ctx.strokeRect(sX(data.q1), centerY - boxHeight / 2, sX(data.q3) - sX(data.q1), boxHeight);
      ctx.beginPath(); ctx.moveTo(sX(data.median), centerY - boxHeight / 2); ctx.lineTo(sX(data.median), centerY + boxHeight / 2); ctx.stroke();
      ctx.fillStyle = colorPrimary;
      ctx.font = 'bold 14px Heebo';
      ctx.fillText('Q1', sX(data.q1), centerY - boxHeight / 2 - 10);
      ctx.fillText('Me', sX(data.median), centerY - boxHeight / 2 - 10);
      ctx.fillText('Q3', sX(data.q3), centerY - boxHeight / 2 - 10);
    } else if (level < 4) {
      const centerY = H / 2;
      data.raw.forEach((val) => {
        ctx.fillStyle = colorPrimary;
        ctx.beginPath();
        ctx.arc(sX(val), centerY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darkMode ? 'rgba(249,115,22,0.3)' : 'rgba(234,88,12,0.3)';
        ctx.lineWidth = 4;
        ctx.stroke();
      });
      if (step > 1) {
        ctx.strokeStyle = '#10b981';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sX(data.mean), H - padY);
        ctx.lineTo(sX(data.mean), padY);
        ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.fillText(`X̄=${data.mean}`, sX(data.mean), padY - 10);
        ctx.setLineDash([]);
      }
      if (step > 2) {
        ctx.strokeStyle = '#3b82f6';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(sX(data.median), H - padY);
        ctx.lineTo(sX(data.median), padY + 15);
        ctx.stroke();
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(`Me=${data.median}`, sX(data.median), padY + 5);
        ctx.setLineDash([]);
      }
    }
  }, [data, darkMode, step, level]);

  const checkInput = (type: 'mean' | 'median' | 'variance') => {
    if (!data) return;
    let isCorrect = false;
    if (type === 'mean') isCorrect = Math.abs(parseFloat(inputs.mean) - data.mean) < 0.2;
    if (type === 'median') isCorrect = parseFloat(inputs.median) === data.median;
    if (type === 'variance') isCorrect = Math.abs(parseFloat(inputs.variance) - data.variance) < 1.0;

    setFeedback({ ...feedback, [type]: isCorrect });
    if (isCorrect) {
      completeStage('descriptive', step);
      setStep((prev) => prev + 1);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-500 ${darkMode ? 'dark bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}
      dir="rtl"
    >
      {/* Header */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <ArrowRight size={16} /> לוח בקרה
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 p-2 rounded-xl text-white shadow-lg">
                <BarChart2 size={18} />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight">Ono Analytics Lab</h1>
                <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest leading-none">סטטיסטיקה תיאורית</p>
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

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-8">
        {/* Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <ExplainerPanel
            title="סטטיסטיקה תיאורית"
            summary="סטטיסטיקה תיאורית מסכמת נתונים באמצעות מדדי מרכז (ממוצע, חציון) ומדדי פיזור (שונות, סטיית תקן). כלים אלה מאפשרים להבין את התפלגות הנתונים בצורה מהירה."
            formulas={[
              { label: 'ממוצע', formula: 'X̄ = ΣX / n' },
              { label: 'שונות', formula: 'σ² = Σ(X - X̄)² / n' },
              { label: 'סטיית תקן', formula: 'σ = √σ²' },
              { label: 'IQR', formula: 'IQR = Q3 - Q1' },
            ]}
            tips={[
              'חציון עמיד בפני ערכי קיצון — עדיף לנתונים מוטים',
              'סטיית תקן גדולה = נתונים מפוזרים',
              'Box Plot מראה במבט אחד: מינימום, Q1, חציון, Q3, מקסימום',
            ]}
          />

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp size={16} /> תהליך המחקר
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { id: 1, label: 'חישוב ממוצע (X̄)' },
                { id: 2, label: 'מציאת חציון (Me)' },
                { id: 3, label: 'שונות (S²) וסטיית תקן (S)' },
                { id: 4, label: 'בניית Box Plot' },
                { id: 5, label: 'סימולציית בחינה אקדמית' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setLevel(lvl.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 text-right ${
                    level === lvl.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-bold shadow-inner'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 opacity-80'
                  }`}
                >
                  <span className="text-sm">{lvl.id}. {lvl.label}</span>
                  {level > lvl.id ? (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                  ) : lvl.id === 5 ? (
                    <GraduationCap size={18} className="shrink-0 opacity-50" />
                  ) : (
                    <Target size={18} className="opacity-50 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {data && level < 5 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">תצפיות המדגם (N={data.n})</h2>
              <div className="flex flex-wrap gap-2 justify-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700" dir="ltr">
                {(step >= 2 ? data.sorted : data.raw).map((val, idx) => (
                  <span key={idx} className="font-mono text-lg font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border dark:border-slate-700 px-3 py-1 rounded-lg shadow-sm">
                    {val}
                  </span>
                ))}
              </div>
              {step >= 2 && <p className="text-[10px] text-center mt-3 text-slate-400">הנתונים מוינו כדי לסייע במציאת החציון.</p>}
            </div>
          )}

          <NotesPanel topic="descriptive" level={level} />
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-8 flex flex-col gap-6">
          {data && level <= 4 && (
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="font-serif text-xl md:text-2xl font-bold mb-3">{data.name}</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                לפניכם אוסף של תצפיות גולמיות. בשלבים הבאים נשתמש במדדי מרכז ופיזור כדי להבין את התפלגות הנתונים, ולאחר מכן נבנה תרשים קופסה (Box Plot) ויזואלי.
              </p>
              <div className="mt-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-inner">
                <canvas ref={canvasRef} width={800} height={200} className="w-full h-auto" />
              </div>
            </div>
          )}

          {/* Steps 1-3 */}
          {level <= 3 && data && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {/* Step 1: Mean */}
              <div className={`p-5 rounded-[2rem] border-2 transition-all duration-300 ${step >= 1 ? 'border-orange-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50 dark:bg-slate-900'}`}>
                <p className="font-bold text-orange-600 dark:text-orange-400 text-sm mb-4">1. חישוב ממוצע</p>
                <div className="flex flex-col gap-4">
                  <MathFraction
                    leading="X̄"
                    numerator={
                      <input type="number" value={inputs.mean} onChange={(e) => setInputs({ ...inputs, mean: e.target.value })}
                        className="w-16 bg-slate-100 dark:bg-slate-800 font-mono text-center rounded outline-none focus:ring-1 ring-orange-500" />
                    }
                    denominator="N"
                  />
                  {feedback.mean === false && <p className="text-xs text-red-500">נסו שוב</p>}
                  {step === 1 && (
                    <button onClick={() => checkInput('mean')} className="mt-2 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">בדוק</button>
                  )}
                  {feedback.mean === true && <CheckCircle2 size={18} className="text-emerald-500" />}
                </div>
              </div>

              {/* Step 2: Median */}
              <div className={`p-5 rounded-[2rem] border-2 transition-all duration-300 ${step >= 2 ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50 dark:bg-slate-900'}`}>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-4">2. מציאת חציון</p>
                <div className="flex flex-col gap-4">
                  <input type="number" value={inputs.median} onChange={(e) => setInputs({ ...inputs, median: e.target.value })}
                    placeholder="ערך חציון"
                    className="w-full bg-slate-100 dark:bg-slate-800 font-mono text-center rounded-xl px-3 py-2 outline-none focus:ring-1 ring-emerald-500 text-sm" />
                  {feedback.median === false && <p className="text-xs text-red-500">נסו שוב</p>}
                  {step === 2 && (
                    <button onClick={() => checkInput('median')} className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">סמן בגרף</button>
                  )}
                  {feedback.median === true && <CheckCircle2 size={18} className="text-emerald-500" />}
                </div>
              </div>

              {/* Step 3: Variance */}
              <div className={`p-5 rounded-[2rem] border-2 transition-all duration-300 ${step >= 3 ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50 dark:bg-slate-900'}`}>
                <p className="font-bold text-blue-600 dark:text-blue-400 text-sm mb-2">3. שונות (S²)</p>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-4 bg-slate-100 dark:bg-slate-800 p-2 rounded" dir="ltr">Σ(X - X̄)² / N</p>
                <div className="flex flex-col gap-4">
                  <input type="number" value={inputs.variance} onChange={(e) => setInputs({ ...inputs, variance: e.target.value })}
                    placeholder="ערך שונות"
                    className="w-full bg-slate-100 dark:bg-slate-800 font-mono text-center rounded-xl px-3 py-2 outline-none focus:ring-1 ring-blue-500 text-sm" />
                  {feedback.variance === false && <p className="text-xs text-red-500">נסו שוב</p>}
                  {step === 3 && (
                    <button onClick={() => checkInput('variance')} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">חשב והמשך</button>
                  )}
                  {feedback.variance === true && <CheckCircle2 size={18} className="text-emerald-500" />}
                </div>
              </div>
            </div>
          )}

          {/* Level 4: Box Plot */}
          {level === 4 && data && (
            <div className="p-6 md:p-8 rounded-[2rem] border-2 border-orange-500 bg-orange-50 dark:bg-slate-900 shadow-lg fade-in">
              <h4 className="font-bold mb-4 flex items-center gap-2 text-orange-700 dark:text-orange-400 text-lg">
                <Activity size={22} /> תרשים קופסה (Box Plot)
              </h4>
              <p className="mb-6 text-slate-700 dark:text-slate-300 text-sm">
                התרשים נוצר אוטומטית למעלה על סמך 5 ערכים (Min, Q1, Median, Q3, Max). זהו כלי מעולה להבנת פיזור הנתונים והטווח הבין-רבעוני (IQR).
              </p>
              <div className="flex flex-wrap justify-center items-center gap-3 text-center" dir="ltr">
                {[
                  { label: 'Min', value: data.min, highlight: false },
                  { label: 'Q1', value: data.q1, highlight: false },
                  { label: 'Median', value: data.median, highlight: true },
                  { label: 'Q3', value: data.q3, highlight: false },
                  { label: 'Max', value: data.max, highlight: false },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className={`px-4 py-2 rounded-xl shadow-sm border ${highlight ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                    <span className={`block text-xs ${highlight ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'}`}>{label}</span>
                    <span className={`font-bold ${highlight ? 'text-orange-700 dark:text-orange-300' : ''}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level 5: Exam */}
          {level === 5 && data && (
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden fade-in text-center border border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-t from-orange-900/40 to-transparent pointer-events-none" />
              <h2 className="text-2xl md:text-3xl font-black mb-8 relative z-10 text-orange-300">בחינה מסכמת</h2>
              <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-6 md:p-8 rounded-3xl text-right relative z-10 shadow-inner">
                <p className="text-base md:text-lg font-medium mb-8 leading-relaxed">
                  נתון המדגם הבא של ציוני הסטודנטים:
                  <br />
                  <span className="inline-block mt-4 text-lg md:text-xl font-mono bg-slate-900 px-4 py-2 rounded-xl text-orange-400" dir="ltr">
                    {data.raw.join(', ')}
                  </span>
                  <br /><br />
                  <strong className="text-white">מה{data.examTarget === 'mean' ? 'ו הממוצע (X̄)' : 'י סטיית התקן (S)'} של הנתונים במדגם?</strong>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" dir="ltr">
                  {examOptions.map((opt, i) => (
                    <button key={i} onClick={() => setSelectedOption(opt)}
                      className={`p-5 rounded-2xl border-2 font-bold text-xl transition-all duration-200 font-mono ${selectedOption === opt ? 'border-orange-500 bg-orange-600 text-white shadow-lg scale-[1.02]' : 'border-slate-600 bg-slate-900 hover:border-orange-400 hover:bg-slate-800 text-slate-300'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
                {selectedOption !== null && examProgress === 0 && (
                  <button
                    onClick={() => {
                      if (selectedOption === data.correctAnswer) {
                        setExamProgress(1);
                        completeStage('descriptive', 5);
                      } else {
                        setExamProgress(-1);
                      }
                    }}
                    className="mt-8 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-lg transition-colors shadow-lg"
                  >
                    הגש תשובה לבדיקה
                  </button>
                )}
                {examProgress === 1 && <div className="mt-8 bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl font-bold text-xl text-center fade-in">תשובה נכונה! כל הכבוד. 🎓</div>}
                {examProgress === -1 && <div className="mt-8 bg-red-900/50 border border-red-500/50 text-red-400 p-4 rounded-xl font-bold text-center fade-in">תשובה שגויה. נסו לחשב שוב את הנוסחה.</div>}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
