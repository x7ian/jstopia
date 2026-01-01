'use client'

import { useEffect, useMemo, useRef } from 'react'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { cn } from '@/lib/utils'
import { Callout } from '@/components/docs/Callout'
import { Checklist } from '@/components/docs/Checklist'
import { DocBlock } from '@/components/docs/DocBlock'
import { MiniChallenge } from '@/components/docs/MiniChallenge'
import { Playground } from '@/components/playground/Playground'

export type DocBlockMeta = {
  id: number
  anchor: string
  title?: string | null
  kind?: string | null
  order: number
  excerpt?: string | null
}

export type DocPagePayload = {
  page: {
    slug: string
    title: string
    mdxPath: string
    objectives?: any
    estimatedMinutes?: number | null
  }
  blocks: DocBlockMeta[]
  mdxSource: MDXRemoteSerializeResult
  answerAnchor?: string | null
}

type DocDrawerProps = {
  open: boolean
  mode: 'tip' | 'doc'
  tip?: string | null
  doc?: DocPagePayload | null
  error?: string | null
  onClose?: () => void
}

export function DocDrawer({ open, mode, tip, doc, error, onClose }: DocDrawerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const highlightAnchor = doc?.answerAnchor ?? null

  useEffect(() => {
    if (!open || mode !== 'doc' || !highlightAnchor) return
    const container = containerRef.current
    if (!container) return

    const el = container.querySelector(`#${CSS.escape(highlightAnchor)}`) as HTMLElement | null
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ring-2', 'ring-emerald-400/70', 'bg-emerald-400/10')

    const timeout = setTimeout(() => {
      el.classList.remove('ring-2', 'ring-emerald-400/70', 'bg-emerald-400/10')
    }, 2400)

    return () => clearTimeout(timeout)
  }, [open, mode, highlightAnchor, doc?.page.slug])

  const tipLines = useMemo(() => (tip ?? '').split('\n').map((line) => line.trim()).filter(Boolean), [tip])

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-20 transition-all duration-300 ease-out',
        open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      )}
    >
      {mode === 'doc' ? (
        <div className={cn('absolute inset-0 bg-slate-950/70', open ? 'opacity-100' : 'opacity-0')} />
      ) : null}
      <div
        className={cn(
          'pointer-events-auto mx-auto overflow-hidden rounded-3xl border border-slate-700/40 bg-slate-950/95 text-slate-50 shadow-[0_20px_50px_rgba(15,23,42,0.45)] backdrop-blur',
          mode === 'doc'
            ? 'h-full w-full'
            : 'mt-4 w-full max-w-xl'
        )}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-50">
                {mode === 'doc' ? doc?.page.title ?? 'Chapter Notes' : 'Quick Tip'}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {mode === 'doc'
                  ? 'Full chapter context for this question, with the answer highlighted.'
                  : 'A light hint to nudge you without revealing the full answer.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200/80 transition hover:border-sky-300/60 hover:text-sky-200"
            >
              Close
            </button>
          </div>
        </div>

        <div ref={containerRef} className={cn(
          'space-y-6 text-sm leading-relaxed text-slate-200',
          mode === 'doc' ? 'h-[calc(100%-84px)] overflow-y-auto px-6 pb-6' : 'px-6 pb-6'
        )}>
        {mode === 'tip' ? (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            {tipLines.length > 0 ? (
              tipLines.map((line, idx) => (
                <p key={`${line.slice(0, 12)}-${idx}`} className="text-slate-200/90">
                  {line}
                </p>
              ))
            ) : (
              <p className="text-slate-200/90">No tip available yet.</p>
            )}
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400/80">Tap ? again for full chapter</p>
          </div>
        ) : doc ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <MDXRemote
                {...doc.mdxSource}
                components={{
                  Callout,
                  Checklist,
                  DocBlock,
                  MiniChallenge,
                  Playground,
                }}
              />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400/80">Doc Blocks</h4>
              <div className="grid gap-3">
                {doc.blocks.map((block) => (
                  <div
                    key={block.id}
                    className={cn(
                      'rounded-2xl border border-white/10 bg-white/5 p-4',
                      highlightAnchor === block.anchor && 'border-emerald-400/60 bg-emerald-500/10'
                    )}
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400/80">{block.kind ?? 'Block'}</p>
                    <h5 className="mt-2 text-sm font-semibold text-slate-100">{block.title ?? block.anchor}</h5>
                    {block.excerpt ? <p className="mt-2 text-sm text-slate-300/80">{block.excerpt}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-slate-200/90">
              {error ? `Docs error: ${error}` : 'No chapter content linked yet.'}
            </p>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
