import { useState, useCallback } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { r4, isClose } from '../utils/mathHelpers';

/* ════════════════════════════════════════════════════════════════════════════
   MagicSquare — Interactive 2×2 Contingency Table
   Ono Academic College's PRIMARY method for teaching conditional probability.

   Layout (RTL — row headers on right side):
   ┌─────────────────┬──────────────┬──────────────┬─────────┐
   │                 │  B מתרחש     │  Bᶜ לא מתרחש│  סה"כ  │
   ├─────────────────┼──────────────┼──────────────┼─────────┤
   │  A מתרחש       │  P(A∩B)      │  P(A∩Bᶜ)    │  P(A)  │
   ├─────────────────┼──────────────┼──────────────┼─────────┤
   │  Aᶜ לא מתרחש  │  P(Aᶜ∩B)    │  P(Aᶜ∩Bᶜ)  │  P(Aᶜ) │
   ├─────────────────┼──────────────┼──────────────┼─────────┤
   │  סה"כ          │  P(B)        │  P(Bᶜ)      │  1.00  │
   └─────────────────┴──────────────┴──────────────┴─────────┘

   Query UI (Patch #2): After completion, buttons derive any formula
   visually from highlighted cells.
   ════════════════════════════════════════════════════════════════════════════ */

export interface MagicSquareProps {
  aLabel: string;    // e.g. "מכונה A"
  bLabel: string;    // e.g. "מוצר פגום"
  pA: number;        // P(A)
  pBgA: number;      // P(B|A)
  pBgAc: number;     // P(B|Aᶜ)
  difficulty: 'guided' | 'partial' | 'blank';
  onComplete?: (allCorrect: boolean) => void;
}

type CellKey = 'pAB' | 'pABc' | 'pAcB' | 'pAcBc' | 'pA' | 'pAc' | 'pB' | 'pBc';

type QueryType = 'pAgB' | 'pAcgB' | 'pAuB' | 'pAiB' | null;

interface QueryConfig {
  key: QueryType;
  label: string;
  highlightCells: CellKey[];
  formula: (vals: Record<CellKey, number>) => string;
  result: (vals: Record<CellKey, number>) => number;
}

const QUERIES: QueryConfig[] = [
  {
    key: 'pAgB',
    label: 'P(A|B)',
    highlightCells: ['pAB', 'pB'],
    formula: (v) => `P(A|B) = P(A∩B) / P(B) = ${r4(v.pAB)} / ${r4(v.pB)} = ${r4(v.pAB / v.pB)}`,
    result: (v) => r4(v.pAB / v.pB),
  },
  {
    key: 'pAcgB',
    label: 'P(Aᶜ|B)',
    highlightCells: ['pAcB', 'pB'],
    formula: (v) => `P(Aᶜ|B) = P(Aᶜ∩B) / P(B) = ${r4(v.pAcB)} / ${r4(v.pB)} = ${r4(v.pAcB / v.pB)}`,
    result: (v) => r4(v.pAcB / v.pB),
  },
  {
    key: 'pAuB',
    label: 'P(A∪B)',
    highlightCells: ['pAB', 'pABc', 'pAcB'],
    formula: (v) =>
      `P(A∪B) = P(A∩B) + P(A∩Bᶜ) + P(Aᶜ∩B) = ${r4(v.pAB)} + ${r4(v.pABc)} + ${r4(v.pAcB)} = ${r4(v.pAB + v.pABc + v.pAcB)}`,
    result: (v) => r4(v.pAB + v.pABc + v.pAcB),
  },
  {
    key: 'pAiB',
    label: 'P(A∩B)',
    highlightCells: ['pAB'],
    formula: (v) => `P(A∩B) = ${r4(v.pAB)}`,
    result: (v) => r4(v.pAB),
  },
];

export function MagicSquare({ aLabel, bLabel, pA, pBgA, pBgAc, difficulty, onComplete }: MagicSquareProps) {
  // Derive all true values from given probabilities
  const pAc  = r4(1 - pA);
  const pAB  = r4(pBgA * pA);
  const pAcB = r4(pBgAc * pAc);
  const pB   = r4(pAB + pAcB);
  const pABc = r4(pA - pAB);
  const pAcBc = r4(pAc - pAcB);
  const pBc  = r4(1 - pB);

  const trueValues: Record<CellKey, number> = { pAB, pABc, pAcB, pAcBc, pA, pAc, pB, pBc };

  // Which cells are pre-filled (known) vs student-input
  const knownCells: Set<CellKey> = new Set();
  if (difficulty === 'guided') {
    // Pre-fill: P(A), P(Aᶜ), P(B|A), P(B|Aᶜ) — i.e., P(A∩B) and P(Aᶜ∩B)
    knownCells.add('pA'); knownCells.add('pAc');
    knownCells.add('pAB'); knownCells.add('pAcB');
  } else if (difficulty === 'partial') {
    // Pre-fill: P(A) and P(Aᶜ) only
    knownCells.add('pA'); knownCells.add('pAc');
  }
  // blank: nothing pre-filled

  // Student inputs (empty string = not yet entered)
  const [inputs, setInputs] = useState<Record<CellKey, string>>({
    pAB: '', pABc: '', pAcB: '', pAcBc: '',
    pA: '', pAc: '', pB: '', pBc: '',
  });

  // Validation state: true=correct, false=wrong, null=not checked
  const [validated, setValidated] = useState<Record<CellKey, boolean | null>>({
    pAB: null, pABc: null, pAcB: null, pAcBc: null,
    pA: null, pAc: null, pB: null, pBc: null,
  });

  const [shaking, setShaking] = useState<CellKey | null>(null);
  const [activeQuery, setActiveQuery] = useState<QueryType>(null);
  const [allDone, setAllDone] = useState(false);

  const editableCells: CellKey[] = (['pAB', 'pABc', 'pAcB', 'pAcBc', 'pA', 'pAc', 'pB', 'pBc'] as CellKey[])
    .filter((k) => !knownCells.has(k));

  const handleBlur = useCallback((key: CellKey) => {
    if (knownCells.has(key)) return;
    const raw = inputs[key];
    if (raw === '') return;
    const val = parseFloat(raw);
    const correct = !isNaN(val) && isClose(val, trueValues[key]);
    setValidated((v) => ({ ...v, [key]: correct }));

    if (!correct) {
      setShaking(key);
      setTimeout(() => setShaking(null), 400);
      return;
    }

    // Check if all editable cells are now correct
    const newValidated = { ...validated, [key]: true };
    const done = editableCells.every((k) => k === key ? true : newValidated[k] === true);
    if (done) {
      setAllDone(true);
      onComplete?.(true);
    }
  }, [inputs, validated, editableCells, trueValues, knownCells, onComplete]);

  const handleChange = (key: CellKey, val: string) => {
    setInputs((i) => ({ ...i, [key]: val }));
    setValidated((v) => ({ ...v, [key]: null }));
  };

  const activeQueryConfig = QUERIES.find((q) => q.key === activeQuery) ?? null;

  // Render a single cell (either known value, editable input, or auto-computed total)
  const renderCell = (key: CellKey, isTotal = false) => {
    const isKnown = knownCells.has(key);
    const isHighlighted = activeQueryConfig?.highlightCells.includes(key);
    const val = validated[key];
    const shakeClass = shaking === key ? 'cell-shake' : '';
    const successClass = val === true ? 'cell-success' : '';

    let bgStyle: React.CSSProperties = {};
    if (isHighlighted) {
      bgStyle = { background: 'var(--accent-warning)', opacity: 0.85 };
    } else if (isTotal) {
      bgStyle = { background: 'var(--cell-total)' };
    } else if (isKnown) {
      bgStyle = { background: 'var(--cell-known)' };
    } else if (val === true) {
      bgStyle = { background: 'var(--cell-correct)' };
    } else if (val === false) {
      bgStyle = { background: 'var(--cell-error)' };
    } else {
      bgStyle = { background: 'var(--cell-editable)' };
    }

    if (isKnown || isTotal) {
      return (
        <td
          key={key}
          className={`magic-square-cell px-2 py-1 text-center font-mono text-sm font-bold border transition-all ${shakeClass} ${successClass}`}
          style={{
            ...bgStyle,
            borderColor: isHighlighted ? 'var(--accent-warning)' : 'var(--border-primary)',
            color: 'var(--text-primary)',
          }}
        >
          {r4(trueValues[key])}
        </td>
      );
    }

    return (
      <td
        key={key}
        className={`magic-square-cell px-2 py-1 border transition-all ${shakeClass} ${successClass}`}
        style={{
          ...bgStyle,
          borderColor: isHighlighted ? 'var(--accent-warning)' : 'var(--border-primary)',
        }}
      >
        <div className="flex items-center gap-1 justify-center">
          <input
            type="number"
            step="0.0001"
            min="0"
            max="1"
            value={inputs[key]}
            onChange={(e) => handleChange(key, e.target.value)}
            onBlur={() => handleBlur(key)}
            dir="ltr"
            className="w-16 text-center font-mono text-sm font-bold rounded-lg outline-none px-1 py-0.5"
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              borderBottom: `2px solid ${val === true ? 'var(--accent-success)' : val === false ? 'var(--accent-error)' : 'var(--border-accent)'}`,
            }}
            aria-label={`הזן ערך עבור ${key}`}
          />
          {val === true && <CheckCircle2 size={14} style={{ color: 'var(--accent-success)' }} />}
          {val === false && <XCircle size={14} style={{ color: 'var(--accent-error)' }} />}
        </div>
      </td>
    );
  };

  const headerStyle: React.CSSProperties = {
    background: 'var(--cell-header)',
    color: 'var(--text-accent)',
    borderColor: 'var(--border-primary)',
    fontWeight: 700,
    fontSize: '0.75rem',
    padding: '8px 10px',
    textAlign: 'center',
  };

  return (
    <div
      className="rounded-[1.5rem] border overflow-hidden"
      style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-card)' }}
      dir="rtl"
    >
      {/* Title */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <h3 className="font-black text-sm" style={{ color: 'var(--text-accent)' }}>
          ריבוע הקסם — טבלת הסתברויות דו-כיוונית
        </h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          מלאו את הריבועים הריקים. כל שורה ועמודה חייבים לסכום נכון.
        </p>
      </div>

      {/* Table — horizontal scroll on mobile */}
      <div className="overflow-x-auto p-3">
        <table
          className="w-full border-collapse text-sm"
          style={{ minWidth: '420px' }}
          dir="rtl"
        >
          <thead>
            <tr>
              <th style={{ ...headerStyle, textAlign: 'right', minWidth: '120px' }}>{/* row header */}</th>
              <th style={headerStyle}>{bLabel} ✓</th>
              <th style={headerStyle}>{bLabel}ᶜ ✗</th>
              <th style={{ ...headerStyle, background: 'var(--cell-total)' }}>סה"כ</th>
            </tr>
          </thead>
          <tbody>
            {/* Row 1: A occurs */}
            <tr>
              <td
                style={{ ...headerStyle, textAlign: 'right' }}
                className="border"
              >
                {aLabel} ✓
              </td>
              {renderCell('pAB')}
              {renderCell('pABc')}
              {renderCell('pA', knownCells.has('pA'))}
            </tr>
            {/* Row 2: A doesn't occur */}
            <tr>
              <td
                style={{ ...headerStyle, textAlign: 'right' }}
                className="border"
              >
                {aLabel}ᶜ ✗
              </td>
              {renderCell('pAcB')}
              {renderCell('pAcBc')}
              {renderCell('pAc', knownCells.has('pAc'))}
            </tr>
            {/* Row 3: Totals */}
            <tr style={{ background: 'var(--cell-total)' }}>
              <td style={{ ...headerStyle, background: 'var(--cell-total)', textAlign: 'right' }} className="border">
                סה"כ
              </td>
              {renderCell('pB', knownCells.has('pB'))}
              {renderCell('pBc', knownCells.has('pBc'))}
              <td
                className="magic-square-cell px-2 py-1 text-center font-mono text-sm font-black border"
                style={{
                  background: 'var(--cell-total)',
                  borderColor: 'var(--border-primary)',
                  color: 'var(--accent-primary)',
                }}
              >
                1.00
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Query UI — shown once all cells are done */}
      {allDone && (
        <div
          className="px-4 pb-4 pt-2 border-t fade-in"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>
            שאל שאלה — לחץ להדגשה ויזואלית:
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {QUERIES.map((q) => (
              <button
                key={q.key}
                onClick={() => setActiveQuery(activeQuery === q.key ? null : q.key)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border min-h-[36px]"
                style={{
                  background: activeQuery === q.key ? 'var(--accent-primary)' : 'var(--bg-muted)',
                  color: activeQuery === q.key ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  borderColor: activeQuery === q.key ? 'var(--accent-primary)' : 'var(--border-primary)',
                }}
                aria-label={`הצג נוסחה עבור ${q.label}`}
              >
                {q.label}
              </button>
            ))}
          </div>

          {activeQueryConfig && (
            <div
              className="p-3 rounded-xl font-mono text-sm fade-in"
              style={{
                background: 'var(--bg-math)',
                color: 'var(--text-primary)',
                borderRight: '3px solid var(--accent-warning)',
              }}
              dir="ltr"
            >
              {activeQueryConfig.formula(trueValues)}
            </div>
          )}
        </div>
      )}

      {/* Completion banner */}
      {allDone && (
        <div
          className="mx-4 mb-4 p-3 rounded-xl flex items-center gap-2 fade-in"
          style={{ background: 'var(--accent-bg)', color: 'var(--text-accent)' }}
        >
          <CheckCircle2 size={16} />
          <span className="text-sm font-bold">הריבוע הושלם! כעת תוכלו לשאול כל שאלה מהטבלה.</span>
        </div>
      )}
    </div>
  );
}
