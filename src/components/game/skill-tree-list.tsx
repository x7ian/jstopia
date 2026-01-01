'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

type Level = {
  id: string
  slug: string
  title: string
  description?: string | null
  order?: number | null
}

const STORAGE_KEY = 'jsquizup-unlocked-count'

export function SkillTreeList({ levels }: { levels: Level[] }) {
  const [unlockedCount, setUnlockedCount] = useState(1)

  useEffect(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY) ?? '1')
    setUnlockedCount(Number.isFinite(stored) && stored > 0 ? stored : 1)
  }, [])

  useEffect(() => {
    const syncFromStorage = () => {
      const stored = Number(localStorage.getItem(STORAGE_KEY) ?? '1')
      if (Number.isFinite(stored) && stored > unlockedCount) {
        setUnlockedCount(stored)
      }
    }
    window.addEventListener('storage', syncFromStorage)
    return () => window.removeEventListener('storage', syncFromStorage)
  }, [unlockedCount])

  const orderedLevels = useMemo(
    () =>
      levels
        .map((topic, index) => ({
          ...topic,
          effectiveOrder: typeof topic.order === 'number' ? topic.order : index,
        }))
        .sort((a, b) => a.effectiveOrder - b.effectiveOrder),
    [levels]
  )

  return (
    <div className="w-full max-w-2xl space-y-4">
      {orderedLevels.map((topic) => {
        const levelNumber = topic.effectiveOrder
        const unlocked = levelNumber < unlockedCount

        return (
          <Link
            key={topic.id}
            href={unlocked ? `/play?topic=${topic.slug}` : '#'}
            prefetch={false}
            aria-disabled={!unlocked}
            className={`group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 ${
              unlocked
                ? 'hover:border-sky-400/60 hover:bg-white/10 hover:shadow-[0_18px_38px_rgba(59,130,246,0.18)]'
                : 'cursor-not-allowed opacity-60'
            }`}
          >
            <div className="absolute inset-0 translate-y-full bg-gradient-to-r from-sky-500/15 via-indigo-500/15 to-purple-500/15 transition group-hover:translate-y-0" />
            <div className="relative flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-slate-900/70 text-sm font-semibold text-slate-100">
                Lv {levelNumber}
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-lg font-semibold text-white">{topic.title}</span>
                {topic.description && <p className="text-sm text-slate-300/70">{topic.description}</p>}
              </div>
              <Badge
                variant={unlocked ? 'default' : 'outline'}
                className={`shrink-0 border ${
                  unlocked ? 'border-sky-400/40 bg-sky-400/90 text-slate-900' : 'border-white/20 text-slate-300/70'
                }`}
              >
                {unlocked ? 'Unlocked' : 'Locked'}
              </Badge>
              <span aria-hidden className={`ml-4 text-lg transition-transform duration-300 ${unlocked ? 'group-hover:translate-x-1' : ''}`}>
                →
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
