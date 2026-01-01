'use client'

const SEGMENT_COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#6366f1', '#8b5cf6']

export function ProgressPips({ value, target = 5 }: { value: number; target?: number }) {
  const clamped = Math.max(-target, Math.min(target, value))
  const positive = Math.max(0, clamped)
  const negative = Math.abs(Math.min(0, clamped))
  const positiveFull = Math.floor(positive)
  const positivePartial = positive - positiveFull
  const negativeFull = Math.floor(negative)
  const negativePartial = negative - negativeFull

  return (
    <div className="flex w-full items-center gap-3">
      <div className="flex flex-1 items-center gap-1">
        {Array.from({ length: target }).map((_, idx) => {
          const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length]
          const isFull = idx < positiveFull
          const isHalf = idx === positiveFull && positivePartial >= 0.5
          return (
            <span
              key={`pos-${idx}`}
              className={`h-2.5 flex-1 rounded-full transition-all duration-200 ${
                isFull || isHalf ? 'opacity-100 shadow-[0_6px_18px_rgba(96,165,250,0.35)]' : 'opacity-25'
              }`}
              style={{
                background: isHalf ? `linear-gradient(90deg, ${color} 50%, transparent 50%)` : color,
              }}
            />
          )
        })}
      </div>
      {negative > 0 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: negativeFull }).map((_, idx) => (
            <span
              key={`neg-${idx}`}
              className="h-2.5 w-4 rounded-full bg-rose-500/70 shadow-[0_0_12px_rgba(248,113,113,0.5)]"
            />
          ))}
          {negativePartial >= 0.5 && (
            <span
              key="neg-half"
              className="h-2.5 w-4 rounded-full shadow-[0_0_12px_rgba(248,113,113,0.5)]"
              style={{ background: 'linear-gradient(90deg, rgba(244,63,94,0.7) 50%, transparent 50%)' }}
            />
          )}
        </div>
      )}
    </div>
  )
}
