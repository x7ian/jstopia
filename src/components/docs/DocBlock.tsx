import { Link } from 'lucide-react'
import { cn } from '@/lib/utils'

type DocBlockProps = {
  anchor: string
  kind?: string
  title?: string
  children: React.ReactNode
}

export function DocBlock({ anchor, kind, title, children }: DocBlockProps) {
  return (
    <section
      id={anchor}
      data-anchor={anchor}
      className={cn(
        'scroll-mt-24 rounded-3xl border border-[color:var(--border)] bg-[color:var(--panel)] p-6 transition-all shadow-sm md:p-7'
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {kind ? (
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">{kind}</p>
          ) : null}
          {title ? <h3 className="mt-2 text-xl font-semibold text-[color:var(--text)]">{title}</h3> : null}
        </div>
        <a
          href={`#${anchor}`}
          className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--panel-strong)] px-2 py-1 text-xs uppercase tracking-[0.3em] text-[color:var(--text)] hover:text-[color:var(--accent)]"
        >
          <Link className="h-3.5 w-3.5" />
          Link
        </a>
      </div>
      <div className="prose prose-invert prose-lg max-w-none prose-headings:tracking-tight prose-h1:text-3xl prose-h1:mt-0 prose-h2:text-2xl prose-h2:mt-10 prose-h3:text-xl prose-p:leading-8 prose-a:text-[color:var(--accent)] prose-strong:text-white prose-code:text-[0.95em] prose-pre:rounded-xl prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:p-4 md:prose-pre:p-5">
        {children}
      </div>
    </section>
  )
}
