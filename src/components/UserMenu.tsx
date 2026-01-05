'use client'

import { useEffect, useRef, useState } from 'react'
import { getStoredSessionToken, setStoredSessionToken } from '@/lib/session'
import { RankGemBadge } from '@/components/ranks/RankGemBadge'

type RankState = {
  rankSlug?: string
  currentRank?: { slug: string; title: string; description: string }
  nextRank?: {
    slug: string
    title: string
    xpMin: number
    xpProgressPct: number
    comingSoon?: boolean
  } | null
  totalXp?: number
}

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const [rankState, setRankState] = useState<RankState | null>(null)
  const [displayName, setDisplayName] = useState('Traveler')
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const existingToken = getStoredSessionToken()
      const sessionRes = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionToken: existingToken ?? undefined }),
      })
      const sessionJson = await sessionRes.json()
      if (!sessionRes.ok || cancelled) return
      const sessionToken = sessionJson?.data?.sessionToken
      if (!sessionToken) return
      setStoredSessionToken(sessionToken)
      setDisplayName(`Traveler ${sessionToken.slice(0, 4).toUpperCase()}`)

      const rankRes = await fetch(
        `/api/rank?sessionToken=${sessionToken}&bookSlug=javascriptopia-vanillaland-foundations`
      )
      const rankJson = await rankRes.json()
      if (!rankRes.ok || cancelled) return
      setRankState(rankJson?.data ?? null)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node | null
      if (!open || !menuRef.current || !target) return
      if (menuRef.current.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-3 py-1 text-xs uppercase tracking-[0.3em] text-[color:var(--text)]"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--accent)]/20 text-[0.65rem] font-semibold text-[color:var(--text)]">
          👤
        </span>
        <span className="hidden sm:inline">User</span>
      </button>

      {open ? (
        <div className="absolute right-0 mt-3 w-[280px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--panel-strong)] p-4 text-sm text-[color:var(--text)] shadow-[0_18px_40px_rgba(2,6,23,0.45)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Profile</p>
          <p className="mt-2 text-base font-semibold">{displayName}</p>
          <div className="mt-4 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Current Rank</p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <RankGemBadge rankSlug={(rankState?.rankSlug ?? rankState?.currentRank?.slug ?? 'unranked') as any} size="sm" />
              <span>{rankState?.currentRank?.title ?? 'Unranked'}</span>
            </div>
            {rankState?.nextRank ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                  <span>Next: {rankState.nextRank.title}</span>
                  <span>
                    XP {rankState.totalXp ?? 0}/{rankState.nextRank.xpMin}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[color:var(--accent)]"
                    style={{ width: `${Math.round((rankState.nextRank.xpProgressPct ?? 0) * 100)}%` }}
                  />
                </div>
                {rankState.nextRank.bossExam?.available ? (
                  <a
                    href={`/rank-trial/${rankState.nextRank.slug}`}
                    className="inline-flex rounded-full border border-amber-300 bg-amber-200/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-900"
                  >
                    Trial Available
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
