import { MasteryMeter } from '@/components/game/MasteryMeter'
import { RankGemBadge } from '@/components/ranks/RankGemBadge'

type TopicHUDProps = {
  masteryHalfSteps: number
  correctCount: number
  wrongCount: number
  streak: number
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
  streak,
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
      <div className="flex flex-wrap items-center text-xs text-[color:var(--text)]">
        <span className="uppercase tracking-[0.3em] text-[color:var(--muted)]">Correct</span>
        <span className="ml-2 font-semibold text-emerald-400">{correctCount}</span>
        <span className="mx-3 text-[color:var(--muted)]">|</span>
        <span className="uppercase tracking-[0.3em] text-[color:var(--muted)]">Wrong</span>
        <span className="ml-2 font-semibold text-rose-400">{wrongCount}</span>
        <span className="mx-3 text-[color:var(--muted)]">|</span>
        <span className="uppercase tracking-[0.3em] text-[color:var(--muted)]">Streak</span>
        <span className="ml-2 font-semibold text-amber-400">{streak}</span>
        <span className="mx-3 text-[color:var(--muted)]">|</span>
        <span className="uppercase tracking-[0.3em] text-[color:var(--muted)]">Quiz</span>
        <span className="ml-2 font-semibold text-[color:var(--text)]">
          {quizIndex}/{quizTotal}
        </span>
        <span className="mx-3 text-[color:var(--muted)]">|</span>
        <span className="uppercase tracking-[0.3em] text-[color:var(--muted)]">XP</span>
        <span className="ml-2 font-semibold text-[color:var(--text)]">
          Total {totalScore} · Lesson {topicScore}
        </span>
        <span className="mx-3 text-[color:var(--muted)]">|</span>
        <div className="flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-2 py-0.5">
          <RankGemBadge rankSlug={rankSlug ?? 'unranked'} size="sm" />
          <span className="uppercase tracking-[0.3em] text-[color:var(--text)]">
            Rank: {rankTitle ?? 'Unranked'}
          </span>
        </div>
        {lastDelta ? (
          <>
            <span className="mx-3 text-[color:var(--muted)]">|</span>
            <span className="font-semibold text-emerald-400">+{lastDelta} XP</span>
          </>
        ) : null}
      </div>
    </div>
  )
}
