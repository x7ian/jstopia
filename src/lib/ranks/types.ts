export type RankProgressRequirement = {
  requiredTopicSlugs?: string[]
  requiredChapterSlugs?: string[]
  requiredCompletedTopicsCountInChapter?: { chapterSlug: string; count: number }[]
}

export type BossExamRule = {
  questionCount: number
  allowedTipCount: number
  allowedDocRevealCount: number
  masteryMinHalfSteps: number
  difficultyMix?: { basic: number; medium: number; advanced: number }
  phases?: 'boss'
}

export type RankDefinition = {
  slug: string
  level?: number
  title: string
  description: string
  gemPath?: string
  accent?: string
  xpMin: number
  progressReq?: RankProgressRequirement
  bossExam?: BossExamRule | null
  lockedByContent?: boolean
}
