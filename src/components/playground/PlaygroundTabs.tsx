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
            'px-2 py-1 text-xs font-semibold tracking-[0.2em] transition',
            activeFile === file.name
              ? 'bg-cyan-400/15 text-cyan-100'
              : 'text-slate-300 hover:text-slate-100'
          )}
        >
          {file.name.toLowerCase()}
        </button>
      ))}
    </div>
  )
}
