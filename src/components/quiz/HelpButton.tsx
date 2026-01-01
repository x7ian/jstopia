'use client'

import { cn } from '@/lib/utils'

type HelpButtonProps = {
  onClick?: () => void
  disabled?: boolean
  active?: boolean
  label?: string
}

export function HelpButton({ onClick, disabled, active, label = 'Tip' }: HelpButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:text-sky-900 disabled:cursor-not-allowed disabled:opacity-50',
        active && 'border-sky-300 text-sky-900'
      )}
    >
      <span className="text-base font-bold">?</span>
      <span className="text-xs uppercase tracking-[0.3em]">{label}</span>
    </button>
  )
}
