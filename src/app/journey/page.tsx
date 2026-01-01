'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { JourneyTree, type JourneyBook } from '@/components/journey/JourneyTree'
import { getStoredSessionToken, setStoredSessionToken } from '@/lib/session'
import { RankUpModal } from '@/components/game/RankUpModal'
import { RankGemBadge } from '@/components/ranks/RankGemBadge'

export default function JourneyPage() {
  const [books, setBooks] = useState<JourneyBook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rankState, setRankState] = useState<{
    rankSlug?: string
    currentRank?: { slug: string; title: string; description: string }
    nextRank?: {
      slug: string
      title: string
      description: string
      xpMin: number
      xpProgressPct: number
      comingSoon?: boolean
    } | null
    totalXp?: number
  } | null>(null)
  const [showRankModal, setShowRankModal] = useState(false)
  const [rankModalData, setRankModalData] = useState<{ previous: string; current: string; description?: string; slug?: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const existingToken = getStoredSessionToken()
        const sessionRes = await fetch('/api/session/start', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionToken: existingToken ?? undefined }),
        })

        const sessionJson = await sessionRes.json()
        if (!sessionRes.ok) {
          throw new Error(sessionJson?.error ?? 'Unable to start session')
        }

        const sessionToken = sessionJson?.data?.sessionToken
        if (!sessionToken) {
          throw new Error('Missing session token')
        }

        setStoredSessionToken(sessionToken)

        const journeyRes = await fetch(`/api/journey?sessionToken=${sessionToken}`)
        const journeyJson = await journeyRes.json()
        if (!journeyRes.ok) {
          throw new Error(journeyJson?.error ?? 'Unable to load journey')
        }

        if (!cancelled) {
          setBooks(journeyJson?.data?.books ?? [])
        }

        const rankRes = await fetch(`/api/rank?sessionToken=${sessionToken}&bookSlug=javascriptopia-vanillaland-foundations`)
        const rankJson = await rankRes.json()
        if (rankRes.ok && !cancelled) {
          setRankState(rankJson?.data ?? null)
          const currentSlug = rankJson?.data?.currentRank?.slug
          if (currentSlug && typeof window !== 'undefined') {
            const stored = window.localStorage.getItem('jsopia.rankSlug')
            if (stored && stored !== currentSlug) {
              setRankModalData({
                previous: stored,
                current: rankJson?.data?.currentRank?.title ?? currentSlug,
                description: rankJson?.data?.currentRank?.description,
                slug: currentSlug,
              })
              setShowRankModal(true)
            }
            window.localStorage.setItem('jsopia.rankSlug', currentSlug)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load journey')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-14 text-[color:var(--text)]">
      <section className="glass-strong relative overflow-hidden rounded-[2rem] px-6 py-10 text-center sm:px-10">
        <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-[color:var(--accent)]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-16 h-44 w-44 rounded-full bg-[color:var(--accent2)]/20 blur-3xl" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6">
          <Image
            src="/brand/JavaScriptopia-logo.png"
            alt="Javascriptopia"
            width={640}
            height={360}
            priority
            className="w-full max-w-[640px] drop-shadow-[0_0_25px_rgba(56,189,248,0.45)]"
          />
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            <span>Learn · Play · Master</span>
          </div>
          <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">Journey</p>
          <h1 className="text-4xl font-semibold text-[color:var(--text)] sm:text-5xl">
            Choose your next campfire
          </h1>
          <p className="text-sm text-[color:var(--muted)] sm:text-base">
            Progress through the learning worlds, unlock chapters, and conquer each lesson with focused quizzes.
          </p>
          <button className="btn-primary rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em]">
            Start Adventure
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center text-[color:var(--muted)]">Loading your journey…</div>
      ) : error ? (
        <div className="glass rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>
      ) : (
        <JourneyTree books={books} onSelectTopic={(slug) => router.push(`/topic/${slug}`)} />
      )}

      <RankUpModal
        open={showRankModal}
        previousRank={rankModalData?.previous ?? ''}
        newRank={rankModalData?.current ?? ''}
        rankSlug={rankModalData?.slug}
        description={rankModalData?.description}
        onClose={() => setShowRankModal(false)}
      />
    </div>
  )
}
