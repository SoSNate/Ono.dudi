import { useEffect, useRef } from 'react';

interface ReadinessGaugeProps {
  score: number; // 0-100
  size?: number;
}

export function ReadinessGauge({ score, size = 200 }: ReadinessGaugeProps) {
  const circleRef = useRef<SVGCircleElement>(null);

  const radius = (size / 2) * 0.75;
  const stroke = size * 0.07;
  const circumference = 2 * Math.PI * radius;
  // Arc spans 270° (from 135° to 45°)
  const arcLength = circumference * 0.75;
  const filled = (score / 100) * arcLength;
  const gap = arcLength - filled;

  const color =
    score >= 70
      ? '#10b981' // emerald
      : score >= 40
        ? '#f59e0b' // amber
        : '#ef4444'; // red

  const label =
    score >= 70
      ? 'מוכן לבחינה!'
      : score >= 40
        ? 'בדרך הנכונה'
        : 'המשך ללמוד';

  // Animate on mount / score change
  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.strokeDashoffset = `${arcLength}`;
    // force reflow
    void el.getBoundingClientRect();
    el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
    el.style.strokeDashoffset = `${gap}`;
  }, [score, arcLength, gap]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeDashoffset={circumference * 0.125}
          strokeLinecap="round"
          className="text-slate-200 dark:text-slate-700"
          style={{ transform: 'rotate(135deg)', transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Filled arc */}
        <circle
          ref={circleRef}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={stroke}
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeDashoffset={gap}
          strokeLinecap="round"
          style={{ transform: 'rotate(135deg)', transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.22}
          fontWeight="900"
          fill={color}
        >
          {score}%
        </text>
        <text
          x={cx}
          y={cy + size * 0.14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.07}
          fill="currentColor"
          className="fill-slate-500 dark:fill-slate-400"
        >
          מוכנות לבחינה
        </text>
      </svg>
      <span
        className="text-sm font-bold px-3 py-1 rounded-full"
        style={{ color, backgroundColor: `${color}18` }}
      >
        {label}
      </span>
    </div>
  );
}
