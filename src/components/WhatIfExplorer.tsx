/**
 * WhatIfExplorer — Live Formula + Parametric Slider Explorer
 *
 * Student drags sliders; formula re-renders in real-time via KaTeX.
 * Critical points are marked on sliders. What-if questions toggle explanations.
 *
 * Adapted from stat-physics (HIT) for OnoStats — CSS custom properties, RTL,
 * framer-motion micro-animations. No XP/badges.
 */

import { useState, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

/* ─────────────────────── Types ─────────────────────── */

export interface WhatIfParam {
  key: string;
  /** Hebrew label, e.g. "ממוצע μ" */
  label: string;
  /** LaTeX symbol for inline display, e.g. "\\mu" */
  symbol: string;
  /** Unit string, e.g. "₪" or "נק'" */
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  /** Points marked with a tick + label on the slider track */
  criticalPoints?: { value: number; label: string }[];
}

export interface WhatIfQuestion {
  prompt: string;
  /** Returns a Hebrew explanation given the current slider values */
  answer: (values: Record<string, number>) => string;
}

interface WhatIfExplorerProps {
  title: string;
  description?: ReactNode;
  params: WhatIfParam[];
  /** Returns a LaTeX string for the live formula display */
  renderFormula: (values: Record<string, number>) => string;
  /** Optional React node rendered below the formula (e.g. canvas visualisation) */
  renderVisualization?: (values: Record<string, number>) => ReactNode;
  questions?: WhatIfQuestion[];
}

/* ─────────────────────── Component ─────────────────────── */

export function WhatIfExplorer({
  title,
  description,
  params,
  renderFormula,
  renderVisualization,
  questions = [],
}: WhatIfExplorerProps) {
  const initial = () =>
    Object.fromEntries(params.map((p) => [p.key, p.defaultValue]));

  const [values, setValues] = useState<Record<string, number>>(initial);
  // Formula values are debounced to avoid KaTeX thrashing on fast drags
  const [formulaValues, setFormulaValues] = useState<Record<string, number>>(
    initial,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [activeQ, setActiveQ] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  function setValue(key: string, val: number) {
    setValues((prev) => ({ ...prev, [key]: val }));
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFormulaValues((prev) => ({ ...prev, [key]: val }));
    }, 60);
  }

  const formulaLatex = renderFormula(formulaValues);

  return (
    <div
      dir="rtl"
      style={{
        border: '1px solid var(--border-primary)',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* ── Header ── */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-right"
        onClick={() => setCollapsed((c) => !c)}
        style={{ background: 'transparent', cursor: 'pointer' }}
      >
        <HelpCircle
          size={15}
          style={{ color: 'var(--accent-warning)', flexShrink: 0 }}
        />
        <div className="flex-1">
          <div
            className="text-xs font-black uppercase tracking-widest"
            style={{ color: 'var(--accent-warning)' }}
          >
            מה קורה אם...? — חקירה פרמטרית
          </div>
          <div
            className="text-sm font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </div>
        </div>
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-5 flex flex-col gap-4">
              {/* Description */}
              {description && (
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {description}
                </p>
              )}

              {/* Live formula box */}
              <div
                className="rounded-xl px-4 py-3 text-center overflow-x-auto"
                style={{
                  background: 'var(--bg-math)',
                  border: '1px solid var(--border-primary)',
                  direction: 'ltr',
                }}
              >
                <motion.div
                  key={formulaLatex}
                  initial={{ scale: 0.96, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <BlockMath math={formulaLatex} />
                </motion.div>
              </div>

              {/* Optional visualization */}
              {renderVisualization && (
                <div>{renderVisualization(values)}</div>
              )}

              {/* Sliders */}
              <div className="flex flex-col gap-4">
                {params.map((param) => {
                  const pct =
                    ((values[param.key] - param.min) /
                      (param.max - param.min)) *
                    100;
                  const displayVal = values[param.key];
                  const decimals =
                    param.step < 1
                      ? param.step < 0.1
                        ? 3
                        : 2
                      : param.step < 10
                      ? 1
                      : 0;

                  return (
                    <div key={param.key}>
                      {/* Row: label + value */}
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {param.label}
                        </span>
                        <span
                          className="text-sm font-black"
                          style={{ color: 'var(--accent-primary)', direction: 'ltr' }}
                        >
                          {displayVal.toFixed(decimals)} {param.unit}
                        </span>
                      </div>

                      {/* Slider with critical point markers */}
                      <div className="relative pt-1 pb-4">
                        <input
                          type="range"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={values[param.key]}
                          onChange={(e) =>
                            setValue(param.key, parseFloat(e.target.value))
                          }
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{
                            direction: 'ltr',
                            background: `linear-gradient(to right, var(--accent-primary) ${pct}%, var(--border-primary) 0%)`,
                            // Thumb styling via CSS vars (set in index.css)
                          }}
                        />
                        {/* Critical point markers */}
                        {param.criticalPoints?.map((cp) => {
                          const cpPct =
                            ((cp.value - param.min) / (param.max - param.min)) *
                            100;
                          return (
                            <div
                              key={cp.value}
                              className="absolute flex flex-col items-center pointer-events-none"
                              style={{
                                left: `${cpPct}%`,
                                top: 0,
                                transform: 'translateX(-50%)',
                              }}
                            >
                              <div
                                style={{
                                  width: 2,
                                  height: 6,
                                  borderRadius: 1,
                                  background: 'var(--accent-error)',
                                  marginTop: 2,
                                }}
                              />
                              <span
                                className="text-[9px] mt-0.5 whitespace-nowrap font-bold"
                                style={{ color: 'var(--accent-error)' }}
                              >
                                {cp.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* What-if questions */}
              {questions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    שאלות חשיבה
                  </p>
                  {questions.map((q, i) => (
                    <div key={i}>
                      <button
                        onClick={() => setActiveQ(activeQ === i ? null : i)}
                        className="w-full text-right text-xs px-3 py-2.5 rounded-xl transition-all font-medium"
                        style={{
                          background:
                            activeQ === i
                              ? 'rgba(245, 158, 11, 0.1)'
                              : 'var(--bg-secondary)',
                          color:
                            activeQ === i
                              ? 'var(--accent-warning)'
                              : 'var(--text-secondary)',
                          border: `1px solid ${
                            activeQ === i
                              ? 'var(--accent-warning)'
                              : 'transparent'
                          }`,
                        }}
                      >
                        {q.prompt}
                      </button>
                      <AnimatePresence>
                        {activeQ === i && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="mt-1.5 text-xs px-3 py-2.5 rounded-xl leading-relaxed"
                            style={{
                              background: 'rgba(22, 163, 74, 0.08)',
                              color: 'var(--accent-success)',
                              border: '1px solid var(--border-primary)',
                            }}
                          >
                            {q.answer(values)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
