'use client'

import { useEffect, useMemo, useState } from 'react'
import { scrollToId } from '@/lib/scroll'
import { scrollToAnchor } from '@/lib/docs/scrollToAnchor'
import { TopicHUD } from '@/components/game/TopicHUD'
import { cn } from '@/lib/utils'

type StickyTopicControlsProps = {
  mode: 'learn' | 'challenge'
  onModeChange?: (mode: 'learn' | 'challenge') => void
  progressText?: string
  sections?: { anchor: string; title?: string | null }[]
  showMenu?: boolean
  onToggleMenu?: () => void
  hud?: {
    masteryHalfSteps: number
    correctCount: number
    wrongCount: number
    streak: number
    quizIndex: number
    quizTotal: number
    totalScore: number
    topicScore: number
    lastDelta?: number
  }
  showProgress?: boolean
}

export function StickyTopicControls({
  mode,
  onModeChange,
  sections = [],
  showMenu = true,
  onToggleMenu,
  hud,
  showProgress = true,
}: StickyTopicControlsProps) {
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null)
  const anchorList = useMemo(
    () => [...sections.map((section) => section.anchor), 'quiz'],
    [sections]
  )

  useEffect(() => {
    if (anchorList.length === 0) return
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
  }, [anchorList])

  function handleMode(next: 'learn' | 'challenge') {
    onModeChange?.(next)
  }

  return (
    <div className="fixed right-0 top-20 z-30 hidden w-72 flex-col gap-3 pr-6 lg:flex">
      {showProgress ? (
        <div className="glass-strong w-full p-3 text-xs text-[color:var(--text)]">
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-[color:var(--muted)]">Progress</p>
          {hud ? (
            <div className="mt-3">
              <TopicHUD {...hud} />
            </div>
          ) : (
            <p className="mt-1 font-semibold text-slate-900">{progressText ?? 'Read 0% • Quiz 0/0'}</p>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => scrollToId('quiz')}
        className="w-full rounded-full btn-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
      >
        Jump to Quiz
      </button>

      <div className="flex w-full overflow-hidden rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] text-xs font-semibold uppercase tracking-[0.3em]">
        <button
          type="button"
          onClick={() => handleMode('learn')}
          className={cn(
            'flex-1 px-4 py-2 transition',
            mode === 'learn' ? 'bg-sky-200 text-sky-900' : 'text-slate-500'
          )}
        >
          Learn
        </button>
        <button
          type="button"
          onClick={() => handleMode('challenge')}
          className={cn(
            'flex-1 px-4 py-2 transition',
            mode === 'challenge' ? 'bg-amber-200 text-amber-900' : 'text-slate-500'
          )}
        >
          Challenge
        </button>
      </div>

      <div className="glass w-full rounded-3xl p-3 text-sm text-[color:var(--text)]">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Sections</p>
          <button
            type="button"
            onClick={onToggleMenu}
            className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-[color:var(--text)]"
          >
            {showMenu ? 'Hide' : 'Show'}
          </button>
        </div>
        {showMenu ? (
          <div className="mt-3 max-h-[46vh] space-y-2 overflow-auto pr-1">
            {sections.length > 0 ? (
              sections.map((block) => (
                <button
                  key={block.anchor}
                  type="button"
                  onClick={() => scrollToAnchor(block.anchor)}
                  className={cn(
                    'block w-full whitespace-normal break-words rounded-xl border border-transparent px-3 py-2 text-left text-sm text-[color:var(--text)] transition hover:border-[color:var(--accent)]/50 hover:bg-[color:var(--panel-strong)]',
                    activeAnchor === block.anchor &&
                      'border-[color:var(--accent)]/60 bg-[color:var(--panel-strong)] text-[color:var(--text)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_35%,transparent)]'
                  )}
                >
                  {block.title ?? block.anchor}
                </button>
              ))
            ) : (
              <p className="text-xs text-[color:var(--muted)]">No sections yet.</p>
            )}
            <button
              type="button"
              onClick={() => scrollToId('quiz')}
              className={cn(
                'block w-full rounded-xl btn-primary px-3 py-2 text-left text-sm font-semibold',
                activeAnchor === 'quiz' &&
                  'shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent)_45%,transparent)]'
              )}
            >
              Jump to Quiz
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
