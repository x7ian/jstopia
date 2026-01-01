import { CodeCopyButton } from '@/components/docs/CodeCopyButton'
import { highlightCode } from '@/lib/docs/shiki'

type CodeBlockProps = {
  code: string
  language?: string
}

export async function CodeBlock({ code, language }: CodeBlockProps) {
  const { html, language: resolved } = await highlightCode(code, language)

  return (
    <div className="not-prose overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 shadow-[0_20px_40px_rgba(15,23,42,0.45)]">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2 text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">
        <span>{resolved}</span>
        <CodeCopyButton code={code} />
      </div>
      <div className="overflow-auto px-4 py-3 text-sm text-slate-100" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
