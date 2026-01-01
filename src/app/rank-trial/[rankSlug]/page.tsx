'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { QuizSection } from '@/components/QuizSection'
import { getStoredSessionToken, setStoredSessionToken } from '@/lib/session'
import { RankUpModal } from '@/components/game/RankUpModal'

type BossRules = {
  questionCount: number
  allowedTipCount: number
  allowedDocRevealCount: number
  masteryMinHalfSteps: number
}

export default function RankTrialPage() {
  const params = useParams<{ rankSlug: string }>()
  const rankSlug = params.rankSlug
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [rules, setRules] = useState<BossRules | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [showRankModal, setShowRankModal] = useState(false)
  const [rankModalData, setRankModalData] = useState<{ previous: string; current: string; description?: string; slug?: string } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function startSession() {
      const existingToken = getStoredSessionToken()
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionToken: existingToken ?? undefined }),
      })
      const json = await res.json()
      if (!res.ok) return
      const token = json?.data?.sessionToken
      if (!token || cancelled) return
      setStoredSessionToken(token)
      setSessionToken(token)
    }

    startSession()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!sessionToken) return
    let cancelled = false

    async function loadRules() {
      const res = await fetch('/api/boss-exam/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionToken, rankSlug }),
      })
      const json = await res.json()
      if (!res.ok || cancelled) return
      setRules(json?.data?.rules ?? null)
    }

    loadRules()

    return () => {
      cancelled = true
    }
  }, [sessionToken, rankSlug])

  async function handleComplete(summary: {
    correctCount: number
    answered: number
    totalScore: number
    tipUsed: number
    docUsed: number
    masteryHalfSteps: number
  }) {
    if (!sessionToken || !rules) return
    const passed = summary.correctCount >= Math.ceil(rules.questionCount * 0.7)
    const res = await fetch('/api/boss-exam/finish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        rankSlug,
        passed,
        score: summary.correctCount,
        correctCount: summary.correctCount,
        questionCount: rules.questionCount,
        masteryHalfSteps: summary.masteryHalfSteps,
        helpUsedSummary: { tip: summary.tipUsed, doc: summary.docUsed },
      }),
    })
    const json = await res.json()
    if (!res.ok) return
    if (json?.data?.rankUp) {
      setRankModalData({
        previous: json?.data?.previousRank ?? '',
        current: json?.data?.newRankTitle ?? json?.data?.newRank ?? '',
        slug: json?.data?.newRank ?? undefined,
      })
      setShowRankModal(true)
      setStatus('Rank up achieved!')
    } else {
      setStatus(passed ? 'Trial completed. Requirements not met yet.' : 'Trial failed. Try again.')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-14 text-[color:var(--text)]">
      <section className="glass-strong rounded-[2rem] px-6 py-10 text-center sm:px-10">
        <p className="text-xs uppercase tracking-[0.4em] text-[color:var(--muted)]">Rank Trial</p>
        <h1 className="mt-3 text-4xl font-semibold text-[color:var(--text)] sm:text-5xl">
          {rankSlug.replace(/-/g, ' ')}
        </h1>
        <p className="mt-3 text-sm text-[color:var(--muted)]">
          Pass the boss exam to earn your next rank. Tip usage is limited and docs may be disabled.
        </p>
        {rules ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            <span>Questions: {rules.questionCount}</span>
            <span>Tips: {rules.allowedTipCount}</span>
            <span>Docs: {rules.allowedDocRevealCount}</span>
            <span>Mastery: {rules.masteryMinHalfSteps}/10</span>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/journey"
            className="btn-secondary rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-[0.35em]"
          >
            Back to Journey
          </Link>
        </div>
        {status ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">{status}</p>
        ) : null}
      </section>

      {rules && sessionToken ? (
        <QuizSection
          topicSlug=""
          sessionToken={sessionToken}
          mode="challenge"
          quizCount={rules.questionCount}
          phase="boss"
          rankSlug={rankSlug}
          helpLimits={{
            maxTipCount: rules.allowedTipCount,
            maxDocCount: rules.allowedDocRevealCount,
            allowDoc: rules.allowedDocRevealCount > 0,
          }}
          onComplete={handleComplete}
        />
      ) : (
        <div className="glass rounded-2xl p-6 text-sm text-[color:var(--muted)]">
          Loading trial rules…
        </div>
      )}

      <RankUpModal
        open={showRankModal}
        previousRank={rankModalData?.previous ?? ''}
        newRank={rankModalData?.current ?? ''}
        rankSlug={rankModalData?.slug}
        onClose={() => setShowRankModal(false)}
      />
    </div>
  )
}
