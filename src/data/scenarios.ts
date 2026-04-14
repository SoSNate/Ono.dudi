/* ════════════════════════════════════════════════════════════════════════════
   Scenarios — extracted from lab components
   ════════════════════════════════════════════════════════════════════════════ */

// ── Conditional Probability ───────────────────────────────────────────────────

export interface ConditionalScenario {
  name: string;
  aLabel: string;
  bLabel: string;
  pA: number;
  pBgA: number;    // P(B|A)
  pBgAc: number;   // P(B|Aᶜ)
}

export const CONDITIONAL_SCENARIOS: ConditionalScenario[] = [
  {
    name: 'בדיקה רפואית',
    aLabel: 'חולה',
    bLabel: 'בדיקה חיובית',
    pA: 0.01,
    pBgA: 0.99,
    pBgAc: 0.05,
  },
  {
    name: 'מוצר פגום',
    aLabel: 'פגום',
    bLabel: 'נדחה',
    pA: 0.03,
    pBgA: 0.95,
    pBgAc: 0.02,
  },
  {
    name: 'ספאם',
    aLabel: 'ספאם',
    bLabel: 'מילת מפתח',
    pA: 0.20,
    pBgA: 0.90,
    pBgAc: 0.10,
  },
  {
    name: 'הלוואה',
    aLabel: 'לקוח בסיכון',
    bLabel: 'פיגור בתשלום',
    pA: 0.15,
    pBgA: 0.60,
    pBgAc: 0.08,
  },
];

// ── Discrete Distributions ────────────────────────────────────────────────────

export type DistType = 'binomial' | 'poisson';

export interface DiscreteScenario {
  name: string;
  distType: DistType;
  description: string;
  n?: number;
  p?: number;
  lambda?: number;
}

export const DISCRETE_SCENARIOS: DiscreteScenario[] = [
  {
    name: 'פגמים בקו ייצור',
    distType: 'binomial',
    description: 'קו ייצור מוציא פריטים. כל פריט עשוי להיות פגום (הצלחה) או תקין (כישלון) — n ניסויים עצמאיים עם הסתברות p קבועה.',
    n: 20,
    p: 0.05,
  },
  {
    name: 'לקוחות בשעה',
    distType: 'poisson',
    description: 'מספר לקוחות המגיעים לחנות בשעה — קצב ממוצע λ ללא מספר ניסויים קבוע.',
    lambda: 4,
  },
  {
    name: 'מבחני קבלה',
    distType: 'binomial',
    description: 'n מועמדים ניגשים למבחן. כל אחד עובר (הצלחה) או נכשל (כישלון) — ניסויים עצמאיים עם הסתברות הצלחה p.',
    n: 10,
    p: 0.30,
  },
  {
    name: 'קליקים על מודעה',
    distType: 'poisson',
    description: 'מספר קליקים על מודעה דיגיטלית בדקה — מספר אירועים ביחידת זמן.',
    lambda: 3,
  },
  {
    name: 'פריטים תקינים',
    distType: 'binomial',
    description: 'n פריטים מהקו. כל פריט תקין (הצלחה) או פגום (כישלון) — סדרת ניסויים עצמאיים.',
    n: 15,
    p: 0.80,
  },
];

// ── Frequency / Descriptive ───────────────────────────────────────────────────

export interface FrequencyInterval {
  lower: number;   // lower bound (inclusive)
  upper: number;   // upper bound (exclusive for all but last)
  fx: number;      // frequency
}

export interface FrequencyScenario {
  name: string;
  unit: string;
  intervals: FrequencyInterval[];
}

export const FREQUENCY_SCENARIOS: FrequencyScenario[] = [
  {
    name: 'זמן המתנה בשירות לקוחות',
    unit: 'דקות',
    intervals: [
      { lower: 0,  upper: 5,  fx: 8  },
      { lower: 5,  upper: 10, fx: 14 },
      { lower: 10, upper: 15, fx: 10 },
      { lower: 15, upper: 20, fx: 6  },
      { lower: 20, upper: 25, fx: 2  },
    ],
  },
  {
    name: 'ציוני מבחן סטטיסטיקה',
    unit: 'נקודות',
    intervals: [
      { lower: 50, upper: 60, fx: 4  },
      { lower: 60, upper: 70, fx: 11 },
      { lower: 70, upper: 80, fx: 16 },
      { lower: 80, upper: 90, fx: 9  },
      { lower: 90, upper: 100, fx: 5 },
    ],
  },
  {
    name: 'גיל לקוחות בסניף',
    unit: 'שנים',
    intervals: [
      { lower: 20, upper: 30, fx: 7  },
      { lower: 30, upper: 40, fx: 13 },
      { lower: 40, upper: 50, fx: 12 },
      { lower: 50, upper: 60, fx: 8  },
      { lower: 60, upper: 70, fx: 5  },
    ],
  },
];
