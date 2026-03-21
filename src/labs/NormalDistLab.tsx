import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Moon, Sun, CheckCircle2, Target,
  TrendingUp, GraduationCap, Layers,
  HelpCircle, Activity, ArrowRight
} from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { NotesPanel } from '../components/NotesPanel';
import { ExplainerPanel } from '../components/ExplainerPanel';

interface LabProps {
  darkMode: boolean;
  onToggleDark: () => void;
  onBack: () => void;
}

const MathDisplay = ({ children }: { children: React.ReactNode }) => (
  <div className="math-container py-4 my-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner overflow-x-auto transition-colors">
    <div className="text-2xl font-serif italic text-center text-slate-700 dark:text-ono-300" dir="ltr">
      {children}
    </div>
  </div>
);

const Z_RECORDS = [
  { z: 0.0, p: 0.5000 }, { z: 0.1, p: 0.5398 }, { z: 0.25, p: 0.5987 },
  { z: 0.5, p: 0.6915 }, { z: 0.67, p: 0.7486 }, { z: 0.84, p: 0.7995 },
  { z: 0.95, p: 0.8289 }, { z: 1.0, p: 0.8413 }, { z: 1.15, p: 0.8749 },
  { z: 1.28, p: 0.8997 }, { z: 1.5, p: 0.9332 }, { z: 1.65, p: 0.9505 },
  { z: 1.96, p: 0.9750 }, { z: 2.0, p: 0.9772 }, { z: 2.33, p: 0.9901 },
  { z: 2.5, p: 0.9938 }
];

const getPDF = (x: number, m: number, s: number) =>
  Math.exp(-0.5 * Math.pow((x - m) / s, 2)) / (s * Math.sqrt(2 * Math.PI));

const getCDF = (z: number) => {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
};

interface GameData {
  name: string;
  unit: string;
  mu: number;
  sigma: number;
  z: number;
  x: number;
  displayP: string;
  isAbove: boolean;
  target: string;
}

export function NormalDistLab({ darkMode, onToggleDark, onBack }: LabProps) {
  const { completeStage } = useProgressStore();

  const [level, setLevel] = useState(1);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState({ z: '', final: '' });
  const [feedback, setFeedback] = useState<{ z?: boolean; final?: boolean }>({});
  const [liveX, setLiveX] = useState<number | null>(null);
  const [buildPhase, setBuildPhase] = useState(0);
  const [buildInputs, setBuildInputs] = useState({ z: '', mu: '', left: '', right: '' });
  const [examProgress, setExamProgress] = useState(0);
  const [examOptions, setExamOptions] = useState<number[]>([]);
  const [examSelected, setExamSelected] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateOnoScenario = (lvl: number) => {
    const businessContexts = [
      { name: 'שכר עובדים', unit: '₪', mu_opts: [15000, 20000, 25000], sigma_opts: [2000, 4000, 5000] },
      { name: 'ציוני קורס מימון', unit: "נק'", mu_opts: [70, 75, 80], sigma_opts: [5, 8, 10] },
      { name: 'זמן טיפול במוקד', unit: "דק'", mu_opts: [12, 15, 20], sigma_opts: [2, 3, 4] },
    ];
    const ctx = businessContexts[Math.floor(Math.random() * businessContexts.length)];
    const mu = ctx.mu_opts[Math.floor(Math.random() * ctx.mu_opts.length)];
    const sigma = ctx.sigma_opts[Math.floor(Math.random() * ctx.sigma_opts.length)];
    const zEntry = Z_RECORDS[Math.floor(Math.random() * (Z_RECORDS.length - 4)) + 4];

    if (lvl === 4) {
      const xVal = parseFloat((mu + zEntry.z * sigma).toFixed(2));
      setGameData({ ...ctx, target: 'builder', mu, sigma, x: xVal, z: zEntry.z, displayP: (zEntry.p * 100).toFixed(2), isAbove: false });
      setBuildPhase(0);
      setBuildInputs({ z: '', mu: '', left: '', right: '' });
      return;
    }

    if (lvl === 5) {
      const targetX = parseFloat((mu + zEntry.z * sigma).toFixed(2));
      const options = [
        targetX,
        parseFloat((targetX + sigma).toFixed(2)),
        parseFloat((mu - zEntry.z * sigma).toFixed(2)),
        parseFloat((targetX - sigma / 2).toFixed(2)),
      ].sort(() => Math.random() - 0.5);
      setGameData({ ...ctx, target: 'exam', mu, sigma, x: targetX, z: zEntry.z, displayP: (zEntry.p * 100).toFixed(2), isAbove: false });
      setExamOptions(options);
      setExamProgress(0);
      setExamSelected(null);
      return;
    }

    let zActual = zEntry.z;
    if (lvl >= 2 && Math.random() > 0.5) zActual = -zEntry.z;
    const xVal = parseFloat((mu + zActual * sigma).toFixed(2));
    const isAbove = Math.random() > 0.5;
    let pArea = zActual >= 0 ? zEntry.p : (1 - zEntry.p);
    if (isAbove) pArea = 1 - pArea;

    setGameData({
      ...ctx, mu, sigma, z: zActual, x: xVal,
      displayP: (pArea * 100).toFixed(2),
      isAbove,
      target: lvl === 1 ? 'X' : (lvl === 2 ? 'mu' : 'sigma'),
    });
    setLiveX(xVal);
    setStep(1);
    setInputs({ z: '', final: '' });
    setFeedback({});
  };

  useEffect(() => generateOnoScenario(level), [level]);

  const dynamicZ = useMemo(() => {
    if (!gameData) return Z_RECORDS.slice(0, 7);
    const absZ = Math.abs(gameData.z);
    const idx = Z_RECORDS.findIndex((r) => Math.abs(r.z - absZ) < 0.1);
    const start = Math.max(0, (idx === -1 ? 5 : idx) - 3);
    return Z_RECORDS.slice(start, start + 7);
  }, [gameData]);

  useEffect(() => {
    if (!canvasRef.current || !gameData) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const { width: W, height: H } = canvas;
    ctx.clearRect(0, 0, W, H);

    const { mu, sigma, x, target } = gameData;
    const isSolved =
      (target === 'builder' && buildPhase === 3) ||
      (target === 'exam' && examProgress === 1) ||
      (target !== 'builder' && target !== 'exam' && step === 3);
    const currentX = target !== 'builder' && target !== 'exam' && isSolved && liveX !== null ? liveX : x;

    const xMin = mu - 3.5 * sigma, xMax = mu + 3.5 * sigma;
    const yMax = getPDF(mu, mu, sigma);
    const mapX = (v: number) => 60 + ((v - xMin) / (xMax - xMin)) * (W - 120);
    const mapY = (v: number) => H - 60 - (v / yMax) * (H - 100);

    const colorPrimary = darkMode ? '#38bdf8' : '#2563eb';
    const colorAxis = darkMode ? '#475569' : '#cbd5e1';

    let shadeStart = xMin, shadeEnd = currentX;
    if (target !== 'builder' && target !== 'exam') {
      shadeStart = gameData.isAbove ? currentX : xMin;
      shadeEnd = gameData.isAbove ? xMax : currentX;
    }

    if (target !== 'builder' || buildPhase >= 1) {
      ctx.beginPath();
      ctx.fillStyle = darkMode ? 'rgba(56,189,248,0.12)' : 'rgba(37,99,235,0.12)';
      ctx.moveTo(mapX(shadeStart), mapY(0));
      for (let i = shadeStart; i <= shadeEnd; i += sigma / 8) ctx.lineTo(mapX(i), mapY(getPDF(i, mu, sigma)));
      ctx.lineTo(mapX(shadeEnd), mapY(0));
      ctx.fill();
    }

    ctx.beginPath();
    ctx.strokeStyle = colorPrimary;
    ctx.lineWidth = 3;
    for (let i = xMin; i <= xMax; i += sigma / 8) {
      const px = mapX(i), py = mapY(getPDF(i, mu, sigma));
      i === xMin ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.strokeStyle = colorAxis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, H - 60);
    ctx.lineTo(W - 20, H - 60);
    ctx.stroke();

    ctx.font = 'bold 13px Heebo';
    ctx.textAlign = 'center';

    if (target !== 'builder' || buildPhase >= 2) {
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = colorAxis;
      ctx.beginPath();
      ctx.moveTo(mapX(mu), mapY(0));
      ctx.lineTo(mapX(mu), mapY(getPDF(mu, mu, sigma)));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = darkMode ? '#f8fafc' : '#1e293b';
      ctx.fillText(`μ = ${mu}`, mapX(mu), H - 25);
    }

    if (target !== 'builder' || buildPhase >= 1) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mapX(currentX), mapY(0));
      ctx.lineTo(mapX(currentX), mapY(getPDF(currentX, mu, sigma)));
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      const xLabel = (target === 'builder' && buildPhase < 1) || (target === 'X' && !isSolved) || (target === 'exam' && !isSolved) ? '?' : currentX.toFixed(0);
      ctx.fillText(`X = ${xLabel}`, mapX(currentX), mapY(getPDF(currentX, mu, sigma)) - 12);
    }

    let displayPct = gameData.displayP;
    if (target !== 'builder' && target !== 'exam' && isSolved && liveX !== null) {
      const currentZ = (currentX - mu) / sigma;
      let rawP = getCDF(currentZ);
      if (gameData.isAbove) rawP = 1 - rawP;
      displayPct = (rawP * 100).toFixed(1);
    }
    ctx.fillStyle = colorPrimary;
    ctx.fillText(`${displayPct}%`, mapX(gameData.isAbove ? mu + sigma : mu - sigma), mapY(yMax * 0.35));
  }, [gameData, darkMode, step, buildPhase, examProgress, liveX]);

  const handleCheckZ = () => {
    if (!gameData) return;
    if (Math.abs(parseFloat(inputs.z) - gameData.z) < 0.01) {
      setStep(2);
      setFeedback({ ...feedback, z: true });
    } else {
      setFeedback({ ...feedback, z: false });
    }
  };

  const handleCheckFinal = () => {
    if (!gameData) return;
    const targetVal = gameData.target === 'X' ? gameData.x : (gameData.target === 'mu' ? gameData.mu : gameData.sigma);
    if (Math.abs(parseFloat(inputs.final) - targetVal) < 0.5) {
      setStep(3);
      setFeedback({ ...feedback, final: true });
      completeStage('normalDistribution', level);
    } else {
      setFeedback({ ...feedback, final: false });
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-700 ${darkMode ? 'dark bg-night-bg text-slate-50' : 'bg-ono-50 text-slate-900'}`}
      dir="rtl"
    >
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
                <p className="text-[9px] font-black text-ono-500 dark:text-ono-400 uppercase tracking-widest leading-none">התפלגות נורמלית</p>
              </div>
            </div>
          </div>
          <button onClick={onToggleDark} className={`p-2.5 rounded-xl border transition-all active:scale-90 ${darkMode ? 'border-night-border bg-night-card/40' : 'border-ono-200 bg-white/50'}`}>
            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-ono-700" />}
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-8 pt-24 md:pt-24">
        <aside className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto order-2 lg:order-none">
          <ExplainerPanel
            title="התפלגות נורמלית"
            summary="עקומת הפעמון — סימטרית סביב הממוצע μ. לכל ערך X ניתן לחשב ציון תקן Z, לחפש בטבלה ולקבל הסתברות מצטברת. כשהשטח קטן מ-0.5 — השתמשו בכלל הסימטריה."
            formulas={[
              { label: 'ציון תקן', formula: 'Z = (X − μ) / σ' },
              { label: 'ערך X', formula: 'X = μ + Z·σ' },
              { label: 'חילוץ μ', formula: 'μ = X − Z·σ' },
              { label: 'חילוץ σ', formula: 'σ = (X − μ) / Z' },
              { label: 'סימטריה', formula: 'P(Z < −z) = 1 − P(Z < z)' },
            ]}
            tips={[
              'אם P < 0.5: חשבו P′ = 1−P, חפשו בטבלה, הוסיפו מינוס ל-Z',
              'כ-68% מהנתונים ב-μ±σ, כ-95% ב-μ±2σ',
              'ודאו מה נתון: X, Z, P, μ או σ — לפני כל חישוב',
              'Z = 0 ↔ X = μ (אחוזון 50%)',
            ]}
          />
          <div className={`p-5 rounded-[1.5rem] border ${darkMode ? 'bg-night-card/40 border-night-border' : 'bg-white/40 border-slate-200'} backdrop-blur-xl`}>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <TrendingUp size={13} /> מסלול הכשרה
            </h2>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 1, label: 'מציאת ערך (X)' },
                { id: 2, label: 'חילוץ ממוצע (μ)' },
                { id: 3, label: 'מציאת סיגמה (σ)' },
                { id: 4, label: 'בונה המודלים האקטיבי' },
                { id: 5, label: 'סימולציית בחינה' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setLevel(lvl.id)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 text-right ${level === lvl.id ? 'bg-ono-600 dark:bg-ono-700/70 text-white font-bold border border-ono-700 dark:border-ono-600/40' : level > lvl.id ? 'bg-slate-50 dark:bg-night-card2 border border-slate-200 dark:border-night-border text-slate-500 dark:text-slate-400 font-medium' : darkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-night-muted/40' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="text-sm">{lvl.id}. {lvl.label}</span>
                  {level > lvl.id ? <CheckCircle2 size={15} className={level === lvl.id ? 'text-white' : 'text-ono-500'} /> : <Target size={15} className="opacity-40" />}
                </button>
              ))}
            </div>
          </div>

          {/* Z-Table */}
          <div className={`p-5 rounded-[1.5rem] border ${darkMode ? 'bg-night-card/40 border-night-border' : 'bg-white/40 border-slate-200'} backdrop-blur-xl`}>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between items-center">
              <span>טבלת Z ממוקדת</span>
              <HelpCircle size={14} className="opacity-40" />
            </h3>
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl shadow-inner">
              <table className="w-full text-xs text-center" dir="ltr">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold uppercase">
                  <tr>
                    <th className="p-2 border-b">Z</th>
                    <th className="p-2 border-b">Area (P)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {dynamicZ.map((row, i) => (
                    <tr
                      key={i}
                      onClick={() => step === 1 && level <= 3 && setInputs({ ...inputs, z: row.z.toString() })}
                      className="hover:bg-ono-50 dark:hover:bg-ono-900/20 cursor-pointer transition-colors"
                    >
                      <td className="p-2 font-black text-ono-600 dark:text-ono-400">{row.z.toFixed(2)}</td>
                      <td className="p-2 opacity-60 font-medium">{row.p.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[9px] text-slate-400 mt-3 text-center italic">לחצו על שורה להעתקת Z.</p>
          </div>

          <div className="pt-2">
            <NotesPanel topic="normalDistribution" level={level} />
          </div>
        </aside>

        <main className="lg:col-span-8 flex flex-col gap-6 order-1 lg:order-none">
          {level <= 3 && gameData && (
            <div className="bg-white/40 dark:bg-night-card/40 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-200 dark:border-night-border shadow-glass relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ono-600/5 rounded-bl-[4rem]" />
              <p className="text-[10px] font-black text-ono-500 dark:text-ono-400 uppercase tracking-widest mb-3">תרחיש אקדמי</p>
              <p className="text-xl md:text-2xl font-bold leading-relaxed">
                בניתוח <strong className="italic">{gameData.name}</strong>, הממוצע הוא{' '}
                <span className="font-black text-ono-600 dark:text-ono-400">{gameData.mu}{gameData.unit}</span> וסטיית התקן{' '}
                <span className="font-black text-ono-600 dark:text-ono-400">{gameData.sigma}{gameData.unit}</span>.
                <br />ידוע כי <span className="font-black underline decoration-ono-200 decoration-4">{gameData.displayP}%</span>{' '}
                מהמדגם נמצאים {gameData.isAbove ? 'מעל' : 'מתחת'} ל-{level === 1 ? 'ערך X' : `${gameData.x}${gameData.unit}`}.
              </p>
              <div className="mt-5 flex items-center gap-2 py-3 px-5 bg-ono-50 dark:bg-ono-900/20 border border-ono-200 dark:border-ono-800/40 rounded-2xl w-fit">
                <HelpCircle size={16} className="text-ono-600 dark:text-ono-400" />
                <span className="font-bold text-ono-700 dark:text-ono-300 text-xs">
                  משימה: מצאו את {gameData.target === 'X' ? 'הערך X' : gameData.target === 'mu' ? 'הממוצע μ' : 'סטיית התקן σ'}.
                </span>
              </div>
            </div>
          )}

          {gameData && level <= 3 && parseFloat(gameData.displayP) < 50 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 flex gap-3 items-start fade-in">
              <span className="text-amber-500 text-xl shrink-0">⚠️</span>
              <div>
                <p className="font-black text-amber-800 dark:text-amber-300 text-sm">כלל הסימטריה נדרש!</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed" dir="ltr">
                  השטח {gameData.displayP}% קטן מ-50%. חפשו בטבלה P′ = {(100 - parseFloat(gameData.displayP)).toFixed(2)}% ← ואז הוסיפו מינוס (−) ל-Z שמצאתם.
                </p>
              </div>
            </div>
          )}

          {gameData && (
            <div className="bg-white/40 dark:bg-night-card/40 backdrop-blur-xl p-4 rounded-[2rem] border border-slate-200 dark:border-night-border shadow-glass">
              <canvas ref={canvasRef} width={900} height={320} className="w-full h-auto rounded-2xl canvas-glow" />
              {level <= 3 && step === 3 && (
                <div className="mt-4 p-4 bg-ono-50 dark:bg-ono-900/20 rounded-2xl border border-slate-200 dark:border-ono-800/50 fade-in">
                  <h4 className="text-xs font-bold text-ono-700 dark:text-ono-300 flex items-center gap-2 mb-3">
                    <Activity size={16} /> חווית שינוי חיה
                  </h4>
                  <input
                    type="range"
                    min={gameData.mu - 3.5 * gameData.sigma}
                    max={gameData.mu + 3.5 * gameData.sigma}
                    step={gameData.sigma / 10}
                    value={liveX ?? gameData.x}
                    onChange={(e) => setLiveX(parseFloat(e.target.value))}
                    className="w-full h-2 bg-ono-200 dark:bg-ono-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}

          {level <= 3 && gameData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-6 rounded-3xl border-2 transition-all ${step === 1 ? 'border-ono-600 bg-white dark:bg-night-card shadow-ono' : 'opacity-40 grayscale pointer-events-none'}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 text-ono-600 dark:text-ono-400">01. זיהוי ציון תקן</h4>
                <div className="flex flex-col gap-3" dir="ltr">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-ono-600 dark:text-ono-400 italic">Z=</span>
                    <input type="number" value={inputs.z} onChange={(e) => setInputs({ ...inputs, z: e.target.value })} className="w-20 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-center text-xl font-bold border outline-none" placeholder="?" />
                  </div>
                  <button onClick={handleCheckZ} className="w-full bg-ono-600 hover:bg-ono-700 text-white py-3 rounded-xl font-black text-sm active:scale-95 transition-all">אימות Z</button>
                  {feedback.z === false && <p className="text-red-500 text-[10px] font-bold text-center" dir="rtl">טעות. חפשו בטבלה.</p>}
                </div>
              </div>

              <div className={`p-6 rounded-3xl border-2 transition-all ${step === 2 ? 'border-ono-500 bg-white dark:bg-night-card shadow-ono' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 text-ono-600 dark:text-ono-400">02. חישוב סופי</h4>
                <div className="mb-4">
                  <MathDisplay>
                    <span dir="ltr">{gameData.z} = ({gameData.target === 'X' ? 'X' : gameData.x} - {gameData.target === 'mu' ? 'μ' : gameData.mu}) / {gameData.target === 'sigma' ? 'σ' : gameData.sigma}</span>
                  </MathDisplay>
                </div>
                <div className="flex flex-col gap-3" dir="ltr">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-ono-600 dark:text-ono-400">
                      {gameData.target === 'mu' ? 'μ' : gameData.target === 'sigma' ? 'σ' : 'X'}=
                    </span>
                    <input type="number" value={inputs.final} onChange={(e) => setInputs({ ...inputs, final: e.target.value })} className="w-24 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl text-center text-xl font-bold border outline-none" />
                  </div>
                  <button onClick={handleCheckFinal} className="w-full bg-ono-600 hover:bg-ono-700 text-white py-3 rounded-xl font-black text-sm active:scale-95 transition-all">בדוק תוצאה</button>
                  {feedback.final === false && <p className="text-red-500 text-[10px] font-bold text-center" dir="rtl">שגוי — בדוק את סדר הפעולות.</p>}
                </div>
              </div>
            </div>
          )}

          {level === 4 && gameData && (
            <div className="flex flex-col gap-4 fade-in">
              <div className="bg-gradient-to-l from-ono-600 to-ono-700 text-white p-6 rounded-[2rem] shadow-ono-lg">
                <h2 className="text-2xl font-black mb-1">בונה המודלים הרנדומלי</h2>
                <p className="opacity-90 text-sm">
                  ציון <strong>{gameData.x}</strong> מקביל לאחוזון ה-<strong>{gameData.displayP}%</strong>. בנו את הגרף שלב אחר שלב!
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-2xl border-2 transition-all ${buildPhase === 0 ? 'border-ono-500 bg-white dark:bg-slate-800 shadow-md' : 'opacity-40 grayscale bg-slate-50 dark:bg-slate-900 border-slate-100'}`}>
                  <p className="text-xs font-bold mb-3">1. הזינו את ה-Z המתאים:</p>
                  <div className="flex items-center gap-2" dir="ltr">
                    <span className="font-bold text-sm text-ono-600">Z =</span>
                    <input type="number" value={buildInputs.z} onChange={(e) => setBuildInputs({ ...buildInputs, z: e.target.value })} className="w-16 p-1.5 rounded-lg border text-center font-bold bg-slate-50 dark:bg-slate-800" />
                    <button onClick={() => parseFloat(buildInputs.z) === gameData.z && setBuildPhase(1)} className="bg-ono-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">צייר</button>
                  </div>
                </div>
                {buildPhase >= 1 && (
                  <div className={`p-5 rounded-2xl border-2 transition-all ${buildPhase === 1 ? 'border-ono-500 bg-white dark:bg-slate-800 shadow-md' : 'opacity-40 grayscale bg-slate-50 dark:bg-slate-900 border-slate-100'}`}>
                    <p className="text-xs font-bold mb-3">2. מהו הממוצע?</p>
                    <div className="flex items-center gap-2" dir="ltr">
                      <span className="font-bold text-sm text-ono-600">μ =</span>
                      <input type="number" value={buildInputs.mu} onChange={(e) => setBuildInputs({ ...buildInputs, mu: e.target.value })} className="w-16 p-1.5 rounded-lg border text-center font-bold bg-slate-50 dark:bg-slate-800" />
                      <button onClick={() => parseFloat(buildInputs.mu) === gameData.mu && setBuildPhase(2)} className="bg-ono-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">קבע</button>
                    </div>
                  </div>
                )}
                {buildPhase >= 2 && (
                  <div className={`p-5 rounded-2xl border-2 transition-all ${buildPhase === 2 ? 'border-ono-500 bg-white dark:bg-slate-800 shadow-md' : 'opacity-40 grayscale bg-slate-50 dark:bg-slate-900 border-slate-100'}`}>
                    <p className="text-xs font-bold mb-3">3. השלם גבולות (μ±σ):</p>
                    <div className="flex items-center gap-1" dir="ltr">
                      <input type="number" value={buildInputs.left} onChange={(e) => setBuildInputs({ ...buildInputs, left: e.target.value })} className="w-14 p-1.5 rounded-lg border text-center font-bold text-xs bg-slate-50 dark:bg-slate-800" />
                      <span className="text-slate-400">..</span>
                      <input type="number" value={buildInputs.right} onChange={(e) => setBuildInputs({ ...buildInputs, right: e.target.value })} className="w-14 p-1.5 rounded-lg border text-center font-bold text-xs bg-slate-50 dark:bg-slate-800" />
                      <button
                        onClick={() => {
                          if (parseFloat(buildInputs.left) === gameData.mu - gameData.sigma && parseFloat(buildInputs.right) === gameData.mu + gameData.sigma) {
                            setBuildPhase(3);
                            completeStage('normalDistribution', 4);
                          }
                        }}
                        className="bg-ono-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold ml-1"
                      >סיים</button>
                    </div>
                  </div>
                )}
                {buildPhase === 3 && (
                  <div className="col-span-1 md:col-span-3 p-4 bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 rounded-2xl text-center fade-in">
                    <h3 className="text-lg font-black text-emerald-800 dark:text-emerald-300">המודל הושלם בהצלחה! 🎉</h3>
                  </div>
                )}
              </div>
            </div>
          )}

          {level === 5 && gameData && (
            <section className="bg-white/40 dark:bg-night-card/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-night-border shadow-glass fade-in">
              <h2 className="text-2xl font-black mb-6 text-center text-ono-700 dark:text-ono-300">בחינה מסכמת</h2>
              <div className="space-y-6">
                <div className="bg-ono-50 dark:bg-night-card p-6 rounded-2xl border border-slate-200 dark:border-night-border">
                  <p className="text-base font-medium leading-relaxed">
                    נתוני {gameData.name} מתפלגים נורמלית עם תוחלת {gameData.mu}{gameData.unit} וסטיית תקן {gameData.sigma}{gameData.unit}.
                    <br /><br />
                    <strong>מהו הערך המייצג את האחוזון ה-{Math.round(parseFloat(gameData.displayP))}?</strong>
                  </p>
                  <p className="text-xs text-slate-500 mt-3">(רמז: P={(parseFloat(gameData.displayP) / 100).toFixed(4)} בטבלה)</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" dir="ltr">
                  {examOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setExamSelected(opt)}
                      className={`p-4 rounded-xl border-2 font-bold text-lg transition-all ${examSelected === opt ? 'border-ono-600 bg-ono-100 dark:bg-ono-900/30 text-ono-800 dark:text-ono-200' : 'border-slate-200 dark:border-night-border hover:border-ono-400 dark:hover:border-ono-600 bg-slate-50 dark:bg-night-card'}`}
                    >{opt}</button>
                  ))}
                </div>
                {examSelected !== null && examProgress === 0 && (
                  <button
                    onClick={() => {
                      if (examSelected === gameData.x) {
                        setExamProgress(1);
                        completeStage('normalDistribution', 5);
                      } else {
                        setExamProgress(-1);
                      }
                    }}
                    className="w-full bg-ono-600 hover:bg-ono-700 text-white py-4 rounded-xl font-bold text-lg transition-colors"
                  >הגש תשובה</button>
                )}
                {examProgress === 1 && (
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500 rounded-2xl text-center fade-in">
                    <span className="text-4xl block mb-2">🏆</span>
                    <h3 className="text-xl font-black text-emerald-700 dark:text-emerald-400">תשובה נכונה!</h3>
                    <button onClick={() => generateOnoScenario(level)} className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold">שאלה נוספת</button>
                  </div>
                )}
                {examProgress === -1 && (
                  <div className="text-center mt-4 fade-in">
                    <p className="text-red-500 font-bold mb-3">שגוי. נסו: X = μ + Z×σ</p>
                    <button onClick={() => setExamProgress(0)} className="text-ono-600 dark:text-ono-400 font-bold underline">נסה שוב</button>
                  </div>
                )}
              </div>
            </section>
          )}

          {step === 3 && level <= 3 && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-400 flex items-center justify-between fade-in shadow-md">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500 text-white p-3 rounded-full"><CheckCircle2 size={28} /></div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">תשובה נכונה!</h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">שנה ערכים בסליידר למעלה לראות את השינוי בגרף</p>
                </div>
              </div>
              <button onClick={() => generateOnoScenario(level)} className="bg-slate-900 dark:bg-slate-700 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform">
                תרגיל נוסף
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
