import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'

interface ConceptCardProps {
  title: string
  intuition: string
  formula: string
  tip?: string
}

export default function ConceptCard({ title, intuition, formula, tip }: ConceptCardProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-xl border mb-4 overflow-hidden transition-all bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/40">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-right text-emerald-800 dark:text-emerald-300"
      >
        <span className="flex items-center gap-2 font-semibold text-sm">
          <Lightbulb size={15} />
          {title}
        </span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {/* הסבר אינטואיטיבי */}
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {intuition}
          </p>

          {/* נוסחה */}
          <div className="rounded-lg px-3 py-2 font-mono text-sm text-center tracking-wide bg-white text-emerald-700 border border-emerald-200 dark:bg-slate-800 dark:text-emerald-300 dark:border-transparent">
            {formula}
          </div>

          {/* טיפ לבחינה */}
          {tip && (
            <div className="flex gap-2 text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/30">
              <span className="shrink-0">⭐ בחינה:</span>
              <span>{tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
