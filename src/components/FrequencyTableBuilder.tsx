import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { r2, isClose, groupedMedian, generateRawFromFrequencies } from '../utils/mathHelpers';

/* ════════════════════════════════════════════════════════════════════════════
   FrequencyTableBuilder — Step-by-Step Frequency Table Construction
   Ono Academic College method: column-by-column progressive reveal.

   Stages:
   1. f_x   — student counts raw data points per interval
   2. f_x/N — relative frequency
   3. F_x   — cumulative frequency
   4. F_x/N — cumulative relative
   5. %     — percentage
   6. Grouped Median sub-stage
   ════════════════════════════════════════════════════════════════════════════ */

export interface FreqInterval {
  lower: number;
  upper: number;
  fi: number;       // expected count
  midpoint: number;
}

interface FrequencyTableBuilderProps {
  intervals: FreqInterval[];
  n: number;
  onComplete?: () => void;
}

type CellKey = string; // e.g. "fx_0", "rel_1", "cum_2", etc.

const COL_LABELS = ['f_x', 'f_x/N', 'F_x', 'F_x/N', '%'];
const COL_KEYS  = ['fx',  'rel',   'cum', 'cumrel', 'pct'];

function getExpected(col: string, rowIdx: number, intervals: FreqInterval[], n: number): number {
  const iv = intervals[rowIdx];
  switch (col) {
    case 'fx':     return iv.fi;
    case 'rel':    return r2(iv.fi / n);
    case 'cum':    return intervals.slice(0, rowIdx + 1).reduce((s, x) => s + x.fi, 0);
    case 'cumrel': return r2(intervals.slice(0, rowIdx + 1).reduce((s, x) => s + x.fi, 0) / n);
    case 'pct':    return r2((iv.fi / n) * 100);
    default:       return 0;
  }
}

export function FrequencyTableBuilder({ intervals, n, onComplete }: FrequencyTableBuilderProps) {
  // Stage 1 = filling fx, Stage 2 = rel, ..., Stage 5 = pct, Stage 6 = median
  const [stage, setStage] = useState(1);

  // inputs[colKey_rowIdx] = string value
  const [inputs, setInputs] = useState<Record<CellKey, string>>({});
  // validated[colKey_rowIdx] = true | false | undefined
  const [validated, setValidated] = useState<Record<CellKey, boolean | undefined>>({});

  // Grouped median stage
  const [medianInput, setMedianInput] = useState('');
  const [medianFeedback, setMedianFeedback] = useState<boolean | null>(null);
  const [medianClassIdx, setMedianClassIdx] = useState<number | null>(null);

  const rawData = useMemo(
    () => generateRawFromFrequencies(
      intervals.map(iv => ({ lower: iv.lower, upper: iv.upper })),
      intervals.map(iv => iv.fi)
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [intervals]
  );

  function cellKey(col: string, row: number) { return `${col}_${row}`; }

  function handleInput(col: string, row: number, val: string) {
    setInputs(prev => ({ ...prev, [cellKey(col, row)]: val }));
    // clear previous validation if re-typing
    setValidated(prev => ({ ...prev, [cellKey(col, row)]: undefined }));
  }

  function validateCell(col: string, row: number) {
    const raw = inputs[cellKey(col, row)] ?? '';
    const val = parseFloat(raw);
    const expected = getExpected(col, row, intervals, n);
    const ok = isClose(val, expected);
    setValidated(prev => ({ ...prev, [cellKey(col, row)]: ok }));
    return ok;
  }

  function validateCurrentStageCol() {
    const col = COL_KEYS[stage - 1];
    let allOk = true;
    const newValidated: Record<CellKey, boolean> = {};
    intervals.forEach((_, row) => {
      const raw = inputs[cellKey(col, row)] ?? '';
      const val = parseFloat(raw);
      const expected = getExpected(col, row, intervals, n);
      const ok = isClose(val, expected);
      newValidated[cellKey(col, row)] = ok;
      if (!ok) allOk = false;
    });
    setValidated(prev => ({ ...prev, ...newValidated }));
    if (allOk) {
      if (stage < 5) {
        setStage(s => s + 1);
      } else {
        setStage(6);
      }
    }
  }

  // Grouped median expected values
  const halfN = n / 2;
  // Find median class: first row where cumulative F_x >= N/2
  const cumFreqs = intervals.map((_, i) => intervals.slice(0, i + 1).reduce((s, x) => s + x.fi, 0));
  const expectedMedianClassIdx = cumFreqs.findIndex(f => f >= halfN);
  const expectedMedian = groupedMedian(
    intervals.map(iv => ({ lower: iv.lower, upper: iv.upper })),
    intervals.map(iv => iv.fi)
  );

  function checkMedian() {
    const val = parseFloat(medianInput);
    const ok = isClose(val, expectedMedian, 0.5); // ±0.5 tolerance for grouped median
    setMedianFeedback(ok);
    if (ok && onComplete) onComplete();
  }

  // Helper: is this cell in a completed (past) stage → show value
  const colStage = (col: string) => COL_KEYS.indexOf(col) + 1;

  function cellStatus(col: string, row: number): 'past' | 'active' | 'future' {
    const cs = colStage(col);
    if (cs < stage) return 'past';
    if (cs === stage) return 'active';
    return 'future';
  }

  const activeCol = stage <= 5 ? COL_KEYS[stage - 1] : null;
  const stageLabel = stage <= 5 ? COL_LABELS[stage - 1] : 'חציון מקובץ';

  return (
    <div className="flex flex-col gap-6" dir="rtl">

      {/* Stage indicator */}
      <div className="flex items-center gap-2 flex-wrap">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
            i + 1 < stage ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
            : i + 1 === stage ? 'bg-ono-100 dark:bg-ono-900/40 text-ono-700 dark:text-ono-300 border-ono-400 dark:border-ono-600'
            : 'bg-slate-100 dark:bg-night-card2 text-slate-400 border-slate-200 dark:border-night-border opacity-50'
          }`}>
            {i + 1 < stage ? <CheckCircle2 size={11} /> : null}
            {COL_LABELS[i]}
          </div>
        ))}
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
          stage === 6 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-400 dark:border-amber-700'
          : 'bg-slate-100 dark:bg-night-card2 text-slate-400 border-slate-200 dark:border-night-border opacity-50'
        }`}>חציון מקובץ</div>
      </div>

      {/* Stage 1: show raw data to count from */}
      {stage === 1 && (
        <div className="p-4 rounded-2xl border bg-amber-50/60 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">הנתונים הגולמיים ({n} תצפיות):</p>
          <p className="font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300 break-all" dir="ltr">
            {rawData.join(', ')}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">ספרו כמה ערכים נופלים בכל קטגוריה ומלאו את עמודת f_x.</p>
        </div>
      )}

      {/* Frequency Table */}
      <div className="freq-table-scroll">
        <table className="w-full text-sm border-collapse min-w-[520px]">
          <thead>
            <tr>
              <th className="p-2 text-right font-bold text-slate-600 dark:text-slate-400 border-b-2 border-slate-200 dark:border-night-border bg-slate-50 dark:bg-night-card2 rounded-tr-xl">קטגוריה</th>
              {COL_KEYS.map((col, ci) => (
                <th key={col} className={`p-2 text-center font-bold border-b-2 border-slate-200 dark:border-night-border ${
                  ci + 1 === stage ? 'bg-ono-50 dark:bg-ono-900/20 text-ono-700 dark:text-ono-400 border-ono-300 dark:border-ono-700'
                  : 'bg-slate-50 dark:bg-night-card2 text-slate-600 dark:text-slate-400'
                }`}>
                  {COL_LABELS[ci]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {intervals.map((iv, row) => (
              <tr key={row} className="border-b border-slate-100 dark:border-night-border hover:bg-slate-50/50 dark:hover:bg-night-card/30 transition-colors">
                <td className="p-2 font-mono text-right font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap" dir="ltr">
                  [{iv.lower} – {iv.upper})
                </td>
                {COL_KEYS.map(col => {
                  const status = cellStatus(col, row);
                  const key = cellKey(col, row);
                  const expected = getExpected(col, row, intervals, n);
                  const isValid = validated[key];

                  if (status === 'past') {
                    return (
                      <td key={col} className="p-2 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold">
                          <CheckCircle2 size={10} />
                          {expected}
                        </span>
                      </td>
                    );
                  }

                  if (status === 'future') {
                    return (
                      <td key={col} className="p-2 text-center">
                        <span className="inline-block w-12 h-6 rounded bg-slate-100 dark:bg-night-card2 opacity-40" />
                      </td>
                    );
                  }

                  // active
                  return (
                    <td key={col} className="p-2 text-center">
                      <div className="relative inline-flex items-center">
                        <input
                          type="number"
                          step="0.01"
                          value={inputs[key] ?? ''}
                          onChange={e => handleInput(col, row, e.target.value)}
                          onBlur={() => validateCell(col, row)}
                          className={`w-20 h-9 text-center font-mono font-bold rounded-xl border-2 outline-none transition-all bg-white dark:bg-night-card text-slate-900 dark:text-slate-50 ${
                            isValid === true  ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20'
                            : isValid === false ? 'border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-900/20 animate-[cellShake_0.35s_ease]'
                            : 'border-ono-300 dark:border-ono-700 focus:border-ono-500 dark:focus:border-ono-400'
                          }`}
                          style={{ minHeight: '44px' }}
                        />
                        {isValid === true  && <CheckCircle2 size={14} className="absolute -left-4 text-emerald-500" />}
                        {isValid === false && <XCircle size={14} className="absolute -left-4 text-red-500" />}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Total row */}
            <tr className="border-t-2 border-slate-300 dark:border-night-border bg-slate-50/80 dark:bg-night-card2/50">
              <td className="p-2 font-bold text-right text-slate-700 dark:text-slate-300">סה"כ</td>
              <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400">{stage > 1 ? n : '—'}</td>
              <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400">{stage > 2 ? '1.00' : '—'}</td>
              <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400">{stage > 3 ? n : '—'}</td>
              <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400">{stage > 4 ? '1.00' : '—'}</td>
              <td className="p-2 text-center font-mono font-bold text-slate-600 dark:text-slate-400">{stage > 5 ? '100%' : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Validate button for current stage (stages 1-5) */}
      {stage <= 5 && activeCol && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-ono-50 dark:bg-ono-900/20 border border-ono-200 dark:border-ono-800/40">
            <span className="text-xs font-bold text-ono-700 dark:text-ono-400">
              {stage === 1 && `שלב 1: מלאו את f_x — כמה תצפיות בכל קטגוריה? (סה"כ N=${n})`}
              {stage === 2 && `שלב 2: מלאו שכיחות יחסית = f_x ÷ N (${n})`}
              {stage === 3 && `שלב 3: מלאו שכיחות מצטברת = סכום f_x עד שורה זו`}
              {stage === 4 && `שלב 4: מלאו שכיחות יחסית מצטברת = F_x ÷ N`}
              {stage === 5 && `שלב 5: מלאו אחוז = (f_x/N) × 100`}
            </span>
          </div>
          <button
            onClick={validateCurrentStageCol}
            className="w-full bg-ono-600 hover:bg-ono-700 text-white py-3 rounded-xl font-bold text-sm transition-colors"
          >
            בדוק עמודת {stageLabel} ←
          </button>
        </div>
      )}

      {/* Stage 6: Grouped Median */}
      {stage === 6 && (
        <div className="flex flex-col gap-4 p-6 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/10 fade-in">
          <h4 className="font-black text-amber-800 dark:text-amber-300">שלב 6 — חציון מקובץ</h4>

          {/* Show cumulative column for reference */}
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-right border-b border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-500">קטגוריה</th>
                  <th className="p-2 text-center border-b border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-500">F_x מצטברת</th>
                </tr>
              </thead>
              <tbody>
                {intervals.map((iv, i) => (
                  <tr
                    key={i}
                    onClick={() => setMedianClassIdx(i)}
                    className={`cursor-pointer border-b border-amber-100 dark:border-amber-800/30 transition-all ${
                      medianClassIdx === i ? 'bg-amber-200 dark:bg-amber-800/40 font-bold'
                      : i === expectedMedianClassIdx ? 'bg-amber-100/60 dark:bg-amber-900/20'
                      : 'hover:bg-amber-50 dark:hover:bg-amber-900/10'
                    }`}
                  >
                    <td className="p-2 font-mono whitespace-nowrap" dir="ltr">[{iv.lower} – {iv.upper})</td>
                    <td className={`p-2 text-center font-mono font-bold ${
                      cumFreqs[i] >= halfN && cumFreqs[i - 1] < halfN
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {cumFreqs[i]}
                      {cumFreqs[i] >= halfN && (cumFreqs[i - 1] ?? 0) < halfN && (
                        <span className="text-amber-600 dark:text-amber-400 mr-1">← N/2={halfN}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {medianClassIdx === null ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              לחצו על השורה שבה הסכום המצטבר עולה לראשונה על N/2 = {halfN}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {medianClassIdx !== expectedMedianClassIdx ? (
                <p className="text-red-600 dark:text-red-400 text-sm font-bold">
                  זו לא קטגוריית החציון — בחרו את הקטגוריה שבה F_x עולה על {halfN} לראשונה
                </p>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-night-card/60 border border-amber-200 dark:border-amber-700/40">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">נוסחת חציון מקובץ:</p>
                    <p className="font-mono text-sm text-center" dir="ltr">
                      Me = L + ((N/2 − F_prev) / f_me) × h
                    </p>
                    <p className="font-mono text-xs text-center text-slate-500 dark:text-slate-400 mt-1" dir="ltr">
                      = {intervals[medianClassIdx].lower} + (({halfN} − {medianClassIdx > 0 ? cumFreqs[medianClassIdx - 1] : 0}) / {intervals[medianClassIdx].fi}) × {intervals[medianClassIdx].upper - intervals[medianClassIdx].lower}
                    </p>
                  </div>
                  <div className="flex items-center gap-3" dir="ltr">
                    <span className="font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">Me =</span>
                    <input
                      type="number"
                      step="0.1"
                      value={medianInput}
                      onChange={e => { setMedianInput(e.target.value); setMedianFeedback(null); }}
                      className={`w-28 h-11 text-center font-mono font-bold rounded-xl border-2 outline-none transition-all bg-white dark:bg-night-card text-slate-900 dark:text-slate-50 ${
                        medianFeedback === true  ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20'
                        : medianFeedback === false ? 'border-red-400 bg-red-50/50 dark:bg-red-900/20'
                        : 'border-amber-300 dark:border-amber-700 focus:border-amber-500'
                      }`}
                    />
                    <button
                      onClick={checkMedian}
                      className="px-5 h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-colors"
                    >
                      בדוק
                    </button>
                    {medianFeedback === true  && <CheckCircle2 className="text-emerald-500" size={20} />}
                    {medianFeedback === false && <XCircle className="text-red-500" size={20} />}
                  </div>
                  {medianFeedback === false && (
                    <p className="text-red-500 dark:text-red-400 text-xs">
                      לא מדויק — תוצאה צפויה: {r2(expectedMedian)}. בדקו את הצבת הנתונים בנוסחה.
                    </p>
                  )}
                  {medianFeedback === true && (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 text-center fade-in">
                      <span className="font-black text-emerald-700 dark:text-emerald-300">
                        מצוין! החציון המקובץ = {r2(expectedMedian)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Back to previous stage */}
      {stage > 1 && stage <= 5 && (
        <button
          onClick={() => setStage(s => s - 1)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors self-start"
        >
          <ArrowLeft size={12} /> חזור לשלב קודם
        </button>
      )}
    </div>
  );
}
