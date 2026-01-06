import { MasteryMeter } from '@/components/game/MasteryMeter'
import { RankGemBadge } from '@/components/ranks/RankGemBadge'

type TopicHUDProps = {
  masteryHalfSteps: number
  correctCount: number
  wrongCount: number
  streak?: number
  microStreak?: number
  quizStreak?: number
  shieldCount?: number
  hintTokens?: number
  quizIndex: number
  quizTotal: number
  totalScore: number
  topicScore: number
  lastDelta?: number
  rankSlug?: string | 'unranked'
  rankTitle?: string
  trialAvailable?: boolean
  trialSlug?: string | null
}

export function TopicHUD({
  masteryHalfSteps,
  correctCount,
  wrongCount,
  streak = 0,
  microStreak,
  quizStreak,
  shieldCount = 0,
  hintTokens = 0,
  quizIndex,
  quizTotal,
  totalScore,
  topicScore,
  lastDelta,
  rankSlug,
  rankTitle,
  trialAvailable,
  trialSlug,
}: TopicHUDProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {trialAvailable && trialSlug ? (
          <a
            href={`/rank-trial/${trialSlug}`}
            className="rounded-full border border-amber-300 bg-amber-200/80 px-3 py-1 font-semibold uppercase tracking-[0.3em] text-amber-900"
          >
            Trial Available
          </a>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <MasteryMeter valueHalfSteps={masteryHalfSteps} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[0.65rem] uppercase tracking-[0.25em] text-[color:var(--muted)]">
        <div className="flex items-center justify-between">
          <span>Correct</span>
          <span className="font-semibold text-emerald-400">{correctCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Wrong</span>
          <span className="font-semibold text-rose-400">{wrongCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Micro Streak</span>
          <span className="font-semibold text-amber-300">{microStreak ?? streak}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Quiz Streak</span>
          <span className="font-semibold text-sky-300">{quizStreak ?? streak}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Quiz</span>
          <span className="font-semibold text-[color:var(--text)]">
            {quizIndex}/{quizTotal}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>XP</span>
          <span className="font-semibold text-[color:var(--text)]">
            {totalScore} · {topicScore}
          </span>
        </div>
        {shieldCount > 0 ? (
          <div className="flex items-center justify-between">
            <span>Shield</span>
            <span className="font-semibold text-sky-300">{shieldCount}</span>
          </div>
        ) : null}
        {hintTokens > 0 ? (
          <div className="flex items-center justify-between">
            <span>Hints</span>
            <span className="font-semibold text-amber-200">{hintTokens}</span>
          </div>
        ) : null}
        {lastDelta ? (
          <div className="flex items-center justify-between">
            <span>+XP</span>
            <span className="font-semibold text-emerald-400">+{lastDelta}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
