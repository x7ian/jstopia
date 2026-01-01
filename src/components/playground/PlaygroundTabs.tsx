'use client'

import { cn } from '@/lib/utils'

type PlaygroundTabsProps = {
  files: { name: string }[]
  activeFile: string
  onSelect: (name: string) => void
}

export function PlaygroundTabs({ files, activeFile, onSelect }: PlaygroundTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {files.map((file) => (
        <button
          key={file.name}
          type="button"
          onClick={() => onSelect(file.name)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] transition',
            activeFile === file.name
              ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-100'
              : 'border-white/10 text-slate-300 hover:border-white/30'
          )}
        >
          {file.name}
        </button>
      ))}
    </div>
  )
}
