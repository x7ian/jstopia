import { cn } from '@/lib/utils'

type MasteryMeterProps = {
  valueHalfSteps: number
  maxHalfSteps?: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function MasteryMeter({ valueHalfSteps, maxHalfSteps = 10 }: MasteryMeterProps) {
  const clamped = clamp(valueHalfSteps, 0, maxHalfSteps)
  const segments = Math.ceil(maxHalfSteps / 2)
  const mastery = clamped / 2
  const masteryText = `${mastery.toFixed(mastery % 1 === 0 ? 0 : 1)}/${segments} PIPS`

  return (
    <div className="flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.3em] text-[color:var(--muted)]">
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: segments }).map((_, index) => {
          const segmentValue = clamp(clamped - index * 2, 0, 2)
          const fillClass =
            segmentValue === 2
              ? 'w-full'
              : segmentValue === 1
                ? 'w-1/2'
                : 'w-0'
          return (
            <div
              key={`segment-${index}`}
              className="relative h-2 flex-1 overflow-hidden rounded-full border border-[color:var(--border)] bg-[color:var(--panel)]"
            >
              <div
                className={cn(
                  'absolute left-0 top-0 h-full rounded-full bg-[color:var(--accent)] transition-all',
                  fillClass
                )}
              />
            </div>
          )
        })}
      </div>
      <span className="shrink-0 text-right text-[color:var(--text)]">{masteryText}</span>
    </div>
  )
}
