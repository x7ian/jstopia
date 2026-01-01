export type Difficulty = 'basic' | 'medium' | 'advanced'
export type HelpUsed = 'none' | 'tip' | 'doc'

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
