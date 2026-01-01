export type LessonStatus = 'locked' | 'unlocked' | 'completed'

export const lessonStatusStyles: Record<
  LessonStatus,
  {
    pill: string
    border: string
    text: string
    action: string
    icon: string
  }
> = {
  locked: {
    pill: 'bg-slate-800/70 text-slate-300 ring-1 ring-slate-700/60',
    border: 'border-slate-800/80',
    text: 'text-slate-400',
    action: 'text-slate-400 cursor-not-allowed',
    icon: 'text-slate-500',
  },
  unlocked: {
    pill: 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/25',
    border: 'border-cyan-500/20 hover:border-cyan-400/35',
    text: 'text-slate-200',
    action: 'text-cyan-200 hover:text-cyan-100',
    icon: 'text-cyan-300',
  },
  completed: {
    pill: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/25',
    border: 'border-emerald-500/20 hover:border-emerald-400/35',
    text: 'text-slate-200',
    action: 'text-emerald-200 hover:text-emerald-100',
    icon: 'text-emerald-300',
  },
}
