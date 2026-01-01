import { CheckCircle2 } from 'lucide-react'

type ChecklistProps = {
  items: string[]
}

export function Checklist({ items }: ChecklistProps) {
  return (
    <div className="not-prose rounded-2xl border border-sky-200/70 bg-white/80 p-4 shadow-sm">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-3 text-sm text-slate-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
