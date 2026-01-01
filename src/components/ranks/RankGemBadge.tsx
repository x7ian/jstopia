'use client'

import Image from 'next/image'
import { BOOK1_RANKS, type RankSlug } from '@/lib/ranks/book1'

type RankGemBadgeProps = {
  rankSlug?: RankSlug | 'unranked'
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
}

const SIZE_MAP = {
  sm: 28,
  md: 40,
  lg: 64,
}

export function RankGemBadge({ rankSlug = 'unranked', size = 'md', showTitle = false }: RankGemBadgeProps) {
  const rank = BOOK1_RANKS.find((item) => item.slug === rankSlug)
  const dimension = SIZE_MAP[size]

  if (!rank || rankSlug === 'unranked') {
    return (
      <div
        className="flex items-center gap-2"
        title="Unranked"
        aria-label="Unranked"
      >
        <div
          className="rounded-full border border-white/20 bg-white/10"
          style={{ width: dimension, height: dimension }}
        />
        {showTitle ? (
          <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Unranked</span>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2" title={`${rank.title} — ${rank.description}`}>
      <Image
        src={rank.gemPath ?? ''}
        alt={`${rank.title} gem`}
        width={dimension}
        height={dimension}
        className="h-auto w-auto"
        style={{ filter: `drop-shadow(0 0 10px ${rank.accent ?? '#ffffff66'})` }}
      />
      {showTitle ? (
        <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">{rank.title}</span>
      ) : null}
    </div>
  )
}

