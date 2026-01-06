'use client'

import { cn } from '@/lib/utils'
import type { PlaygroundConsoleMessage } from '@/components/playground/iframeBridge'

type PlaygroundConsoleProps = {
  logs: PlaygroundConsoleMessage[]
  errors: string[]
}

export function PlaygroundConsole({ logs, errors }: PlaygroundConsoleProps) {
  return (
    <div className="flex h-full flex-col border border-white/10 bg-black/40 p-4 text-xs text-slate-200">
      <div className="flex items-center justify-between">
        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">Console</p>
      </div>
      <div className="mt-3 flex-1 space-y-2 overflow-auto font-mono text-[0.7rem]">
        {logs.length === 0 && errors.length === 0 ? (
          <p className="text-slate-400">No output yet. Run the code to see logs.</p>
        ) : null}
        {logs.map((entry, index) => (
          <p
            key={`${entry.type}-${index}`}
            className={cn(
              entry.type === 'error' && 'text-rose-300',
              entry.type === 'warn' && 'text-amber-300',
              entry.type === 'info' && 'text-sky-300',
              entry.type === 'log' && 'text-slate-200'
            )}
          >
            {entry.message}
          </p>
        ))}
        {errors.map((entry, index) => (
          <p key={`err-${index}`} className="text-rose-300">
            {entry}
          </p>
        ))}
      </div>
    </div>
  )
}
