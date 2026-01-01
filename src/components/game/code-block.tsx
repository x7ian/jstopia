type CodeBlockProps = {
  code: string
  language?: string
}

export function CodeBlock({ code, language = 'js' }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-[0_24px_60px_rgba(15,23,42,0.45)]">
      <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/70 px-4 py-2 text-xs uppercase tracking-widest text-slate-400/80">
        <span>{language}</span>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-300/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
        </div>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-slate-100/90">
        <code className="whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}
