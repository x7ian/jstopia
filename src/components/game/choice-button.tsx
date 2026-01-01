'use client'

import { cn } from '@/lib/utils'

type ChoiceButtonProps = {
  children: React.ReactNode
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
}

export function ChoiceButton({ children, selected, onClick, disabled }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex w-full items-center justify-between rounded-2xl border px-5 py-3 text-left text-base font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 disabled:cursor-not-allowed disabled:opacity-60',
        'border-white/12 bg-white/[0.04] text-slate-100 hover:border-white/24 hover:bg-white/8',
        selected &&
          'border-sky-400/60 bg-sky-500/15 text-sky-100 shadow-[0_14px_32px_rgba(56,189,248,0.18)] hover:border-sky-400/60 hover:bg-sky-500/20'
      )}
    >
      <span className="pr-3">{children}</span>
      <span
        className={cn(
          'flex h-4 w-4 items-center justify-center rounded-full border border-white/25 text-[0.6rem] uppercase tracking-wide text-white/60 transition',
          selected && 'border-sky-300 bg-sky-400 text-slate-900 shadow-[0_0_12px_rgba(56,189,248,0.55)]'
        )}
      >
        {selected ? '✓' : ''}
      </span>
    </button>
  )
}
