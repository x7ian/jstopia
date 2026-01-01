'use client'

import { cn } from '@/lib/utils'

type Doc = { id?: string; title: string; url: string }
type DocBlock = { id: string; anchor: string; type?: string | null; title?: string | null; contentMd: string }
type DocPage = {
  id: string
  title: string
  mdxPath?: string | null
  contentMd?: string | null
  answerAnchor?: string | null
  blocks: DocBlock[]
}

type DocsDrawerProps = {
  docs?: Doc[]
  explanation?: string
  disabled?: boolean
  open?: boolean
  onToggle?: () => void
}

type DocsSidebarProps = {
  docs?: Doc[]
  explanation?: string
  tip?: string | null
  doc?: DocPage | null
  mode?: 'tip' | 'doc'
  open: boolean
  onClose?: () => void
  className?: string
}

function getDocsContent(explanation?: string) {
  return explanation && explanation.trim().length > 0
    ? explanation.trim().split('\n').filter(Boolean)
    : ['Answer the question to reveal the full rationale.']
}

function renderInline(text: string) {
  const parts = text.split(/`([^`]+)`/g)
  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <code
        key={`code-${idx}`}
        className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-xs text-sky-200"
      >
        {part}
      </code>
    ) : (
      <span key={`text-${idx}`}>{part}</span>
    )
  )
}

function renderParagraphs(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, idx) => (
      <p key={`${idx}-${line.slice(0, 12)}`} className="text-slate-200/90">
        {renderInline(line)}
      </p>
    ))
}

export function DocsDrawer({ docs, explanation, disabled, open = false, onToggle }: DocsDrawerProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-expanded={open}
      aria-controls="docs-sidebar"
      onClick={() => onToggle?.()}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-lg font-semibold text-white transition hover:border-sky-300/70 hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 disabled:cursor-not-allowed disabled:opacity-50'
      )}
    >
      ?
    </button>
  )
}

export function DocsSidebar({
  docs,
  explanation,
  tip,
  doc,
  mode = 'tip',
  open,
  onClose,
  className,
}: DocsSidebarProps) {
  const list = docs ?? []
  const content = getDocsContent(explanation)
  const activeAnchor = doc?.answerAnchor ?? null

  return (
    <aside
      id="docs-sidebar"
      aria-hidden={!open}
      className={cn(
        'w-full overflow-hidden rounded-3xl border border-slate-700/40 bg-slate-950/95 text-slate-50 shadow-[0_20px_50px_rgba(15,23,42,0.45)] backdrop-blur transition-all duration-300 ease-out lg:rounded-l-3xl lg:rounded-r-none',
        open
          ? 'max-h-[1200px] p-6 opacity-100 translate-x-0 lg:max-h-none lg:w-[420px] lg:max-w-[420px]'
          : 'pointer-events-none max-h-0 p-0 opacity-0 translate-x-6 lg:w-0 lg:max-w-0',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-50">{mode === 'doc' ? 'Chapter Notes' : 'Quick Tip'}</h3>
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

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-200">
        {mode === 'tip' ? (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            {tip ? renderParagraphs(tip) : <p className="text-slate-200/90">No tip available yet.</p>}
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400/80">Tap ? again for full chapter</p>
          </div>
        ) : doc ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h4 className="text-sm font-semibold text-slate-100">{doc.title}</h4>
              {doc.contentMd ? renderParagraphs(doc.contentMd) : null}
            </div>
            <div className="space-y-2">
              {doc.blocks.map((block) => {
                const isAnswer = activeAnchor && block.anchor === activeAnchor
                return (
                  <div
                    key={block.id}
                    className={cn(
                      'space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4',
                      isAnswer && 'border-sky-400/60 bg-sky-500/10 shadow-[0_0_18px_rgba(56,189,248,0.25)]'
                    )}
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400/80">
                      <span>{block.title ?? 'Concept'}</span>
                      {isAnswer ? <span className="text-sky-200">Answer inside</span> : null}
                    </div>
                    {renderParagraphs(block.contentMd)}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-slate-200/90">No chapter content linked yet.</p>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400/80">Docs & Links</h4>
          {list.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400/70">
              No reference material yet. Beat the round to unlock more insights.
            </p>
          ) : (
            <ul className="space-y-2">
              {list.map((doc) => (
                <li key={doc.id ?? doc.url}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-xl border border-transparent bg-white/5 px-4 py-3 text-slate-200 transition hover:border-sky-300/50 hover:bg-white/10"
                  >
                    <span>{doc.title}</span>
                    <span aria-hidden className="text-sm text-slate-400 transition group-hover:text-sky-200">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {explanation ? (
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            {content.map((line, idx) => (
              <p key={idx} className="text-slate-200/90">
                {line}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  )
}
