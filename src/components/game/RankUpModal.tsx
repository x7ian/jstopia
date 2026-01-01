'use client'

import { RankGemBadge } from '@/components/ranks/RankGemBadge'

type RankUpModalProps = {
  open: boolean
  previousRank: string
  newRank: string
  rankSlug?: string
  description?: string
  onClose: () => void
}

export function RankUpModal({ open, previousRank, newRank, rankSlug, description, onClose }: RankUpModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-strong relative w-full max-w-md rounded-3xl p-6 text-center shadow-[0_30px_60px_rgba(15,23,42,0.4)]">
        <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-[color:var(--accent)]/30 blur-3xl" />
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">Rank Up</p>
        <div className="mt-4 flex items-center justify-center">
          <RankGemBadge rankSlug={(rankSlug ?? 'unranked') as any} size="lg" />
        </div>
        <h2 className="mt-3 text-3xl font-semibold text-[color:var(--text)]">{newRank}</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          {description ?? `You advanced from ${previousRank} to ${newRank}.`}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="btn-primary mt-6 rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em]"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
