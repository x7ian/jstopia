'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { lessonStatusStyles, type LessonStatus } from '@/lib/ui/statusStyles'

export type JourneyTopic = {
  id: number
  slug: string
  title: string
  order: number
  storyIntro?: string | null
  state: 'locked' | 'unlocked' | 'completed'
  progress: { status: string; score: number }
}

export type JourneyChapter = {
  id: number
  slug: string
  title: string
  order: number
  storyIntro?: string | null
  theme?: any
  state: 'locked' | 'unlocked' | 'completed'
  topics: JourneyTopic[]
}

export type JourneyBook = {
  id: number
  slug: string
  title: string
  order: number
  storyIntro?: string | null
  theme?: any
  state: 'locked' | 'unlocked' | 'completed'
  chapters: JourneyChapter[]
}

type JourneyTreeProps = {
  books: JourneyBook[]
  onSelectTopic: (slug: string) => void
}

export function JourneyTree({ books, onSelectTopic }: JourneyTreeProps) {
  const [openBookId, setOpenBookId] = useState<number | null>(null)
  const [openChapterId, setOpenChapterId] = useState<number | null>(null)

  useEffect(() => {
    const firstOpenBook = books.find((book) => book.state !== 'locked') ?? books[0]
    setOpenBookId(firstOpenBook?.id ?? null)

    const firstChapter = firstOpenBook?.chapters.find((chapter) => chapter.state !== 'locked')
    setOpenChapterId(firstChapter?.id ?? null)
  }, [books])

  return (
    <div className="space-y-6">
      {books.map((book) => (
        <div
          key={book.id}
          className={cn(
            'glass rounded-3xl p-6 text-[color:var(--text)]',
            'border border-cyan-500/15 bg-gradient-to-b from-cyan-500/10 via-slate-950/40 to-slate-950/30 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]',
            book.state === 'locked' && 'opacity-60'
          )}
        >
          <button
            type="button"
            onClick={() => {
              setOpenBookId((prev) => {
                const next = prev === book.id ? null : book.id
                if (next) {
                  const firstChapter = book.chapters.find((chapter) => chapter.state !== 'locked')
                  setOpenChapterId(firstChapter?.id ?? null)
                }
                return next
              })
            }}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Book {book.order}</p>
              <h2 className="text-2xl font-semibold text-[color:var(--text)]">{book.title}</h2>
              {book.storyIntro ? <p className="mt-2 text-sm text-[color:var(--muted)]">{book.storyIntro}</p> : null}
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              {book.state === 'locked' ? 'Locked' : openBookId === book.id ? 'Collapse' : 'Expand'}
            </span>
          </button>

          {openBookId === book.id ? (
            <div className="mt-6 space-y-4">
              {book.chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className={cn(
                    'glass rounded-2xl border border-violet-500/15 bg-gradient-to-b from-violet-500/10 via-slate-950/30 to-slate-950/20 p-4',
                    chapter.state === 'locked' && 'opacity-70'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenChapterId((prev) => (prev === chapter.id ? null : chapter.id))}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Chapter {chapter.order}</p>
                      <h3 className="text-lg font-semibold text-[color:var(--text)]">{chapter.title}</h3>
                      {chapter.storyIntro ? (
                        <p className="mt-1 text-sm text-[color:var(--muted)]">{chapter.storyIntro}</p>
                      ) : null}
                    </div>
                    <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                      {chapter.state === 'locked' ? 'Locked' : openChapterId === chapter.id ? 'Collapse' : 'Expand'}
                    </span>
                  </button>

                  {openChapterId === chapter.id ? (
                    <div className="mt-4 space-y-2">
                      {chapter.topics.map((topic) => {
                        const status = topic.state as LessonStatus
                        const styles = lessonStatusStyles[status]
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            disabled={status === 'locked'}
                            aria-disabled={status === 'locked'}
                            onClick={() => onSelectTopic(topic.slug)}
                            className={cn(
                              'relative flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition glass',
                              styles.border,
                              status === 'locked' ? 'cursor-not-allowed' : 'hover:bg-white/5'
                            )}
                          >
                            <span
                              className={cn(
                                'absolute left-0 top-0 h-full w-1 rounded-l-xl',
                                status === 'locked'
                                  ? 'bg-slate-700/50'
                                  : status === 'unlocked'
                                    ? 'bg-cyan-400/60'
                                    : 'bg-emerald-400/60'
                              )}
                              aria-hidden="true"
                            />
                            <div className={cn('pl-3', styles.text)}>
                              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Lesson {topic.order}</p>
                              <p className="text-base font-semibold text-[color:var(--text)]">{topic.title}</p>
                              {topic.storyIntro ? (
                                <p className="mt-1 text-xs text-[color:var(--muted)]">{topic.storyIntro}</p>
                              ) : null}
                            </div>
                            <div className="flex flex-col items-end gap-2 text-xs uppercase tracking-[0.25em]">
                              <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1', styles.pill)}>
                                <span className={cn('text-[0.65rem]', styles.icon)} aria-hidden="true">
                                  ●
                                </span>
                                {status === 'completed' ? 'Completed' : status === 'unlocked' ? 'Available' : 'Locked'}
                              </span>
                              <span className={cn('text-[0.65rem]', styles.action)}>
                                {status === 'completed' ? 'Review' : status === 'unlocked' ? 'Start Lesson' : 'Locked'}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
