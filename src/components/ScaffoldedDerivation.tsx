/**
 * ScaffoldedDerivation — Interactive Step-by-Step Derivation
 *
 * Reveals derivation steps sequentially. Each step is locked until the student
 * answers an interim question correctly (or requests a hint after 2 failures).
 *
 * Adapted from stat-physics (HIT) for OnoStats — uses CSS custom properties,
 * RTL layout, framer-motion animations. No XP/badges.
 */

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  FlaskConical,
} from 'lucide-react';

/* ─────────────────────── Types ─────────────────────── */

export interface DerivationStep {
  /** Short header shown in the accordion button */
  title: string;
  /** Main explanatory content — can be JSX */
  content: ReactNode;
  /** Optional gating question the student must answer to unlock the next step */
  interimQuestion?: {
    prompt: string;
    /** Return true if the student's trimmed answer is acceptable */
    validate: (answer: string) => boolean;
    hint: string;
    /** Shown explicitly after the student skips */
    correctAnswer?: string;
  };
}

interface Props {
  steps: DerivationStep[];
  /** Heading shown above the stepper */
  title?: string;
  /** Called when the last step is unlocked */
  onComplete?: () => void;
}

type StepState = 'locked' | 'unlocked' | 'hinting' | 'correct';

/* ─────────────────────── Component ─────────────────────── */

export function ScaffoldedDerivation({ steps, title, onComplete }: Props) {
  const [states, setStates] = useState<StepState[]>(() =>
    steps.map((_, i) => (i === 0 ? 'unlocked' : 'locked')),
  );
  const [expanded, setExpanded] = useState<boolean[]>(() =>
    steps.map((_, i) => i === 0),
  );
  const [answers, setAnswers] = useState<string[]>(() => steps.map(() => ''));
  const [attempts, setAttempts] = useState<number[]>(() =>
    steps.map(() => 0),
  );
  const [unlockedUpTo, setUnlockedUpTo] = useState(0);

  /* ── helpers ── */
  function mutateStates(idx: number, val: StepState) {
    setStates((prev) => prev.map((s, i) => (i === idx ? val : s)));
  }
  function setAnswer(idx: number, val: string) {
    setAnswers((prev) => prev.map((a, i) => (i === idx ? val : a)));
  }
  function toggleExpand(idx: number) {
    setExpanded((prev) => prev.map((e, i) => (i === idx ? !e : e)));
  }

  function unlockNext(fromIdx: number) {
    const next = fromIdx + 1;
    mutateStates(fromIdx, 'correct');
    if (next < steps.length) {
      setUnlockedUpTo(next);
      setStates((prev) =>
        prev.map((s, i) => {
          if (i === fromIdx) return 'correct';
          if (i === next) return 'unlocked';
          return s;
        }),
      );
      setExpanded((prev) => prev.map((e, i) => (i === next ? true : e)));
    } else {
      onComplete?.();
    }
  }

  function tryAnswer(idx: number) {
    const step = steps[idx];
    if (!step.interimQuestion) {
      unlockNext(idx);
      return;
    }
    const ans = answers[idx].trim();
    if (step.interimQuestion.validate(ans)) {
      unlockNext(idx);
    } else {
      const newAttempts = attempts[idx] + 1;
      setAttempts((prev) => prev.map((a, i) => (i === idx ? newAttempts : a)));
      mutateStates(idx, newAttempts >= 2 ? 'hinting' : 'unlocked');
    }
  }

  function skipWithHint(idx: number) {
    unlockNext(idx);
  }

  /* ── render ── */
  return (
    <div
      style={{
        border: '1px solid var(--border-primary)',
        borderRadius: '1.5rem',
        padding: '1.25rem',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-md)',
      }}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FlaskConical size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
        <span
          className="text-xs font-black uppercase tracking-widest"
          style={{ color: 'var(--accent-primary)' }}
        >
          {title ?? 'בניית הנוסחה שלב אחר שלב'}
        </span>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-2.5">
        {steps.map((step, idx) => {
          const state    = states[idx];
          const isLocked = state === 'locked';
          const isCorrect = state === 'correct';
          const isHinting = state === 'hinting';
          const isOpen    = expanded[idx] && !isLocked;
          const hasQ      = !!step.interimQuestion;
          const isActive  = idx === unlockedUpTo && !isCorrect;

          return (
            <div
              key={idx}
              style={{
                borderRadius: '1rem',
                overflow: 'hidden',
                border: `1.5px solid ${
                  isCorrect
                    ? 'var(--accent-success)'
                    : isActive
                    ? 'var(--accent-primary)'
                    : 'var(--border-primary)'
                }`,
                opacity: isLocked ? 0.45 : 1,
                transition: 'all 0.3s ease',
                background: 'var(--bg-card)',
              }}
            >
              {/* Step header button */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-right"
                onClick={() => !isLocked && toggleExpand(idx)}
                disabled={isLocked}
                style={{ background: 'transparent', cursor: isLocked ? 'not-allowed' : 'pointer' }}
              >
                {/* Step badge */}
                <span
                  style={{
                    flexShrink: 0,
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    background: isCorrect
                      ? 'rgba(22, 163, 74, 0.15)'
                      : isLocked
                      ? 'var(--bg-muted)'
                      : 'rgba(45, 100, 65, 0.12)',
                    color: isCorrect
                      ? 'var(--accent-success)'
                      : isLocked
                      ? 'var(--text-muted)'
                      : 'var(--accent-primary)',
                  }}
                >
                  {isCorrect ? (
                    <CheckCircle2 size={13} />
                  ) : isLocked ? (
                    <Lock size={11} />
                  ) : (
                    idx + 1
                  )}
                </span>

                {/* Title */}
                <span
                  className="flex-1 text-right text-sm font-semibold"
                  style={{
                    color: isLocked ? 'var(--text-muted)' : 'var(--text-primary)',
                  }}
                >
                  {step.title}
                </span>

                {!isLocked && (
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
                  </motion.div>
                )}
              </button>

              {/* Step content — animated */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="px-4 pb-4 flex flex-col gap-3">
                      {/* Main content */}
                      <div
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {step.content}
                      </div>

                      {/* Interim question — shown only at current active step */}
                      {hasQ && isActive && (
                        <div
                          className="rounded-xl p-4 flex flex-col gap-3"
                          style={{
                            background: 'rgba(45, 100, 65, 0.07)',
                            border: '1px solid var(--border-accent)',
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <Unlock
                              size={13}
                              style={{
                                color: 'var(--accent-primary)',
                                flexShrink: 0,
                                marginTop: 2,
                              }}
                            />
                            <p
                              className="text-sm font-semibold"
                              style={{ color: 'var(--accent-primary)' }}
                            >
                              {step.interimQuestion!.prompt}
                            </p>
                          </div>

                          {/* Hint banner */}
                          <AnimatePresence>
                            {isHinting && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-start gap-2 rounded-lg p-3"
                                style={{
                                  background: 'rgba(245, 158, 11, 0.1)',
                                  border: '1px solid var(--border-primary)',
                                }}
                              >
                                <Lightbulb
                                  size={12}
                                  style={{
                                    color: 'var(--accent-warning)',
                                    flexShrink: 0,
                                    marginTop: 2,
                                  }}
                                />
                                <p
                                  className="text-xs leading-relaxed"
                                  style={{ color: 'var(--accent-warning)' }}
                                >
                                  <strong>רמז:</strong> {step.interimQuestion!.hint}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Input row */}
                          <div className="flex gap-2" dir="ltr">
                            <input
                              type="text"
                              value={answers[idx]}
                              onChange={(e) => setAnswer(idx, e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && tryAnswer(idx)}
                              placeholder="תשובה..."
                              dir="rtl"
                              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all"
                              style={{
                                background: 'var(--bg-input)',
                                border: `1.5px solid ${
                                  attempts[idx] > 0
                                    ? 'var(--accent-error)'
                                    : 'var(--border-primary)'
                                }`,
                                color: 'var(--text-primary)',
                              }}
                            />
                            <button
                              onClick={() => tryAnswer(idx)}
                              className="px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95"
                              style={{
                                background: 'var(--accent-primary)',
                                color: 'var(--text-on-accent)',
                              }}
                            >
                              בדוק
                            </button>
                          </div>

                          {/* Error label */}
                          {attempts[idx] > 0 && !isHinting && (
                            <p
                              className="text-xs flex items-center gap-1"
                              style={{ color: 'var(--accent-error)' }}
                            >
                              <AlertCircle size={11} />
                              שגוי — נסה שוב (ניסיון {attempts[idx]}/2)
                            </p>
                          )}

                          {/* Skip with hint */}
                          {isHinting && (
                            <div className="flex flex-col gap-2">
                              {step.interimQuestion?.correctAnswer && (
                                <div
                                  className="rounded-lg p-3 text-xs"
                                  style={{
                                    background: 'rgba(22, 163, 74, 0.08)',
                                    color: 'var(--accent-success)',
                                    border: '1px solid var(--border-primary)',
                                  }}
                                >
                                  <strong>תשובה:</strong>{' '}
                                  {step.interimQuestion.correctAnswer}
                                </div>
                              )}
                              <button
                                onClick={() => skipWithHint(idx)}
                                className="text-xs underline transition-opacity hover:opacity-60 text-right"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                המשך לשלב הבא
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Continue button for steps without a question */}
                      {!hasQ && isActive && (
                        <button
                          onClick={() => unlockNext(idx)}
                          className="self-start px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                          style={{
                            background: 'var(--accent-primary)',
                            color: 'var(--text-on-accent)',
                          }}
                        >
                          הבנתי — המשך ›
                        </button>
                      )}

                      {/* Correct indicator */}
                      {isCorrect && (
                        <div
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                          style={{
                            background: 'rgba(22, 163, 74, 0.08)',
                            color: 'var(--accent-success)',
                          }}
                        >
                          <CheckCircle2 size={14} />
                          מצוין!
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
