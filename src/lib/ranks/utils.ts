import { BOOK1_RANKS } from '@/lib/ranks/book1'
import type { RankDefinition } from '@/lib/ranks/types'

export function getRankList() {
  return BOOK1_RANKS
}

export function getRankBySlug(slug: string | null | undefined) {
  return BOOK1_RANKS.find((rank) => rank.slug === slug) ?? BOOK1_RANKS[0]
}

export function getRankIndex(slug: string | null | undefined) {
  return BOOK1_RANKS.findIndex((rank) => rank.slug === slug)
}

export function getNextRank(slug: string | null | undefined): RankDefinition | null {
  const index = getRankIndex(slug)
  if (index < 0 || index >= BOOK1_RANKS.length - 1) return null
  return BOOK1_RANKS[index + 1]
}
