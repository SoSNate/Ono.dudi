import type { ReactNode } from 'react';

/* ════════════════════════════════════════════════════════════════════════════
   Shared Math Helpers
   Deduplicated from multiple lab files (ConditionalProbLab, DescriptiveLab,
   NormalDistLab, GlossaryPage, etc.)
   ════════════════════════════════════════════════════════════════════════════ */

/* ─── Rounding helpers ─── */
/** Round to 2 decimal places */
export function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Round to 4 decimal places */
export function r4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Round to N decimal places */
export function rN(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

/* ─── Display Components ─── */

/**
 * MathDisplay — Centered, monospace, LTR math expression container.
 * Used in all labs for showing formulas and calculations.
 */
export function MathDisplay({ children }: { children: ReactNode }) {
  return (
    <div
      className="font-mono text-base text-center py-3 px-4 rounded-2xl my-3"
      style={{
        background: 'var(--bg-math)',
        color: 'var(--text-primary)',
      }}
      dir="ltr"
    >
      {children}
    </div>
  );
}

/**
 * MathFraction — Displays a styled fraction with numerator/denominator.
 * Used in DescriptiveLab, GlossaryPage, and the new FrequencyTableBuilder.
 */
export function MathFraction({
  top,
  bottom,
  className = '',
}: {
  top: ReactNode;
  bottom: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex flex-col items-center mx-1 ${className}`}>
      <span className="px-1 text-sm">{top}</span>
      <span
        className="w-full h-px my-0.5"
        style={{ background: 'var(--text-primary)' }}
      />
      <span className="px-1 text-sm">{bottom}</span>
    </span>
  );
}

/* ─── Statistical Calculations ─── */

/** Calculate mean from an array of numbers */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Calculate weighted mean from values and frequencies */
export function weightedMean(values: number[], frequencies: number[]): number {
  const n = frequencies.reduce((a, b) => a + b, 0);
  if (n === 0) return 0;
  const sum = values.reduce((acc, v, i) => acc + v * frequencies[i], 0);
  return sum / n;
}

/** Calculate variance (sample — Bessel's correction, n−1) */
export function variance(values: number[]): number {
  const m = mean(values);
  return values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
}

/** Calculate standard deviation (sample — √S²) */
export function stdDev(values: number[]): number {
  return Math.sqrt(variance(values));
}

/** Calculate median from sorted array */
export function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Grouped Median (Me) — Ono interpolation formula
 * Me = L + ((N/2 - F_prev) / f_me) * h
 * where:
 *   L = lower bound of median class
 *   N = total observations
 *   F_prev = cumulative frequency before median class
 *   f_me = frequency of median class
 *   h = class width
 */
export function groupedMedian(
  intervals: { lower: number; upper: number }[],
  frequencies: number[],
): number {
  const N = frequencies.reduce((a, b) => a + b, 0);
  const half = N / 2;

  let cumFreq = 0;
  let medianIdx = 0;

  for (let i = 0; i < frequencies.length; i++) {
    if (cumFreq + frequencies[i] >= half) {
      medianIdx = i;
      break;
    }
    cumFreq += frequencies[i];
  }

  const L = intervals[medianIdx].lower;
  const h = intervals[medianIdx].upper - intervals[medianIdx].lower;
  const f_me = frequencies[medianIdx];
  const F_prev = cumFreq;

  return L + ((half - F_prev) / f_me) * h;
}

/** Calculate quartiles (Q1, Q2, Q3) from sorted array */
export function quartiles(sorted: number[]): [number, number, number] {
  const q2 = median(sorted);
  const n = sorted.length;
  const lower = sorted.slice(0, Math.floor(n / 2));
  const upper = sorted.slice(n % 2 === 0 ? n / 2 : Math.floor(n / 2) + 1);
  return [median(lower), q2, median(upper)];
}

/* ─── Tolerance check (for interactive inputs) ─── */

/** Check if a student's answer is within tolerance of the expected value */
export function isClose(student: number, expected: number, tolerance = 0.005): boolean {
  return Math.abs(student - expected) <= tolerance;
}

/* ─── Generate raw data from frequency distribution ─── */

/**
 * Generate N raw data points distributed across intervals according to frequencies.
 * Each point is random-uniform within its interval.
 */
export function generateRawFromFrequencies(
  intervals: { lower: number; upper: number }[],
  frequencies: number[],
): number[] {
  const raw: number[] = [];
  for (let i = 0; i < intervals.length; i++) {
    const { lower, upper } = intervals[i];
    for (let j = 0; j < frequencies[i]; j++) {
      raw.push(r2(lower + Math.random() * (upper - lower)));
    }
  }
  // Shuffle to avoid ordering bias
  for (let i = raw.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [raw[i], raw[j]] = [raw[j], raw[i]];
  }
  return raw;
}
