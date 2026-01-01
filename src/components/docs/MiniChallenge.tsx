'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type MiniChallengeProps = {
  title?: string
  hint?: string
  children: React.ReactNode
}

export function MiniChallenge({ title = 'Try it', hint, children }: MiniChallengeProps) {
  const [showHint, setShowHint] = useState(false)

  return (
    <div className="not-prose rounded-2xl border border-sky-200/70 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
        <Sparkles className="h-4 w-4 text-amber-400" />
        {title}
      </div>
      <div className="mt-2 text-sm text-slate-800">{children}</div>
      {hint ? (
        <button
          type="button"
          onClick={() => setShowHint((prev) => !prev)}
          className={cn(
            'mt-3 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-amber-700 transition hover:border-amber-300 hover:text-amber-800'
          )}
        >
          {showHint ? 'Hide hint' : 'Show hint'}
        </button>
      ) : null}
      {hint && showHint ? (
        <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
