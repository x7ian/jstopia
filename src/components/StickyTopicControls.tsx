'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { scrollToId } from '@/lib/scroll'
import { scrollToAnchor } from '@/lib/docs/scrollToAnchor'
import { TopicHUD } from '@/components/game/TopicHUD'
import { cn } from '@/lib/utils'

type StickyTopicControlsProps = {
  progressText?: string
  showViewModeToggle?: boolean
  viewMode?: 'coverage' | 'scroll'
  onViewModeChange?: (mode: 'coverage' | 'scroll') => void
  sections?: { anchor: string; title?: string | null }[]
  showMenu?: boolean
  onToggleMenu?: () => void
  onSelectSection?: (anchor: string) => void
  activeAnchorOverride?: string | null
  completedAnchors?: Set<string>
  hud?: {
    masteryHalfSteps: number
    correctCount: number
    wrongCount: number
    streak?: number
    microStreak?: number
    quizStreak?: number
    shieldCount?: number
    hintTokens?: number
    quizIndex: number
    quizTotal: number
    totalScore: number
    topicScore: number
    lastDelta?: number
  }
  showProgress?: boolean
  side?: 'left' | 'right'
  showBackToJourney?: boolean
  fixed?: boolean
  headerTitle?: {
    bookTitle: string
    chapterTitle: string
    topicTitle: string
    storyIntro?: string | null
  }
}

export function StickyTopicControls({
  sections = [],
  showMenu = true,
  onToggleMenu,
  onSelectSection,
  activeAnchorOverride,
  completedAnchors,
  hud,
  showProgress = true,
  side = 'right',
  showBackToJourney = false,
  fixed = true,
  headerTitle,
  showViewModeToggle = false,
  viewMode,
  onViewModeChange,
}: StickyTopicControlsProps) {
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null)
  const anchorList = useMemo(() => sections.map((section) => section.anchor), [sections])

  useEffect(() => {
    if (anchorList.length === 0) return
    if (activeAnchorOverride) {
      setActiveAnchor(activeAnchorOverride)
      return
    }
    const offset = 160

    const handleScroll = () => {
      let current = anchorList[0] ?? null
      for (const anchor of anchorList) {
        const el = document.getElementById(anchor)
        if (!el) continue
        if (el.getBoundingClientRect().top <= offset) {
          current = anchor
        }
      }
      setActiveAnchor(current)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [anchorList, activeAnchorOverride])

  return (
    <div
      className={cn(
        fixed
          ? 'fixed top-20 z-30 hidden w-72 flex-col gap-0 lg:flex'
          : 'hidden w-full flex-col gap-0 lg:flex',
        fixed && (side === 'right' ? 'right-0 pr-6' : 'left-0 pl-6')
      )}
    >
      {showBackToJourney ? (
        <Link
          href="/journey"
          className="inline-flex items-center gap-2 btn-secondary px-5 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em]"
        >
          <span aria-hidden>←</span>
          Back to Journey
        </Link>
      ) : null}

      {headerTitle ? (
        <div className="glass-strong w-full p-2 text-sm text-[color:var(--text)]">
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[color:var(--muted)]">
            {headerTitle.bookTitle} • {headerTitle.chapterTitle}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-[color:var(--text)]">
            {headerTitle.topicTitle}
          </h1>
          {headerTitle.storyIntro ? (
            <p className="mt-1 text-sm text-[color:var(--muted)]">{headerTitle.storyIntro}</p>
          ) : null}
        </div>
      ) : null}

      {showProgress ? (
        <div className="glass-strong w-full p-2 text-xs text-[color:var(--text)]">
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[color:var(--muted)]">Progress</p>
          {hud ? (
            <div className="mt-1">
              <TopicHUD {...hud} />
            </div>
          ) : (
            <p className="mt-1 font-semibold text-slate-900">{progressText ?? 'Read 0% • Quiz 0/0'}</p>
          )}
        </div>
      ) : null}

      {showViewModeToggle ? (
        <div className="glass w-full p-2 text-sm text-[color:var(--text)]">
          <div className="flex overflow-hidden border border-[color:var(--border)] bg-[color:var(--panel)] text-xs font-semibold uppercase tracking-[0.3em]">
            <button
              type="button"
              onClick={() => onViewModeChange?.('coverage')}
              className={cn(
                'flex-1 px-4 py-2 transition',
                viewMode === 'coverage'
                  ? 'bg-[color:var(--accent)] text-slate-900'
                  : 'text-[color:var(--muted)]'
              )}
            >
              Coverage
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange?.('scroll')}
              className={cn(
                'flex-1 px-4 py-2 transition',
                viewMode === 'scroll'
                  ? 'bg-[color:var(--accent2)] text-slate-900'
                  : 'text-[color:var(--muted)]'
              )}
            >
              Scrollbook
            </button>
          </div>
        </div>
      ) : null}

      <div className="glass w-full p-2 text-sm text-[color:var(--text)]">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Sections</p>
        </div>
        <div className="mt-2 max-h-[46vh] space-y-2 overflow-auto pr-1">
          {sections.length > 0 ? (
            sections.map((block) => (
              <button
                key={block.anchor}
                type="button"
                onClick={() => (onSelectSection ? onSelectSection(block.anchor) : scrollToAnchor(block.anchor))}
                className={cn(
                  'flex w-full items-center justify-between gap-3 whitespace-normal break-words border border-transparent px-3 py-2 text-left text-sm text-[color:var(--text)] transition hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--panel-strong)]',
                  activeAnchor === block.anchor &&
                    'border-[color:var(--accent)]/60 bg-[color:var(--panel-strong)] text-[color:var(--text)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_35%,transparent)]'
                )}
              >
                <span>{block.title ?? block.anchor}</span>
                {completedAnchors?.has(block.anchor) ? (
                  <span className="bg-emerald-400/20 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-emerald-200">
                    ✓
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <p className="text-xs text-[color:var(--muted)]">No sections yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
