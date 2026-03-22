import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, CheckCircle2, Target, TrendingUp, GraduationCap, Layers, HelpCircle, ArrowRight } from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { NotesPanel } from '../components/NotesPanel';
import { ExplainerPanel } from '../components/ExplainerPanel';

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
  const [inputs, setInputs] = useState({ pA: '', pB: '', intersect: '', union: '', deMorgan: '' });
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [examOptions, setExamOptions] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [examProgress, setExamProgress] = useState(0);
  const [deMorganCorrect, setDeMorganCorrect] = useState(false);
  const [independenceAnswer, setIndependenceAnswer] = useState<boolean | null>(null);
  const [independenceCorrect, setIndependenceCorrect] = useState(false);
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
    setInputs({ pA: '', pB: '', intersect: '', union: '', deMorgan: '' });
    setFeedback({});
    setDeMorganCorrect(false);
    setIndependenceAnswer(null);
    setIndependenceCorrect(false);
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
    const highlightIntersect = darkMode ? 'rgba(52,211,153,0.55)' : 'rgba(16,185,129,0.45)';

    if (level === 4) {
      // De Morgan: shade (A∪B)ᶜ = outside both circles in violet
      ctx.save();
      ctx.fillStyle = darkMode ? 'rgba(167,139,250,0.28)' : 'rgba(139,92,246,0.18)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(centerX1, centerY, radius, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(centerX2, centerY, radius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.beginPath(); ctx.arc(centerX1, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(148,163,184,0.12)'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = strokeColor; ctx.stroke();

      ctx.beginPath(); ctx.arc(centerX2, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(148,163,184,0.12)'; ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(centerX1, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = step === 3 ? highlightUnion : 'rgba(148,163,184,0.1)';
      ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = strokeColor; ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX2, centerY, radius, 0, Math.PI * 2);
      if (step === 3) { ctx.fillStyle = highlightUnion; ctx.fill(); }
      else { ctx.fillStyle = 'rgba(148,163,184,0.1)'; ctx.fill(); }
      ctx.stroke();

      if (step === 2) {
        ctx.save();
        ctx.beginPath(); ctx.arc(centerX1, centerY, radius, 0, Math.PI * 2); ctx.clip();
        ctx.beginPath(); ctx.arc(centerX2, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = highlightIntersect; ctx.fill(); ctx.restore();
      }
    }

    ctx.fillStyle = darkMode ? '#e2e8f0' : '#1e293b';
    ctx.font = 'bold 18px Heebo'; ctx.textAlign = 'center';
    ctx.fillText('מאורע A', centerX1 - 60, centerY - radius - 15);
    ctx.fillText('מאורע B', centerX2 + 60, centerY - radius - 15);

    if (step > 1 || level === 4) {
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

  const checkDeMorgan = () => {
    if (!data) return;
    const expected = parseFloat((1 - data.union).toFixed(2));
    const isCorrect = Math.abs(parseFloat(inputs.deMorgan) - expected) < 0.015;
    setFeedback(prev => ({ ...prev, deMorgan: isCorrect }));
    if (isCorrect) {
      setDeMorganCorrect(true);
      completeStage('probability', 4);
    }
  };

  const checkIndependence = (userSaysIndependent: boolean) => {
    if (!data) return;
    const actuallyIndependent = Math.abs(data.pA * data.pB - data.intersect) < 0.02;
    const correct = userSaysIndependent === actuallyIndependent;
    setIndependenceAnswer(userSaysIndependent);
    setIndependenceCorrect(correct);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 ${darkMode ? 'dark bg-night-bg text-slate-50' : 'bg-ono-50 text-slate-900'}`} dir="rtl">
      <nav className={`fixed top-0 w-full z-50 border-b backdrop-blur-xl transition-all duration-500 h-16 ${darkMode ? 'bg-night-nav/70 border-night-border' : 'bg-white/50 border-slate-200/60'}`}>
        <div className="max-w-7xl mx-auto h-full flex justify-between items-center px-6">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
              <ArrowRight size={16} /> לוח בקרה
            </button>
            <span className="opacity-20">|</span>
            <div className="flex items-center gap-3">
              <div className="bg-ono-600 p-2 rounded-xl text-white shadow-ono"><Layers size={16} /></div>
              <div>
                <h1 className="text-sm font-black tracking-tight">Ono Analytics Lab</h1>
                <p className="text-[9px] font-black text-ono-500 dark:text-ono-400 uppercase tracking-widest leading-none">הסתברות ודיאגרמות ון</p>
              </div>
            </div>
          </div>
          <button onClick={onToggleDark} className={`p-2.5 rounded-xl border transition-all active:scale-90 ${darkMode ? 'border-night-border bg-night-card/40' : 'border-ono-200 bg-white/50'}`}>
            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-ono-700" />}
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-8 pt-24">
        <aside className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto order-2 lg:order-none">
          <ExplainerPanel
            title="הסתברות ותורת הקבוצות"
            summary="מאורעות מתוארים בדיאגרמת ון. כל חישוב מתחיל בזיהוי המאורעות ואז בחירת הנוסחה המתאימה — חיתוך, איחוד, משלים או דה-מורגן."
            formulas={[
              { label: 'איחוד', formula: 'P(A∪B) = P(A) + P(B) − P(A∩B)' },
              { label: 'חיתוך (עצ׳)', formula: 'P(A∩B) = P(A)·P(B)' },
              { label: 'מותנית', formula: 'P(A|B) = P(A∩B) / P(B)' },
              { label: 'משלים', formula: 'P(Aᶜ) = 1 − P(A)' },
              { label: 'דה-מורגן ∪', formula: '(A∪B)ᶜ = Aᶜ∩Bᶜ' },
              { label: 'דה-מורגן ∩', formula: '(A∩B)ᶜ = Aᶜ∪Bᶜ' },
            ]}
            tips={[
              '"וגם" = חיתוך (∩) | "או" = איחוד (∪)',
              '"בלבד / אך לא" = עם מאורע משלים',
              'עצמאיים: P(A∩B) = P(A)·P(B)',
              'ודאו שסכום כל ההסתברויות = 1',
            ]}
          />
          <div className="bg-white/40 dark:bg-night-card/40 backdrop-blur-xl p-5 rounded-[1.5rem] border border-slate-200 dark:border-night-border">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp size={16} /> תהליך המחקר
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { id: 1, label: 'חילוץ הסתברויות בסיס (P)' },
                { id: 2, label: 'איתור החיתוך (Intersection)' },
                { id: 3, label: 'חישוב האיחוד (Union)' },
                { id: 4, label: 'דה-מורגן: P(Aᶜ∩Bᶜ)' },
                { id: 5, label: 'סימולציית בחינה' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setLevel(lvl.id)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 text-right ${level === lvl.id ? 'bg-ono-600 dark:bg-ono-700/70 text-white font-bold border border-ono-700 dark:border-ono-600/40' : level > lvl.id ? 'bg-slate-50 dark:bg-night-card2 border border-slate-200 dark:border-night-border text-slate-500 dark:text-slate-400 font-medium' : darkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-night-muted/40' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="text-sm">{lvl.id}. {lvl.label}</span>
                  {level > lvl.id ? <CheckCircle2 size={18} className="text-emerald-500" /> : lvl.id === 5 ? <GraduationCap size={18} /> : <Target size={18} className="opacity-50" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <NotesPanel topic="probability" level={level} darkMode={darkMode} />
          </div>
        </aside>

        <main className="lg:col-span-8 flex flex-col gap-6 order-1 lg:order-none">
          {data && level <= 4 && (
            <div className="bg-white/40 dark:bg-night-card/40 backdrop-blur-xl p-4 md:p-8 rounded-[2rem] border border-slate-200 dark:border-night-border shadow-glass relative overflow-hidden">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">ניהול סיכונים בפרויקט</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed bg-slate-50 dark:bg-night-card2 p-4 rounded-xl border border-slate-100 dark:border-night-border">
                בפרויקט IT, הסתברות ש<strong>פיתוח (A)</strong> יסיים בזמן:{' '}
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 rounded">{data.pA}</span>.{' '}
                הסתברות ש<strong>QA (B)</strong> יסיים בזמן:{' '}
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 rounded">{data.pB}</span>.{' '}
                שניהם יחד:{' '}
                <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 rounded">{data.intersect}</span>.
              </p>
              <div className="mt-6 bg-slate-50 dark:bg-night-card2 rounded-2xl border border-slate-200 dark:border-night-border p-4 shadow-inner relative min-h-[250px] flex items-center">
                <div className="absolute top-4 left-4 text-slate-400"><HelpCircle size={18} /></div>
                <canvas ref={canvasRef} width={800} height={260} className="w-full h-auto" />
              </div>
            </div>
          )}

          {level <= 3 && data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${step >= 1 ? 'border-emerald-500 bg-white dark:bg-night-card shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50'}`}>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-4">1. חילוץ נתונים</p>
                <div className="flex flex-col gap-4">
                  <MathDisplay label="Development">P(A) = <input type="number" value={inputs.pA} onChange={(e) => setInputs({ ...inputs, pA: e.target.value })} className="w-20 bg-slate-100 dark:bg-slate-800 font-mono text-center rounded outline-none focus:ring-1 ring-emerald-500" /></MathDisplay>
                  <MathDisplay label="Quality Assurance">P(B) = <input type="number" value={inputs.pB} onChange={(e) => setInputs({ ...inputs, pB: e.target.value })} className="w-20 bg-slate-100 dark:bg-slate-800 font-mono text-center rounded outline-none focus:ring-1 ring-emerald-500" /></MathDisplay>
                  {step === 1 && <button onClick={() => checkInput('base')} className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">אשר נתונים</button>}
                </div>
              </div>

              <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${step >= 2 ? 'border-ono-500 bg-white dark:bg-night-card shadow-ono' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50'}`}>
                <p className="font-bold text-ono-600 dark:text-ono-400 text-sm mb-4">2. חיתוך (AND)</p>
                <div className="flex flex-col gap-4">
                  <MathDisplay label="Both Teams">P(A ∩ B) = <input type="number" value={inputs.intersect} onChange={(e) => setInputs({ ...inputs, intersect: e.target.value })} className="w-24 bg-slate-100 dark:bg-slate-800 font-mono text-center rounded outline-none focus:ring-1 ring-ono-500" /></MathDisplay>
                  {step === 2 && <button onClick={() => checkInput('intersect')} className="mt-2 bg-ono-600 hover:bg-ono-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">הדגש אזור גרפי</button>}
                </div>
              </div>

              <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${step >= 3 ? 'border-ono-500 bg-white dark:bg-night-card shadow-ono' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50'}`}>
                <p className="font-bold text-ono-600 dark:text-ono-400 text-sm mb-2">3. איחוד (OR)</p>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-4 bg-slate-100 dark:bg-slate-800 p-2 rounded" dir="ltr">P(A)+P(B)-P(A∩B)</p>
                <div className="flex flex-col gap-4">
                  <MathDisplay label="At least one">P(A ∪ B) = <input type="number" value={inputs.union} onChange={(e) => setInputs({ ...inputs, union: e.target.value })} className="w-24 bg-slate-100 dark:bg-slate-800 font-mono text-center rounded outline-none focus:ring-1 ring-ono-500" /></MathDisplay>
                  {step === 3 && <button onClick={() => checkInput('union')} className="mt-2 bg-ono-600 hover:bg-ono-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">חשב פתרון</button>}
                </div>
              </div>
            </div>
          )}

          {level === 4 && data && (
            <div className="flex flex-col gap-5 fade-in">
              {/* De Morgan formula card */}
              <div className="p-6 md:p-8 rounded-[2rem] border-2 border-violet-400 dark:border-violet-600 bg-violet-50 dark:bg-night-card shadow-lg">
                <h4 className="font-bold mb-3 text-violet-700 dark:text-violet-400 text-lg flex items-center gap-2">
                  חוק דה-מורגן: (A∪B)ᶜ = Aᶜ∩Bᶜ
                </h4>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4">
                  הגרף מדגיש בסגול את <strong>האזור מחוץ לשני המאורעות</strong> — זה בדיוק Aᶜ∩Bᶜ.
                  לפי דה-מורגן: P(Aᶜ∩Bᶜ) = P((A∪B)ᶜ) = 1 − P(A∪B).
                </p>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 text-sm font-mono text-slate-600 dark:text-slate-300 mb-5" dir="ltr">
                  P(A∪B) = {data.pA} + {data.pB} − {data.intersect} = <strong>{data.union}</strong>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-3">חשבו: P(Aᶜ∩Bᶜ) = 1 − {data.union} = ?</p>
                {!deMorganCorrect && (
                  <div className="flex items-center gap-3 flex-wrap" dir="ltr">
                    <span className="font-mono font-bold text-violet-700 dark:text-violet-300 text-sm">P(Aᶜ∩Bᶜ) =</span>
                    <input
                      type="number"
                      value={inputs.deMorgan}
                      onChange={(e) => setInputs({ ...inputs, deMorgan: e.target.value })}
                      className="w-24 bg-slate-100 dark:bg-slate-700 font-mono text-center rounded-xl px-3 py-2 outline-none focus:ring-2 ring-violet-500 text-sm"
                      placeholder="0.00"
                    />
                    <button
                      onClick={checkDeMorgan}
                      className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                    >בדוק</button>
                  </div>
                )}
                {feedback.deMorgan === false && <p className="text-xs text-red-500 mt-2">נסו שוב — השתמשו בנוסחה 1 − P(A∪B)</p>}
                {deMorganCorrect && (
                  <div className="mt-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-xl p-3 flex items-center gap-2 fade-in">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <p className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                      נכון! P(Aᶜ∩Bᶜ) = {parseFloat((1 - data.union).toFixed(2))}
                    </p>
                  </div>
                )}
              </div>

              {/* Independence check bonus (shown after De Morgan is correct) */}
              {deMorganCorrect && (
                <div className="p-6 rounded-[2rem] border border-slate-200 dark:border-night-border bg-white dark:bg-night-card shadow-sm fade-in">
                  <h4 className="font-bold mb-3 text-slate-700 dark:text-slate-200 text-sm">בונוס: האם A ו-B עצמאיים?</h4>
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-sm mb-4" dir="ltr">
                    <p>P(A) × P(B) = {data.pA} × {data.pB} = <strong>{(data.pA * data.pB).toFixed(2)}</strong></p>
                    <p>P(A∩B) = <strong>{data.intersect}</strong></p>
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
                    האם {(data.pA * data.pB).toFixed(2)} ≈ {data.intersect}? (עצמאיים: P(A∩B) = P(A)·P(B))
                  </p>
                  {independenceAnswer === null && (
                    <div className="flex gap-3" dir="ltr">
                      <button onClick={() => checkIndependence(true)} className="bg-ono-600 hover:bg-ono-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors">כן — עצמאיים</button>
                      <button onClick={() => checkIndependence(false)} className="bg-slate-500 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors">לא — תלויים</button>
                    </div>
                  )}
                  {independenceAnswer !== null && (
                    <div className={`mt-3 p-3 rounded-xl text-sm font-bold fade-in ${independenceCorrect ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'}`}>
                      {independenceCorrect ? '✓ נכון! ניתוח מצוין.' : `✗ נסו שוב — השוו P(A)·P(B) ל-P(A∩B) בדיוק`}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {level === 5 && data && (
            <div className="bg-slate-900 dark:bg-night-card2 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden fade-in text-center border border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/50 to-transparent pointer-events-none" />
              <h2 className="text-3xl font-black mb-8 relative z-10 text-emerald-300">בחינה מסכמת</h2>
              <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl text-right relative z-10">
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
                    className="mt-8 w-full bg-ono-600 hover:bg-ono-500 text-white py-4 rounded-2xl font-black text-lg transition-colors"
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
