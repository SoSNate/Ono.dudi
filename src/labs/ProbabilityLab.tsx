import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, CheckCircle2, Target, TrendingUp, GraduationCap, Layers, HelpCircle, ArrowRight } from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { NotesPanel } from '../components/NotesPanel';

interface LabProps {
  darkMode: boolean;
  onToggleDark: () => void;
  onBack: () => void;
}

const MathDisplay = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1 w-full" dir="ltr">
    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-sans uppercase tracking-widest">{label}</span>
    <div className="flex items-center gap-2 font-serif italic text-xl">{children}</div>
  </div>
);

interface ScenarioData {
  pA: number;
  pB: number;
  intersect: number;
  union: number;
  onlyB: number;
}

export function ProbabilityLab({ darkMode, onToggleDark, onBack }: LabProps) {
  const { completeStage } = useProgressStore();

  const [level, setLevel] = useState(1);
  const [data, setData] = useState<ScenarioData | null>(null);
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState({ pA: '', pB: '', intersect: '', union: '' });
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [examOptions, setExamOptions] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [examProgress, setExamProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateScenario = (lvl: number) => {
    const pA = parseFloat((Math.random() * 0.4 + 0.4).toFixed(2));
    const pB = parseFloat((Math.random() * 0.4 + 0.3).toFixed(2));
    const maxIntersect = Math.min(pA, pB);
    const minIntersect = Math.max(0, pA + pB - 1);
    const intersect = parseFloat((Math.random() * (maxIntersect - minIntersect) + minIntersect).toFixed(2));
    const union = parseFloat((pA + pB - intersect).toFixed(2));
    const onlyB = parseFloat((pB - intersect).toFixed(2));

    const options = [
      onlyB,
      parseFloat(intersect.toFixed(2)),
      parseFloat((pB * (1 - pA)).toFixed(2)),
      parseFloat((pA - intersect).toFixed(2)),
    ].sort(() => Math.random() - 0.5);

    setData({ pA, pB, intersect, union, onlyB });
    setExamOptions(options);
    setStep(1);
    setSelectedOption(null);
    setExamProgress(0);
    setInputs({ pA: '', pB: '', intersect: '', union: '' });
    setFeedback({});
  };

  useEffect(() => generateScenario(level), [level]);

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const { width: W, height: H } = canvasRef.current;
    ctx.clearRect(0, 0, W, H);

    const centerX1 = W / 2 - 45;
    const centerX2 = W / 2 + 45;
    const centerY = H / 2;
    const radius = 85;

    const strokeColor = darkMode ? '#64748b' : '#94a3b8';
    const highlightUnion = darkMode ? 'rgba(52,211,153,0.4)' : 'rgba(16,185,129,0.2)';
    const highlightIntersect = darkMode ? 'rgba(96,165,250,0.6)' : 'rgba(59,130,246,0.5)';

    ctx.beginPath();
    ctx.arc(centerX1, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = step === 3 ? highlightUnion : 'rgba(148,163,184,0.1)';
    ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = strokeColor; ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX2, centerY, radius, 0, Math.PI * 2);
    if (step === 3) { ctx.fillStyle = highlightUnion; ctx.fill(); }
    else if (level === 4) {
      ctx.save();
      ctx.beginPath(); ctx.arc(centerX2, centerY, radius, 0, Math.PI * 2); ctx.clip();
      ctx.beginPath(); ctx.arc(centerX1, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = darkMode ? 'rgba(244,63,94,0.5)' : 'rgba(239,68,68,0.3)';
      ctx.globalCompositeOperation = 'source-out';
      ctx.fill(); ctx.restore();
    } else { ctx.fillStyle = 'rgba(148,163,184,0.1)'; ctx.fill(); }
    ctx.stroke();

    if (step === 2) {
      ctx.save();
      ctx.beginPath(); ctx.arc(centerX1, centerY, radius, 0, Math.PI * 2); ctx.clip();
      ctx.beginPath(); ctx.arc(centerX2, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = highlightIntersect; ctx.fill(); ctx.restore();
    }

    ctx.fillStyle = darkMode ? '#e2e8f0' : '#1e293b';
    ctx.font = 'bold 18px Heebo'; ctx.textAlign = 'center';
    ctx.fillText('מאורע A', centerX1 - 60, centerY - radius - 15);
    ctx.fillText('מאורע B', centerX2 + 60, centerY - radius - 15);

    if (step > 1) {
      ctx.font = '14px Heebo';
      ctx.fillStyle = darkMode ? '#94a3b8' : '#64748b';
      ctx.fillText(`P(A)=${data.pA}`, centerX1 - 60, centerY - radius + 5);
      ctx.fillText(`P(B)=${data.pB}`, centerX2 + 60, centerY - radius + 5);
    }
  }, [data, darkMode, step, level]);

  const checkInput = (type: string) => {
    if (!data) return;
    let isCorrect = false;
    if (type === 'base') isCorrect = parseFloat(inputs.pA) === data.pA && parseFloat(inputs.pB) === data.pB;
    if (type === 'intersect') isCorrect = parseFloat(inputs.intersect) === data.intersect;
    if (type === 'union') isCorrect = parseFloat(inputs.union) === data.union;

    setFeedback({ ...feedback, [type]: isCorrect });
    if (isCorrect) {
      setStep((prev) => prev + 1);
      completeStage('probability', step);
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
              <div className="bg-emerald-600/10 dark:bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                <Layers className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold tracking-tight">המרכז לניתוח סטטיסטי</h1>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">הסתברות ודיאגרמות ון</p>
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
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp size={16} /> תהליך המחקר
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { id: 1, label: 'חילוץ הסתברויות בסיס (P)' },
                { id: 2, label: 'איתור החיתוך (Intersection)' },
                { id: 3, label: 'חישוב האיחוד (Union)' },
                { id: 4, label: 'ניתוח מאורע משלים' },
                { id: 5, label: 'סימולציית בחינה' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setLevel(lvl.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${level === lvl.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-bold shadow-inner' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 opacity-80'}`}
                >
                  <span className="text-sm">{lvl.id}. {lvl.label}</span>
                  {level > lvl.id ? <CheckCircle2 size={18} className="text-emerald-500" /> : lvl.id === 5 ? <GraduationCap size={18} /> : <Target size={18} className="opacity-50" />}
                </button>
              ))}
            </div>
          </div>

          <NotesPanel topic="probability" level={level} />
        </aside>

        <main className="lg:col-span-8 flex flex-col gap-6">
          {data && level <= 4 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">ניהול סיכונים בפרויקט</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                בפרויקט IT, הסתברות ש<strong>פיתוח (A)</strong> יסיים בזמן:{' '}
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 rounded">{data.pA}</span>.{' '}
                הסתברות ש<strong>QA (B)</strong> יסיים בזמן:{' '}
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 rounded">{data.pB}</span>.{' '}
                שניהם יחד:{' '}
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 rounded">{data.intersect}</span>.
              </p>
              <div className="mt-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-inner relative">
                <div className="absolute top-4 left-4 text-slate-400"><HelpCircle size={18} /></div>
                <canvas ref={canvasRef} width={800} height={260} className="w-full h-auto" />
              </div>
            </div>
          )}

          {level <= 3 && data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${step >= 1 ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50'}`}>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-4">1. חילוץ נתונים</p>
                <div className="flex flex-col gap-4">
                  <MathDisplay label="Development">P(A) = <input type="number" value={inputs.pA} onChange={(e) => setInputs({ ...inputs, pA: e.target.value })} className="w-20 bg-slate-100 dark:bg-slate-800 font-mono text-center rounded outline-none focus:ring-1 ring-emerald-500" /></MathDisplay>
                  <MathDisplay label="Quality Assurance">P(B) = <input type="number" value={inputs.pB} onChange={(e) => setInputs({ ...inputs, pB: e.target.value })} className="w-20 bg-slate-100 dark:bg-slate-800 font-mono text-center rounded outline-none focus:ring-1 ring-emerald-500" /></MathDisplay>
                  {step === 1 && <button onClick={() => checkInput('base')} className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">אשר נתונים</button>}
                </div>
              </div>

              <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${step >= 2 ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50'}`}>
                <p className="font-bold text-blue-600 dark:text-blue-400 text-sm mb-4">2. חיתוך (AND)</p>
                <div className="flex flex-col gap-4">
                  <MathDisplay label="Both Teams">P(A ∩ B) = <input type="number" value={inputs.intersect} onChange={(e) => setInputs({ ...inputs, intersect: e.target.value })} className="w-24 bg-slate-100 dark:bg-slate-800 font-mono text-center rounded outline-none focus:ring-1 ring-blue-500" /></MathDisplay>
                  {step === 2 && <button onClick={() => checkInput('intersect')} className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">הדגש אזור גרפי</button>}
                </div>
              </div>

              <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${step >= 3 ? 'border-indigo-500 bg-white dark:bg-slate-900 shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50'}`}>
                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mb-2">3. איחוד (OR)</p>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-4 bg-slate-100 dark:bg-slate-800 p-2 rounded" dir="ltr">P(A)+P(B)-P(A∩B)</p>
                <div className="flex flex-col gap-4">
                  <MathDisplay label="At least one">P(A ∪ B) = <input type="number" value={inputs.union} onChange={(e) => setInputs({ ...inputs, union: e.target.value })} className="w-24 bg-slate-100 dark:bg-slate-800 font-mono text-center rounded outline-none focus:ring-1 ring-indigo-500" /></MathDisplay>
                  {step === 3 && <button onClick={() => checkInput('union')} className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">חשב פתרון</button>}
                </div>
              </div>
            </div>
          )}

          {level === 4 && data && (
            <div className="p-8 rounded-[2rem] border-2 border-red-500 bg-gradient-to-br from-red-50 to-rose-50 dark:from-slate-900 dark:to-slate-800 dark:border-red-600/50 shadow-lg fade-in">
              <h4 className="font-bold mb-4 text-red-700 dark:text-red-400 text-lg">ניתוח הסתברות משלימה</h4>
              <p className="mb-6 text-slate-700 dark:text-slate-300 text-lg leading-relaxed">
                הגרף מדגיש באדום את האזור שבו <strong>רק מאורע B</strong> מתרחש (A לא מתרחש).
                <br /><br />
                הנוסחה: <span className="font-mono font-bold bg-white dark:bg-slate-950 px-2 py-1 rounded shadow-sm inline-block mt-2" dir="ltr">P(B ∩ Ā) = P(B) - P(A ∩ B)</span>
              </p>
              <div className="flex justify-center items-center gap-6 text-2xl font-serif text-center" dir="ltr">
                <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">{data.pB} - {data.intersect}</span>
                </div>
                <span className="text-red-500 font-sans">➔</span>
                <div className="bg-red-100 dark:bg-red-900/40 px-8 py-4 rounded-2xl shadow-sm border border-red-300 dark:border-red-700">
                  <span className="font-bold text-red-600 dark:text-red-300">{data.onlyB}</span>
                </div>
              </div>
              <button
                onClick={() => completeStage('probability', 4)}
                className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors"
              >הבנתי — סמן כהושלם</button>
            </div>
          )}

          {level === 5 && data && (
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden fade-in text-center border border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/50 to-transparent pointer-events-none" />
              <h2 className="text-3xl font-black mb-8 relative z-10 text-emerald-300">בחינה מסכמת</h2>
              <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-8 rounded-3xl text-right relative z-10">
                <p className="text-lg font-medium mb-8 leading-relaxed">
                  P(A) = <strong className="text-emerald-400 font-mono text-xl">{data.pA}</strong>, P(B) = <strong className="text-emerald-400 font-mono text-xl">{data.pB}</strong>, P(A∩B) = <strong className="text-emerald-400 font-mono text-xl">{data.intersect}</strong>.
                  <br /><br />
                  <strong className="text-white text-xl">מהי ההסתברות ש-B יתרחש, אך A <span className="underline decoration-red-500 decoration-4">לא יתרחש</span>?</strong>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="ltr">
                  {examOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-5 rounded-2xl border-2 font-bold text-xl transition-all duration-200 font-mono ${selectedOption === opt ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg scale-[1.02]' : 'border-slate-600 bg-slate-900 hover:border-emerald-400 hover:bg-slate-800 text-slate-300'}`}
                    >{opt}</button>
                  ))}
                </div>
                {selectedOption !== null && examProgress === 0 && (
                  <button
                    onClick={() => {
                      if (selectedOption === data.onlyB) {
                        setExamProgress(1);
                        completeStage('probability', 5);
                      } else {
                        setExamProgress(-1);
                      }
                    }}
                    className="mt-8 w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black text-lg transition-colors"
                  >הגש תשובה</button>
                )}
                {examProgress === 1 && <div className="mt-8 bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl font-bold text-xl text-center fade-in">תשובה נכונה! 🎓</div>}
                {examProgress === -1 && <div className="mt-8 bg-red-900/50 border border-red-500/50 text-red-400 p-4 rounded-xl font-bold text-center fade-in">שגוי. נסו: <span dir="ltr" className="font-mono">P(B) - P(A ∩ B)</span></div>}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
