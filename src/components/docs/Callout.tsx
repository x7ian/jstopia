import { AlertTriangle, Bug, FlaskConical, Info, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

type CalloutKind = 'tip' | 'warning' | 'example' | 'gotcha' | 'note'

type CalloutProps = {
  kind: CalloutKind
  title?: string
  children: React.ReactNode
}

const styles: Record<CalloutKind, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  tip: {
    icon: Lightbulb,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  example: {
    icon: FlaskConical,
    className: 'border-sky-200 bg-sky-50 text-sky-900',
  },
  gotcha: {
    icon: Bug,
    className: 'border-rose-200 bg-rose-50 text-rose-900',
  },
  note: {
    icon: Info,
    className: 'border-slate-200 bg-white text-slate-800',
  },
}

export function Callout({ kind, title, children }: CalloutProps) {
  const config = styles[kind]
  const Icon = config.icon

  return (
    <div className={cn('not-prose rounded-2xl border px-4 py-3 shadow-sm', config.className)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5" />
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-600">
            {title ?? kind}
          </p>
          <div className="text-sm text-slate-700">{children}</div>
        </div>
      </div>
    </div>
  )
}
