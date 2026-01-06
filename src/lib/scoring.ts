export type Difficulty = 'basic' | 'medium' | 'advanced'
export type HelpUsed = 'none' | 'tip' | 'doc'
export type QuestionPhase = 'micro' | 'quiz' | 'boss' | 'sample'

const baseScoreByDifficulty: Record<Difficulty, number> = {
  basic: 100,
  medium: 180,
  advanced: 280,
}

const helpMultiplier: Record<HelpUsed, number> = {
  none: 1,
  tip: 0.75,
  doc: 0.4,
}

export function scoreAnswer(difficulty: Difficulty, helpUsed: HelpUsed) {
  const base = baseScoreByDifficulty[difficulty] ?? 100
  const multiplier = helpMultiplier[helpUsed] ?? 1
  return Math.round(base * multiplier)
}

const microScore: Record<HelpUsed, number> = {
  none: 10,
  tip: 7,
  doc: 4,
}

const quizScore: Record<HelpUsed, number> = {
  none: 25,
  tip: 15,
  doc: 8,
}

export function computeScoreAwarded(params: {
  phase: QuestionPhase
  correct: boolean
  helpUsed: HelpUsed
}) {
  if (!params.correct) return 0
  if (params.phase === 'sample') return 0
  const table = params.phase === 'micro' ? microScore : quizScore
  return table[params.helpUsed] ?? 0
}
