'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { QuizSection } from '@/components/QuizSection'
import { TopicHUD } from '@/components/game/TopicHUD'
import { UserMenu } from '@/components/UserMenu'
import { RankUpModal } from '@/components/game/RankUpModal'
import { StickyTopicControls } from '@/components/StickyTopicControls'
import { DocAnchorHighlighter } from '@/components/docs/DocAnchorHighlighter'
import { getStoredSessionToken, setStoredSessionToken } from '@/lib/session'
import { scrollToId } from '@/lib/scroll'
import { scrollToAnchor } from '@/lib/docs/scrollToAnchor'
import { cn } from '@/lib/utils'

type TopicExperienceProps = {
  topic: { slug: string; title: string; storyIntro?: string | null }
  chapter: { title: string }
  book: { title: string; slug: string }
  doc: { title: string; objectives: string[]; estimatedMinutes?: number | null } | null
  docBlocks: { anchor: string; title?: string | null }[]
  nav: { nextTopicSlug?: string | null }
  quizCount: number
  children: React.ReactNode
}

type WeakSpot = { anchor: string; title: string; wrongCount: number }
type RankState = {
  rankSlug?: string
  currentRank: { slug: string; title: string; description: string }
  nextRank: {
    slug: string
    title: string
    description: string
    xpMin: number
    xpProgressPct: number
    comingSoon?: boolean
  } | null
  totalXp: number
}

const STORAGE_KEY = 'jsquest-topic-mode'
const RANK_STORAGE_KEY = 'jsopia.rankSlug'
const PROLOGUE_READ_ONLY_SLUGS = new Set([
  'prologue-welcome',
  'prologue-browser-wars',
  'prologue-where-js-lives',
])

export function TopicExperience({
  topic,
  chapter,
  book,
  doc,
  docBlocks,
  nav,
  quizCount,
  children,
}: TopicExperienceProps) {
  const [mode, setMode] = useState<'learn' | 'challenge'>('learn')
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [readPercent, setReadPercent] = useState(0)
  const [quizAnswered, setQuizAnswered] = useState(0)
  const [showMenu, setShowMenu] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hud, setHud] = useState({
    masteryHalfSteps: 0,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    quizIndex: 0,
    quizTotal: quizCount,
    totalScore: 0,
    topicScore: 0,
    lastDelta: undefined as number | undefined,
  })
  const [summary, setSummary] = useState<{
    correctCount: number
    answered: number
    totalScore: number
    tipUsed: number
    docUsed: number
    masteryHalfSteps?: number
  } | null>(null)
  const [weakSpots, setWeakSpots] = useState<WeakSpot[]>([])
  const [autoScrolled, setAutoScrolled] = useState(false)
  const [rankState, setRankState] = useState<RankState | null>(null)
  const [showRankModal, setShowRankModal] = useState(false)
  const [rankModalData, setRankModalData] = useState<{
    previous: string
    current: string
    description?: string
    slug?: string
  } | null>(null)
  const docRef = useRef<HTMLDivElement | null>(null)
  const lessonCompletionSent = useRef(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'learn' || stored === 'challenge') {
      setMode(stored)
    }
  }, [])

  useEffect(() => {
    document.body.classList.add('topic-layout')
    document.body.dataset.theme = 'forest'
    return () => {
      document.body.classList.remove('topic-layout')
      document.body.dataset.theme = 'space'
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  useEffect(() => {
    if (mode !== 'challenge' || autoScrolled) return
    setAutoScrolled(true)
    window.setTimeout(() => scrollToId('quiz'), 150)
  }, [mode, autoScrolled])

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

    async function loadRank() {
      const res = await fetch(`/api/rank?sessionToken=${sessionToken}&bookSlug=${book.slug}`)
      const json = await res.json()
      if (!res.ok || cancelled) return
      const nextState = json?.data ?? null
      setRankState(nextState)

      const currentSlug = nextState?.currentRank?.slug
      if (currentSlug && typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(RANK_STORAGE_KEY)
        if (stored && stored !== currentSlug) {
          setRankModalData({
            previous: stored,
            current: nextState?.currentRank?.title ?? currentSlug,
            description: nextState?.currentRank?.description,
            slug: currentSlug,
          })
          setShowRankModal(true)
        }
        window.localStorage.setItem(RANK_STORAGE_KEY, currentSlug)
      }
    }

    loadRank()

    return () => {
      cancelled = true
    }
  }, [sessionToken, book.slug])

  useEffect(() => {
    if (!sessionToken || lessonCompletionSent.current) return
    if (!PROLOGUE_READ_ONLY_SLUGS.has(topic.slug)) return
    lessonCompletionSent.current = true
    void fetch('/api/lesson/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionToken, topicSlug: topic.slug }),
    })
  }, [sessionToken, topic.slug])

  useEffect(() => {
    function updateProgress() {
      const doc = docRef.current
      if (!doc) return
      const top = doc.getBoundingClientRect().top + window.scrollY
      const height = doc.offsetHeight
      const view = window.innerHeight
      if (height <= 0) return
      const cursor = window.scrollY + view * 0.35
      const raw = height <= view ? 1 : (cursor - top) / (height - view * 0.35)
      const clamped = Math.max(0, Math.min(1, raw))
      setReadPercent(Math.round(clamped * 100))
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  const progressText = useMemo(
    () => `Read ${readPercent}% • Quiz ${quizAnswered}/${quizCount}`,
    [readPercent, quizAnswered, quizCount]
  )

  useEffect(() => {
    setHud((prev) => ({ ...prev, quizTotal: quizCount }))
  }, [quizCount])

  async function handleQuizComplete(nextSummary: {
    correctCount: number
    answered: number
    totalScore: number
    tipUsed: number
    docUsed: number
    masteryHalfSteps: number
  }) {
    setSummary(nextSummary)
    if (sessionToken && topic.slug === 'prologue-final-quiz') {
      await fetch('/api/prologue/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          topicSlug: topic.slug,
          correctCount: nextSummary.correctCount,
          answered: nextSummary.answered,
          masteryHalfSteps: nextSummary.masteryHalfSteps,
        }),
      })
    }
    if (!sessionToken) return
    const res = await fetch(`/api/topic/weak-spots?topicSlug=${topic.slug}&sessionToken=${sessionToken}`)
    const json = await res.json()
    if (res.ok) {
      setWeakSpots(json?.data ?? [])
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 pb-12 pt-[13.5rem] text-[17px] leading-relaxed text-[color:var(--text)] lg:mx-0 lg:ml-auto lg:mr-[18rem] lg:w-[calc(100%-18rem-1.5rem)] lg:max-w-[calc(100%-18rem-1.5rem)]">
      <div className="fixed left-0 right-0 top-4 z-40 px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 rounded-full glass-strong px-4 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)] lg:mx-0 lg:ml-auto lg:mr-[18rem] lg:w-[calc(100%-18rem-1.5rem)] lg:max-w-[calc(100%-18rem-1.5rem)]">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/javascriptopia_logo_cropped.png"
              alt="Javascriptopia"
              width={180}
              height={72}
              priority
              className="h-8 w-auto drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]"
            />
            <Link
              href="/journey"
              className="inline-flex items-center gap-2 rounded-full btn-secondary px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em]"
            >
              <span aria-hidden>←</span>
              Back to Journey
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[0.6rem] text-[color:var(--muted)]">Learn · Play · Master</span>
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="fixed left-0 right-0 top-16 z-30 px-6">
        <div className="mx-auto w-full max-w-6xl lg:mx-0 lg:ml-auto lg:mr-[18rem] lg:w-[calc(100%-18rem-1.5rem)] lg:max-w-[calc(100%-18rem-1.5rem)]">
        <div className="glass-strong rounded-2xl p-2 text-xs text-[color:var(--text)]">
            <div className="mt-3">
              <TopicHUD
                {...hud}
                rankSlug={rankState?.currentRank?.slug ?? 'unranked'}
                rankTitle={rankState?.currentRank?.title ?? 'Unranked'}
                trialAvailable={false}
                trialSlug={null}
              />
            </div>
          </div>
        </div>
      </div>

      <StickyTopicControls
        mode={mode}
        onModeChange={setMode}
        progressText={progressText}
        sections={docBlocks}
        showMenu={showMenu}
        onToggleMenu={() => setShowMenu((prev) => !prev)}
        hud={hud}
        showProgress={false}
      />
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="rounded-full border border-sky-200 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700 shadow-[0_12px_24px_rgba(59,130,246,0.2)]"
        >
          {mobileMenuOpen ? 'Close' : 'Menu'}
        </button>
        <button
          type="button"
          onClick={() => scrollToId('quiz')}
          className="rounded-full border border-amber-300 bg-amber-200/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-900 shadow-[0_12px_24px_rgba(59,130,246,0.2)]"
        >
          Jump to Quiz
        </button>
      </div>
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
          />
          <div className="absolute right-4 top-24 w-[260px] rounded-3xl border border-sky-200/70 bg-white/95 p-4 text-sm text-slate-700 shadow-[0_18px_40px_rgba(59,130,246,0.2)]">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sections</p>
            <div className="mt-3 max-h-[60vh] space-y-2 overflow-auto pr-1">
              {docBlocks.length > 0 ? (
                docBlocks.map((block) => (
                  <button
                    key={block.anchor}
                    type="button"
                    onClick={() => {
                      scrollToAnchor(block.anchor)
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full rounded-xl border border-transparent px-3 py-2 text-left text-sm text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
                  >
                    {block.title ?? block.anchor}
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-500">No sections yet.</p>
              )}
              <button
                type="button"
                onClick={() => {
                  scrollToId('quiz')
                  setMobileMenuOpen(false)
                }}
                className="block w-full rounded-xl border border-amber-200 bg-amber-100/70 px-3 py-2 text-left text-sm font-semibold text-amber-900"
              >
                Jump to Quiz
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <header className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            {book.title} • {chapter.title}
          </p>
          <h1 className="text-3xl font-semibold text-[color:var(--text)]">{topic.title}</h1>
          {topic.storyIntro ? <p className="text-base text-[color:var(--muted)]">{topic.storyIntro}</p> : null}
        </div>

        {doc?.objectives?.length ? (
          <div className="glass rounded-2xl p-5 text-base text-[color:var(--text)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Objectives</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[color:var(--text)]">
              {doc.objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3" />

        <div className="flex flex-wrap items-center gap-3 lg:hidden">
          <div className="rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
            {progressText}
          </div>
          <div className="flex overflow-hidden rounded-full border border-sky-200 bg-white/80 text-xs font-semibold uppercase tracking-[0.3em]">
            <button
              type="button"
              onClick={() => setMode('learn')}
              className={cn('px-4 py-2 transition', mode === 'learn' ? 'bg-sky-200 text-sky-900' : 'text-slate-500')}
            >
              Learn
            </button>
            <button
              type="button"
              onClick={() => setMode('challenge')}
              className={cn(
                'px-4 py-2 transition',
                mode === 'challenge' ? 'bg-amber-200 text-amber-900' : 'text-slate-500'
              )}
            >
              Challenge
            </button>
          </div>
        </div>
      </header>

      <section id="scrollbook" ref={docRef} className="scroll-mt-24 space-y-6">
        <DocAnchorHighlighter />
        <div className="sticky top-20 z-20 glass rounded-2xl px-4 py-3 text-sm text-[color:var(--text)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Scrollbook</p>
          <p className="mt-1 text-lg font-semibold text-[color:var(--text)]">{topic.title}</p>
        </div>
        {doc ? (
          <article className="glass-strong space-y-7 rounded-3xl p-6 text-base text-[color:var(--text)] md:p-7">
            {children}
          </article>
        ) : (
          <div className="glass rounded-2xl p-6 text-sm text-[color:var(--muted)]">
            No doc page is linked to this lesson yet.
          </div>
        )}
      </section>

      {quizCount > 0 ? (
        <QuizSection
          topicSlug={topic.slug}
          sessionToken={sessionToken}
          mode={mode}
          quizCount={quizCount}
          onProgress={setQuizAnswered}
          onHudUpdate={setHud}
          onComplete={handleQuizComplete}
        />
      ) : null}

      {summary ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 text-base text-slate-800 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Completion Summary</p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Score</p>
              <p className="mt-1 text-xl font-semibold">{summary.totalScore}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Correct</p>
              <p className="mt-1 text-xl font-semibold">
                {summary.correctCount}/{summary.answered}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Help used</p>
              <p className="mt-1 text-xl font-semibold">
                Tip {summary.tipUsed} • Doc {summary.docUsed}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Weak spots</p>
            {weakSpots.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {weakSpots.slice(0, 4).map((spot) => (
                  <li key={spot.anchor} className="rounded-xl border border-emerald-200 bg-white/80 px-4 py-2">
                    <span className="font-semibold">{spot.title}</span>
                    <span className="ml-2 text-xs uppercase tracking-[0.2em] text-emerald-600/80">
                      Missed {spot.wrongCount}x
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-slate-600">No weak spots tracked yet.</p>
            )}
          </div>
          {nav.nextTopicSlug ? (
            <Link
              href={`/topic/${nav.nextTopicSlug}`}
              className="mt-6 inline-flex rounded-full border border-emerald-300 bg-emerald-200/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-900"
            >
              Next Lesson
            </Link>
          ) : null}
        </section>
      ) : null}

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
