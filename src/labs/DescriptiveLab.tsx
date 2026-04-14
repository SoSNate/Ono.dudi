import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, Target,
  TrendingUp, Activity, GraduationCap,
  BarChart2, ArrowRight
} from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { NotesPanel } from '../components/NotesPanel';
import { ExplainerPanel } from '../components/ExplainerPanel';
import ConceptCard from '../components/ConceptCard';
import { ThemeSelector } from '../components/ThemeSelector';
import { useTheme } from '../context/ThemeContext';
import { MathFraction } from '../utils/mathHelpers';
import { WhyBridge } from '../components/WhyBridge';
import { FrequencyTableBuilder } from '../components/FrequencyTableBuilder';

// ── שאלות מבחן אמיתיות מהמבחן לדוגמה של ד"ר מיליאבסקי ──
const EXAM_QUESTIONS = [
  {
    question: 'בבית חולים ציבורי נמדדו: מחלקה (רפואה פנימית, כירורגיה, מיון), ותק רפואי (זוטר, בינוני, בכיר), מספר תורנויות בשבוע, גיל הצוות. מהם סולמות המדידה?',
    options: [
      'איכותי שמי, איכותי סדר, כמותי בדיד, כמותי רציף',
      'איכותי שמי, איכותי סדר, כמותי רציף, כמותי בדיד',
      'איכותי שמי, איכותי שמי, כמותי בדיד, כמותי רציף',
      'כמותי בדיד, איכותי סדר, כמותי בדיד, כמותי רציף',
    ],
    correct: 0,
    explanation: 'מחלקה = שמי (אין דירוג), ותק = סדר (יש דירוג), תורנויות = בדיד (ספירה שלמה), גיל = רציף (מדידה רציפה)',
  },
  {
    question: 'נתוני משקל ילדים: 40, 40, 45, 45, 50, 50, 50, 55, 60. ערכי השכיח והחציון הם:',
    options: ['שכיח: 50, חציון: 50', 'שכיח: 50, חציון: 45', 'שכיח: 45, חציון: 50', 'שכיח: 45, חציון: 45'],
    correct: 0,
    explanation: '9 ערכים מסודרים — החציון הוא הערך ה-5 (50). השכיח הוא 50 כי הוא מופיע 3 פעמים.',
  },
  {
    question: 'נתון שכר חודשי: שכר 6 (10 עובדים), 7 (20), 8 (30), 9 (15), 10 (5). מהו השכר הממוצע?',
    options: ['7,700 ₪', '8,000 ₪', '8,200 ₪', '7,500 ₪'],
    correct: 0,
    explanation: 'X̄ = (6×10 + 7×20 + 8×30 + 9×15 + 10×5) / 80 = 616/80 = 7.7 אלף ₪',
  },
  {
    question: 'באותו נתון שכר — מה העשירון השלישי (D3)?',
    options: ['7,000 ₪', '6,000 ₪', '8,000 ₪', '9,000 ₪'],
    correct: 0,
    explanation: 'D3 = הערך שמתחתיו 30% מהנתונים. שכיחות מצטברת עד 7 = 30/80 = 37.5% — לכן D3 = 7,000',
  },
  {
    question: 'במשרד ממשלתי: ממוצע=70, חציון=75, שכיח=80. מהי צורת ההתפלגות?',
    options: ['א-סימטרית שמאלית', 'א-סימטרית ימנית', 'סימטרית חד-שיאית', 'סימטרית דו-שיאית'],
    correct: 0,
    explanation: 'כשממוצע < חציון < שכיח — ה"זנב" ארוך משמאל → התפלגות שמאלית (שלילית)',
  },
  {
    question: 'נתון: ציוני בחינה 60, 65, 70, 75, 80, 85, 90, 95. מהו הטווח הבין-רבעוני (IQR)?',
    options: ['20', '15', '25', '35'],
    correct: 0,
    explanation: 'Q1 = ממוצע הערך ה-2 וה-3 = (65+70)/2 = 67.5. Q3 = ממוצע הערך ה-6 וה-7 = (85+90)/2 = 87.5. IQR = 87.5 - 67.5 = 20',
  },
  {
    question: 'נתונים מקובצים: [0-10] תדירות 5, [10-20] תדירות 10, [20-30] תדירות 15. מהו הממוצע המשוקלל?',
    options: ['18.3', '15', '20', '16.7'],
    correct: 0,
    explanation: 'מרכז כל קבוצה: 5, 15, 25. X̄ = (5×5 + 15×10 + 25×15)/30 = (25+150+375)/30 = 550/30 ≈ 18.3',
  },
  {
    question: 'סטיית התקן של 4, 6, 8, 10, 12 היא:',
    options: ['2.83', '2', '3.16', '4'],
    correct: 0,
    explanation: 'X̄ = 8. סכום הריבועים: (16+4+0+4+16)/5 = 40/5 = 8. סטיית תקן = √8 ≈ 2.83',
  },
];


interface LabProps {
  onBack: () => void;
}

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

interface FrequencyInterval {
  lower: number;
  upper: number;
  fi: number;
  width: number;
  di: number;
  midpoint: number;
}

interface FrequencyScenario {
  intervals: FrequencyInterval[];
  n: number;
  highlightIdx: number;
  modeIdx: number;
  groupedMean: number;
}

const generateFrequencyData = (): FrequencyScenario => {
  const structure = [
    { lower: 10, upper: 20 },
    { lower: 20, upper: 30 },
    { lower: 30, upper: 50 },
    { lower: 50, upper: 80 },
  ];

  const intervals: FrequencyInterval[] = structure.map((s) => {
    const width = s.upper - s.lower;
    const fi = 5 + Math.floor(Math.random() * 12);
    const di = parseFloat((fi / width).toFixed(2));
    const midpoint = (s.lower + s.upper) / 2;
    return { lower: s.lower, upper: s.upper, fi, width, di, midpoint };
  });

  const n = intervals.reduce((acc, iv) => acc + iv.fi, 0);

  const modeIdx = intervals.reduce(
    (maxIdx, iv, idx, arr) => (iv.di > arr[maxIdx].di ? idx : maxIdx),
    0
  );

  const groupedMean = parseFloat(
    (intervals.reduce((acc, iv) => acc + iv.midpoint * iv.fi, 0) / n).toFixed(2)
  );

  const candidates = intervals.map((_, i) => i).filter(i => i !== modeIdx);
  const highlightIdx = candidates[Math.floor(Math.random() * candidates.length)];

  return { intervals, n, highlightIdx, modeIdx, groupedMean };
};

export function DescriptiveLab({ onBack }: LabProps) {
  const { resolveVar, isDark } = useTheme();
  const { completeStage } = useProgressStore();

  const [level, setLevel] = useState(1);
  const [data, setData] = useState<ScenarioData | null>(null);
  const [freqScenario, setFreqScenario] = useState<FrequencyScenario | null>(null);
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState({ mean: '', median: '', variance: '' });
  const [feedback, setFeedback] = useState<Record<string, boolean>>({});
  const [freqInputs, setFreqInputs] = useState({ di: '', mean: '' });
  const [freqFeedback, setFreqFeedback] = useState<Record<string, boolean>>({});
  const [selectedModeIdx, setSelectedModeIdx] = useState<number | null>(null);
  const [examOptions, setExamOptions] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [examProgress, setExamProgress] = useState(0);
  const [examQIdx, setExamQIdx] = useState(0);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [freqMode, setFreqMode] = useState<'raw' | 'freq'>('raw');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateScenario = (lvl: number) => {
    // Reset freq state always
    setFreqScenario(null);
    setFreqInputs({ di: '', mean: '' });
    setFreqFeedback({});
    setSelectedModeIdx(null);
    setFreqMode('raw');

    // Level 1: always generate freqScenario for the toggle (both modes available)
    if (lvl === 1) {
      const freq = generateFrequencyData();
      setFreqScenario(freq);
    }

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
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { width: W, height: H } = canvasRef.current;
    ctx.clearRect(0, 0, W, H);

    const colorPrimary = isDark ? '#f97316' : '#ea580c';
    const colorAxis = resolveVar('--canvas-axis');
    const colorText = resolveVar('--canvas-text');

    // Frequency / density histogram mode
    if (freqScenario && level <= 3) {
      const padX = 55;
      const padY = 35;
      const bottomPad = 40;
      const maxDi = Math.max(...freqScenario.intervals.map(iv => iv.di));
      const allLower = freqScenario.intervals[0].lower;
      const allUpper = freqScenario.intervals[freqScenario.intervals.length - 1].upper;
      const sX = (v: number) => padX + ((v - allLower) / (allUpper - allLower)) * (W - padX - 20);
      const sH = (di: number) => (di / maxDi) * (H - padY - bottomPad);

      // Axis
      ctx.strokeStyle = colorAxis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padX, padY);
      ctx.lineTo(padX, H - bottomPad);
      ctx.lineTo(W - 20, H - bottomPad);
      ctx.stroke();

      // Bars
      freqScenario.intervals.forEach((iv, idx) => {
        const x = sX(iv.lower);
        const barW = sX(iv.upper) - sX(iv.lower) - 1;
        const barH = sH(iv.di);
        const y = H - bottomPad - barH;
        const isMode = idx === freqScenario.modeIdx;
        const isHighlight = idx === freqScenario.highlightIdx;

        const accentLine = resolveVar('--canvas-line');
        const warnColor = resolveVar('--accent-warning');
        ctx.fillStyle = isMode
          ? resolveVar('--canvas-fill')
          : isHighlight
          ? (isDark ? 'rgba(251,191,36,0.40)' : 'rgba(251,191,36,0.30)')
          : resolveVar('--canvas-fill-alt');
        ctx.fillRect(x, y, barW, barH);
        ctx.strokeStyle = isHighlight ? warnColor : accentLine;
        ctx.lineWidth = isHighlight ? 2.5 : 1.5;
        ctx.strokeRect(x, y, barW, barH);

        // Label dᵢ on bar if feedback correct
        if (freqFeedback.di) {
          ctx.fillStyle = isMode ? accentLine : colorText;
          ctx.font = `bold ${isMode ? 13 : 11}px Heebo`;
          ctx.textAlign = 'center';
          ctx.fillText(`d=${iv.di}`, x + barW / 2, y - 6);
        }

        // X-axis tick label
        ctx.fillStyle = colorText;
        ctx.font = '11px Heebo';
        ctx.textAlign = 'center';
        ctx.fillText(String(iv.lower), x, H - bottomPad + 16);
      });
      const lastIv = freqScenario.intervals[freqScenario.intervals.length - 1];
      ctx.fillStyle = colorText;
      ctx.font = '11px Heebo';
      ctx.textAlign = 'center';
      ctx.fillText(String(lastIv.upper), sX(lastIv.upper), H - bottomPad + 16);

      // Y-axis label
      ctx.fillStyle = colorAxis;
      ctx.font = '11px Heebo';
      ctx.textAlign = 'right';
      ctx.fillText('dᵢ', padX - 5, padY);

      // Mode label
      if (freqFeedback.mode) {
        const modeIv = freqScenario.intervals[freqScenario.modeIdx];
        const mx = sX(modeIv.lower) + (sX(modeIv.upper) - sX(modeIv.lower)) / 2;
        ctx.fillStyle = resolveVar('--canvas-line');
        ctx.font = 'bold 13px Heebo';
        ctx.textAlign = 'center';
        ctx.fillText('מוד', mx, H - bottomPad - sH(modeIv.di) - 18);
      }
      return;
    }

    const padX = 40;
    const padY = 40;
    if (!data) return;
    const minX = Math.floor(data.min / 10) * 10 - 10;
    const maxX = Math.ceil(data.max / 10) * 10 + 10;
    const sX = (val: number) => padX + ((val - minX) / (maxX - minX)) * (W - padX * 2);

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
      ctx.fillStyle = isDark ? 'rgba(249,115,22,0.2)' : 'rgba(234,88,12,0.1)';
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
        ctx.strokeStyle = isDark ? 'rgba(249,115,22,0.3)' : 'rgba(234,88,12,0.3)';
        ctx.lineWidth = 4;
        ctx.stroke();
      });
      const meanColor = resolveVar('--accent-success');
      const medianColor = isDark ? '#c084fc' : '#9333ea';
      if (step > 1) {
        ctx.strokeStyle = meanColor;
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sX(data.mean), H - padY);
        ctx.lineTo(sX(data.mean), padY);
        ctx.stroke();
        ctx.fillStyle = meanColor;
        ctx.fillText(`X̄=${data.mean}`, sX(data.mean), padY - 10);
        ctx.setLineDash([]);
      }
      if (step > 2) {
        ctx.strokeStyle = medianColor;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(sX(data.median), H - padY);
        ctx.lineTo(sX(data.median), padY + 15);
        ctx.stroke();
        ctx.fillStyle = medianColor;
        ctx.fillText(`Me=${data.median}`, sX(data.median), padY + 5);
        ctx.setLineDash([]);
      }
    }
  }, [data, freqScenario, isDark, step, level, freqFeedback, resolveVar]);

  const checkInput = (type: 'mean' | 'median' | 'variance') => {
    if (!data) return;
    let isCorrect = false;
    if (type === 'mean') isCorrect = Math.abs(parseFloat(inputs.mean) - data.mean) < 0.2;
    if (type === 'median') isCorrect = parseFloat(inputs.median) === data.median;
    if (type === 'variance') isCorrect = Math.abs(parseFloat(inputs.variance) - data.variance) < 1.0;

    setAttempts(prev => ({ ...prev, [type]: (prev[type] || 0) + 1 }));
    setFeedback({ ...feedback, [type]: isCorrect });
    if (isCorrect) {
      completeStage('descriptive', step);
      setStep((prev) => prev + 1);
    }
  };

  const checkFreqDi = () => {
    if (!freqScenario) return;
    const expected = freqScenario.intervals[freqScenario.highlightIdx].di;
    const isCorrect = Math.abs(parseFloat(freqInputs.di) - expected) < 0.05;
    setFreqFeedback(prev => ({ ...prev, di: isCorrect }));
    if (isCorrect) {
      completeStage('descriptive', 1);
      setStep(2);
    }
  };

  const checkFreqMode = (idx: number) => {
    if (!freqScenario || step !== 2) return;
    setSelectedModeIdx(idx);
    const isCorrect = idx === freqScenario.modeIdx;
    setFreqFeedback(prev => ({ ...prev, mode: isCorrect }));
    if (isCorrect) {
      completeStage('descriptive', 2);
      setStep(3);
    }
  };

  const checkFreqMean = () => {
    if (!freqScenario) return;
    const isCorrect = Math.abs(parseFloat(freqInputs.mean) - freqScenario.groupedMean) < 0.5;
    setFreqFeedback(prev => ({ ...prev, mean: isCorrect }));
    if (isCorrect) {
      completeStage('descriptive', 3);
      setStep(4);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-700 bg-ono-50 text-slate-900 dark:bg-night-bg dark:text-slate-50"
      dir="rtl"
    >
      <nav className="focus-hide fixed top-0 w-full z-50 border-b backdrop-blur-xl transition-all duration-500 h-16 bg-white/50 border-slate-200/60 dark:bg-night-nav/70 dark:border-night-border">
        <div className="max-w-7xl mx-auto h-full flex justify-between items-center px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm font-bold transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <ArrowRight size={16} /> לוח בקרה
            </button>
            <span className="opacity-20">|</span>
            <div className="flex items-center gap-3">
              <div className="bg-ono-600 p-2 rounded-xl text-white shadow-ono">
                <BarChart2 size={16} />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight">Ono Analytics Lab</h1>
                <p className="text-[9px] font-black text-ono-500 dark:text-ono-400 uppercase tracking-widest leading-none">סטטיסטיקה תיאורית</p>
              </div>
            </div>
          </div>
          <ThemeSelector />
        </div>
      </nav>

      <div className="lab-wrap max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-8 pt-24">
        {/* Sidebar */}
        <aside className="focus-hide lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto order-2 lg:order-none">
          <ExplainerPanel
            title="סטטיסטיקה תיאורית"
            summary="מדדי מרכז (ממוצע, חציון) ומדדי פיזור (שונות, IQR). כשהרווחים אינם שווים — חובה להשתמש בצפיפות dᵢ ולא בתדירות גולמית. Box Plot חושף את צורת ההתפלגות."
            formulas={[
              { label: 'ממוצע', formula: 'X̄ = ΣX / n' },
              { label: 'שונות (מדגם)', formula: 'S² = Σ(X − X̄)² / (n−1)' },
              { label: 'סטיית תקן', formula: 'S = √S²' },
              { label: 'IQR', formula: 'IQR = Q3 − Q1' },
              { label: 'צפיפות', formula: 'dᵢ = fᵢ / Lᵢ' },
              { label: 'ממוצע משוקלל', formula: 'X̄ = Σ(mᵢ·fᵢ) / n' },
            ]}
            tips={[
              'רווחים לא שווים? השתמשו בצפיפות dᵢ = fᵢ/Lᵢ — המוד = max d',
              'Mean > Median → עיוות חיובי (ימני)',
              'Mean < Median → עיוות שלילי (שמאלי)',
              'חציון עמיד בפני חריגים — ממוצע לא',
            ]}
          />

          <div className="bg-white/40 dark:bg-night-card/40 backdrop-blur-xl p-5 rounded-[1.5rem] border border-slate-200 dark:border-night-border">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <TrendingUp size={16} /> תהליך המחקר
            </h2>
            <div className="flex flex-col gap-3">
              {[
                { id: 1, label: 'חישוב ממוצע / צפיפות (dᵢ)' },
                { id: 2, label: 'מציאת חציון (Me)' },
                { id: 3, label: 'שונות (S²) וסטיית תקן (S)' },
                { id: 4, label: 'בניית Box Plot' },
                { id: 5, label: 'סימולציית בחינה אקדמית' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setLevel(lvl.id)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 text-right ${level === lvl.id ? 'bg-ono-600 dark:bg-ono-700/70 text-white font-bold border border-ono-700 dark:border-ono-600/40' : level > lvl.id ? 'bg-slate-50 dark:bg-night-card2 border border-slate-200 dark:border-night-border text-slate-500 dark:text-slate-400 font-medium' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-night-muted/40'}`}
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
            <div className="bg-white/40 dark:bg-night-card/40 backdrop-blur-xl p-5 rounded-[1.5rem] border border-slate-200 dark:border-night-border">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">תצפיות המדגם (N={data.n})</h2>
              <div className="flex flex-wrap gap-2 justify-center bg-slate-50 dark:bg-night-card2 p-4 rounded-xl border border-slate-100 dark:border-night-border" dir="ltr">
                {(step >= 2 ? data.sorted : data.raw).map((val, idx) => (
                  <span key={idx} className="font-mono text-lg font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-night-card border dark:border-night-border px-3 py-1 rounded-lg shadow-sm">
                    {val}
                  </span>
                ))}
              </div>
              {step >= 2 && <p className="text-[10px] text-center mt-3 text-slate-400">הנתונים מוינו כדי לסייע במציאת החציון.</p>}
            </div>
          )}

          <div className="pt-2">
            <NotesPanel
                topic="descriptive"
                level={step}
                moduleName="סטטיסטיקה תיאורית"
                renderedData={data ? { ...data } : {}}
              />
          </div>
        </aside>

        {/* Main Content */}
        <main className="focus-center lg:col-span-8 flex flex-col gap-6 order-1 lg:order-none">

          {/* Mode toggle — level 1 only */}
          {level === 1 && (
            <div className="flex gap-2 p-1 rounded-2xl border bg-slate-100/70 dark:bg-night-card/60 border-slate-200 dark:border-night-border w-fit">
              <button
                onClick={() => setFreqMode('raw')}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${freqMode === 'raw' ? 'bg-ono-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
              >נתונים גולמיים</button>
              <button
                onClick={() => setFreqMode('freq')}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${freqMode === 'freq' ? 'bg-ono-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
              >טבלת שכיחות</button>
            </div>
          )}

          {/* Frequency Table Builder — level 1, freq mode */}
          {level === 1 && freqMode === 'freq' && freqScenario && (
            <div className="bg-white/40 dark:bg-night-card/40 backdrop-blur-xl p-4 md:p-8 rounded-[2rem] border border-slate-200 dark:border-night-border shadow-sm fade-in">
              <h2 className="font-serif text-xl md:text-2xl font-bold mb-2">בניית טבלת שכיחות</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-5">בנו את הטבלה שלב אחר שלב — כל עמודה נפתחת אחרי שמאמתים את הקודמת.</p>
              <FrequencyTableBuilder
                intervals={freqScenario.intervals.map(iv => ({ lower: iv.lower, upper: iv.upper, fi: iv.fi, midpoint: iv.midpoint }))}
                n={freqScenario.n}
                onComplete={() => completeStage('descriptive', 1)}
              />
            </div>
          )}

          {/* Scenario card + canvas — raw data mode */}
          {data && level <= 4 && !(level === 1 && freqMode === 'freq') && (
            <div className="bg-white/40 dark:bg-night-card/40 backdrop-blur-xl p-4 md:p-8 rounded-[2rem] border border-slate-200 dark:border-night-border shadow-sm">
              <h2 className="font-serif text-xl md:text-2xl font-bold mb-3">{data.name}</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                לפניכם אוסף של תצפיות גולמיות. בשלבים הבאים נשתמש במדדי מרכז ופיזור כדי להבין את התפלגות הנתונים, ולאחר מכן נבנה תרשים קופסה (Box Plot) ויזואלי.
              </p>
              {step >= 2 && <div className="mt-4"><WhyBridge topic="descriptive" /></div>}
              <div className="mt-6 bg-slate-50 dark:bg-night-card2 rounded-2xl border border-slate-200 dark:border-night-border p-4 shadow-inner min-h-[250px] flex items-center">
                <canvas ref={canvasRef} width={900} height={300} className="w-full h-auto canvas-glow" />
              </div>
            </div>
          )}

          {/* Frequency table mode — scenario card + canvas (levels 2-3, or level 1 legacy mode) */}
          {freqScenario && level <= 3 && !(level === 1 && freqMode === 'freq') && (
            <div className="bg-white/40 dark:bg-night-card/40 backdrop-blur-xl p-4 md:p-8 rounded-[2rem] border border-slate-200 dark:border-night-border shadow-sm">
              <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
                <h2 className="font-serif text-xl md:text-2xl font-bold">התפלגות ציונים — רווחים לא שווים</h2>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-2 py-1 rounded-full font-bold uppercase tracking-widest">מצב צפיפות</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-5">
                הרווחים <strong>אינם שווים</strong>, לכן לא ניתן להשוות תדירויות (fᵢ) ישירות. יש לחשב <strong>צפיפות dᵢ = fᵢ / Lᵢ</strong> כדי לאתר את המוד האמיתי.
              </p>
              {/* Frequency table */}
              <div className="overflow-x-auto mb-5">
                <table className="w-full text-center text-sm border-collapse" dir="ltr">
                  <thead>
                    <tr className="border-b-2 border-slate-200 dark:border-night-border">
                      <th className="py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">מחלקה</th>
                      <th className="py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">fᵢ</th>
                      <th className="py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lᵢ</th>
                      <th className="py-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">dᵢ = fᵢ/Lᵢ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {freqScenario.intervals.map((iv, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-slate-100 dark:border-night-border transition-colors ${
                          idx === freqScenario.highlightIdx
                            ? 'bg-amber-50 dark:bg-amber-900/20'
                            : idx === freqScenario.modeIdx && freqFeedback.mode
                            ? 'bg-ono-50 dark:bg-ono-900/20'
                            : ''
                        }`}
                      >
                        <td className="py-2 px-4 font-mono font-bold">
                          [{iv.lower}–{iv.upper})
                          {idx === freqScenario.highlightIdx && <span className="mr-2 text-amber-500">◀ חשבו</span>}
                          {idx === freqScenario.modeIdx && freqFeedback.mode && <span className="mr-2 text-ono-600">★ מוד</span>}
                        </td>
                        <td className="py-2 px-4 font-bold">{iv.fi}</td>
                        <td className="py-2 px-4">{iv.width}</td>
                        <td className="py-2 px-4 font-mono">
                          {idx === freqScenario.highlightIdx && !freqFeedback.di
                            ? <span className="text-amber-500 font-bold text-base">?</span>
                            : <span className={freqFeedback.di ? 'font-bold text-ono-600 dark:text-ono-400' : ''}>{iv.di}</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 dark:border-slate-600">
                      <td className="py-2 px-4 font-bold text-slate-500">סה״כ</td>
                      <td className="py-2 px-4 font-bold">{freqScenario.n}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {/* Density histogram canvas */}
              <div className="bg-slate-50 dark:bg-night-card2 rounded-2xl border border-slate-200 dark:border-night-border p-4 shadow-inner">
                <canvas ref={canvasRef} width={900} height={280} className="w-full h-auto canvas-glow" />
              </div>
            </div>
          )}

          {/* Frequency table step cards */}
          {freqScenario && level <= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
              {/* Step 1: dᵢ */}
              <div className={`p-5 rounded-[2rem] border-2 transition-all duration-300 ${step >= 1 ? 'border-amber-400 bg-white dark:bg-night-card shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50 dark:bg-night-card'}`}>
                <p className="font-bold text-amber-600 dark:text-amber-400 text-sm mb-2">1. צפיפות (dᵢ)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  חשבו dᵢ עבור [{freqScenario.intervals[freqScenario.highlightIdx].lower}–{freqScenario.intervals[freqScenario.highlightIdx].upper})<br />
                  <span className="font-mono">fᵢ={freqScenario.intervals[freqScenario.highlightIdx].fi}, Lᵢ={freqScenario.intervals[freqScenario.highlightIdx].width}</span>
                </p>
                <div className="flex flex-col gap-3" dir="ltr">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">dᵢ =</span>
                    <input
                      type="number"
                      value={freqInputs.di}
                      onChange={(e) => setFreqInputs({ ...freqInputs, di: e.target.value })}
                      className="w-20 bg-slate-100 dark:bg-slate-800 font-mono text-center rounded-xl px-2 py-1.5 outline-none focus:ring-2 ring-amber-400 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  {freqFeedback.di === false && <p className="text-xs text-red-500">נסו שוב — dᵢ = fᵢ / Lᵢ</p>}
                  {step === 1 && !freqFeedback.di && (
                    <button onClick={checkFreqDi} className="bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl font-bold text-sm transition-colors">בדוק</button>
                  )}
                  {freqFeedback.di === true && <CheckCircle2 size={18} className="text-emerald-500" />}
                </div>
              </div>

              {/* Step 2: mode */}
              <div className={`p-5 rounded-[2rem] border-2 transition-all duration-300 ${step >= 2 ? 'border-ono-500 bg-white dark:bg-night-card shadow-ono' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50 dark:bg-night-card'}`}>
                <p className="font-bold text-ono-600 dark:text-ono-400 text-sm mb-2">2. מציאת מוד</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">לחצו על המחלקה עם <strong>dᵢ הגבוה ביותר</strong>:</p>
                <div className="flex flex-col gap-1.5">
                  {freqScenario.intervals.map((iv, idx) => (
                    <button
                      key={idx}
                      onClick={() => checkFreqMode(idx)}
                      disabled={step !== 2}
                      className={`text-xs font-mono py-1.5 px-3 rounded-lg border text-right transition-all ${
                        selectedModeIdx === idx
                          ? freqFeedback.mode
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-900/30 border-red-400 text-red-700 dark:text-red-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-night-border hover:border-ono-400 disabled:cursor-not-allowed'
                      }`}
                    >
                      [{iv.lower}–{iv.upper})
                    </button>
                  ))}
                </div>
                {freqFeedback.mode === true && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-bold">נכון! המוד מסומן בגרף.</p>}
              </div>

              {/* Step 3: grouped mean */}
              <div className={`p-5 rounded-[2rem] border-2 transition-all duration-300 ${step >= 3 ? 'border-ono-500 bg-white dark:bg-night-card shadow-ono' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50 dark:bg-night-card'}`}>
                <p className="font-bold text-ono-600 dark:text-ono-400 text-sm mb-2">3. ממוצע משוקלל</p>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-4 bg-slate-100 dark:bg-slate-800 p-2 rounded leading-relaxed" dir="ltr">
                  X̄ = Σ(mᵢ·fᵢ) / n<br />
                  n = {freqScenario.n}
                </p>
                <div className="flex flex-col gap-3" dir="ltr">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-ono-600 dark:text-ono-400">X̄ =</span>
                    <input
                      type="number"
                      value={freqInputs.mean}
                      onChange={(e) => setFreqInputs({ ...freqInputs, mean: e.target.value })}
                      className="w-24 bg-slate-100 dark:bg-slate-800 font-mono text-center rounded-xl px-2 py-1.5 outline-none focus:ring-2 ring-ono-500 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  {freqFeedback.mean === false && <p className="text-xs text-red-500">נסו שוב</p>}
                  {step === 3 && !freqFeedback.mean && (
                    <button onClick={checkFreqMean} className="bg-ono-600 hover:bg-ono-700 text-white py-2 rounded-xl font-bold text-sm transition-colors">חשב</button>
                  )}
                  {freqFeedback.mean === true && <CheckCircle2 size={18} className="text-emerald-500" />}
                </div>
              </div>
            </div>
          )}

          {/* Raw data Steps 1-3 */}
          {level <= 3 && data && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              {/* Step 1: Mean */}
              <div className={`p-5 rounded-[2rem] border-2 transition-all duration-300 ${step >= 1 ? 'border-orange-500 bg-white dark:bg-night-card shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50 dark:bg-night-card'}`}>
                <p className="font-bold text-orange-600 dark:text-orange-400 text-sm mb-2">1. חישוב ממוצע</p>
                <ConceptCard
                  title="מה זה ממוצע?"
                  intuition="נקודת האיזון — אם כולם היו מקבלים אותו דבר, הסכום הכולל היה זהה."
                  formula="X̄ = ΣXᵢ / n"
                  tip="חברו הכל, חלקו במספר התצפיות"
                />
                <div className="mb-2"></div>
                <div className="flex flex-col gap-4" dir="ltr">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-xl font-bold text-slate-800 dark:text-slate-200 font-serif italic">X̄ = </span>
                    <MathFraction
                      top={<input type="number" value={inputs.mean} onChange={(e) => setInputs({ ...inputs, mean: e.target.value })}
                        className="w-16 bg-slate-100 dark:bg-slate-800 font-mono text-center rounded outline-none focus:ring-1 ring-orange-500" />}
                      bottom="N"
                    />
                  </div>
                  {feedback.mean === false && <p className="text-xs text-red-500">שגוי — נסו שוב</p>}
                  {feedback.mean === false && (attempts.mean || 0) >= 2 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                      💡 רמז: חברו את כל הערכים יחד, ואז חלקו ב-{data?.n} (מספר התצפיות)
                    </p>
                  )}
                  {step === 1 && (
                    <button onClick={() => checkInput('mean')} className="mt-2 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">בדוק</button>
                  )}
                  {feedback.mean === true && <CheckCircle2 size={18} className="text-emerald-500" />}
                </div>
              </div>

              {/* Step 2: Median */}
              <div className={`p-5 rounded-[2rem] border-2 transition-all duration-300 ${step >= 2 ? 'border-emerald-500 bg-white dark:bg-night-card shadow-md' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50 dark:bg-night-card'}`}>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-2">2. מציאת חציון</p>
                <ConceptCard
                  title="מה זה חציון?"
                  intuition="הערך האמצעי — 50% מהנתונים מעליו, 50% מתחתיו. עמיד בפני ערכים קיצוניים."
                  formula="n אי-זוגי: Xₙ₊₁/₂ | n זוגי: ממוצע שני אמצעיים"
                  tip="מיין את הנתונים, מצא את האמצעי"
                />
                <div className="flex flex-col gap-4" dir="ltr">
                  <input type="number" value={inputs.median} onChange={(e) => setInputs({ ...inputs, median: e.target.value })}
                    placeholder="ערך חציון"
                    className="w-full bg-slate-100 dark:bg-slate-800 font-mono text-center rounded-xl px-3 py-2 outline-none focus:ring-1 ring-emerald-500 text-sm" />
                  {feedback.median === false && <p className="text-xs text-red-500">שגוי — הנתונים ממוינים — חפשו את הערך האמצעי</p>}
                  {feedback.median === false && (attempts.median || 0) >= 2 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                      💡 רמז: n={data?.n} → הערך האמצעי הוא במיקום {data ? Math.floor(data.n / 2) + 1 : '?'}
                    </p>
                  )}
                  {step === 2 && (
                    <button onClick={() => checkInput('median')} className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">סמן בגרף</button>
                  )}
                  {feedback.median === true && <CheckCircle2 size={18} className="text-emerald-500" />}
                </div>
              </div>

              {/* Step 3: Variance */}
              <div className={`p-5 rounded-[2rem] border-2 transition-all duration-300 ${step >= 3 ? 'border-ono-500 bg-white dark:bg-night-card shadow-ono' : 'opacity-40 grayscale pointer-events-none border-slate-200 bg-slate-50 dark:bg-night-card'}`}>
                <p className="font-bold text-ono-600 dark:text-ono-400 text-sm mb-2">3. שונות (S²)</p>
                <ConceptCard
                  title="מה זה שונות?"
                  intuition="מודדת כמה הנתונים מפוזרים סביב הממוצע. שונות גדולה = נתונים מפוזרים."
                  formula="S² = Σ(Xᵢ − X̄)² / n"
                  tip="חשבו את הסטייה מהממוצע לכל ערך, העלו בריבוע, סכמו, חלקו ב-n"
                />
                <div className="flex flex-col gap-4" dir="ltr">
                  <input type="number" value={inputs.variance} onChange={(e) => setInputs({ ...inputs, variance: e.target.value })}
                    placeholder="ערך שונות"
                    className="w-full bg-slate-100 dark:bg-slate-800 font-mono text-center rounded-xl px-3 py-2 outline-none focus:ring-1 ring-ono-500 text-sm" />
                  {feedback.variance === false && <p className="text-xs text-red-500">שגוי — בדקו את הנוסחה</p>}
                  {feedback.variance === false && (attempts.variance || 0) >= 2 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                      💡 רמז: X̄={data?.mean}. חשבו (Xᵢ − {data?.mean})² לכל ערך, סכמו, חלקו ב-{data?.n}
                    </p>
                  )}
                  {step === 3 && (
                    <button onClick={() => checkInput('variance')} className="mt-2 bg-ono-600 hover:bg-ono-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors">חשב והמשך</button>
                  )}
                  {feedback.variance === true && <CheckCircle2 size={18} className="text-emerald-500" />}
                </div>
              </div>
            </div>
          )}

          {/* Level 4: Box Plot */}
          {level === 4 && data && (
            <div className="p-6 md:p-8 rounded-[2rem] border-2 border-orange-500 bg-orange-50 dark:bg-night-card shadow-lg fade-in">
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
                  <div key={label} className={`px-4 py-2 rounded-xl shadow-sm border ${highlight ? 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-night-border'}`}>
                    <span className={`block text-xs ${highlight ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'}`}>{label}</span>
                    <span className={`font-bold ${highlight ? 'text-orange-700 dark:text-orange-300' : ''}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level 5: Exam — שאלות מבחן אמיתיות */}
          {level === 5 && (() => {
            const q = EXAM_QUESTIONS[examQIdx % EXAM_QUESTIONS.length];
            return (
              <div className="bg-slate-900 dark:bg-night-card2 text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden fade-in border border-slate-800">
                <div className="absolute inset-0 bg-gradient-to-t from-orange-900/40 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl md:text-2xl font-black text-orange-300">בחינה מסכמת — שאלות אמיתיות</h2>
                    <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full">שאלה {examQIdx % EXAM_QUESTIONS.length + 1}/{EXAM_QUESTIONS.length}</span>
                  </div>
                  <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-6 md:p-8 rounded-3xl text-right shadow-inner">
                    <p className="text-base md:text-lg font-medium mb-6 leading-relaxed">{q.question}</p>
                    <div className="grid grid-cols-1 gap-3">
                      {q.options.map((opt, i) => (
                        <button key={i} onClick={() => { if (examProgress === 0) setSelectedOption(i); }}
                          className={`p-4 rounded-2xl border-2 font-medium text-right transition-all duration-200 ${
                            examProgress !== 0
                              ? i === q.correct
                                ? 'border-emerald-500 bg-emerald-900/50 text-emerald-300'
                                : selectedOption === i && i !== q.correct
                                ? 'border-red-500 bg-red-900/30 text-red-300'
                                : 'border-slate-600 bg-slate-900/50 text-slate-400 opacity-50'
                              : selectedOption === i
                              ? 'border-orange-500 bg-orange-600/30 text-white shadow-lg'
                              : 'border-slate-600 bg-slate-900 hover:border-orange-400 hover:bg-slate-800 text-slate-300'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {selectedOption !== null && examProgress === 0 && (
                      <button
                        onClick={() => {
                          if (selectedOption === q.correct) {
                            setExamProgress(1);
                            completeStage('descriptive', 5);
                          } else {
                            setExamProgress(-1);
                          }
                        }}
                        className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black text-lg transition-colors shadow-lg"
                      >
                        הגש תשובה לבדיקה
                      </button>
                    )}
                    {examProgress === 1 && (
                      <div className="mt-6 space-y-3 fade-in">
                        <div className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl font-bold text-center">תשובה נכונה! כל הכבוד.</div>
                        <div className="bg-slate-700/60 border border-slate-600 text-slate-300 p-4 rounded-xl text-sm leading-relaxed">
                          <span className="font-bold text-orange-300">הסבר: </span>{q.explanation}
                        </div>
                        <button onClick={() => { setExamQIdx(i => i + 1); setSelectedOption(null); setExamProgress(0); }}
                          className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-2xl font-bold transition-colors">
                          שאלה הבאה ←
                        </button>
                      </div>
                    )}
                    {examProgress === -1 && (
                      <div className="mt-6 space-y-3 fade-in">
                        <div className="bg-red-900/50 border border-red-500/50 text-red-400 p-4 rounded-xl font-bold text-center">תשובה שגויה.</div>
                        <div className="bg-slate-700/60 border border-slate-600 text-slate-300 p-4 rounded-xl text-sm leading-relaxed">
                          <span className="font-bold text-orange-300">הסבר: </span>{q.explanation}
                        </div>
                        <button onClick={() => { setSelectedOption(null); setExamProgress(0); }}
                          className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-2xl font-bold transition-colors">
                          נסה שוב
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </main>
      </div>
    </div>
  );
}
