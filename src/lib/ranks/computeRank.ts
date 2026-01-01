import { BOOK1_RANKS } from '@/lib/ranks/book1'

type ProgressSnapshot = {
  completedTopicSlugs: Set<string>
  chapterTopicCounts: Map<string, { total: number; completed: number }>
  availableTopicSlugs?: Set<string>
}

type RankResult = {
  rankSlug: string | 'unranked'
  nextRankSlug?: string
  comingSoon?: boolean
}

const CHAPTER1_SLUG = 'data-forest'
const PROLOGUE_TRIAL_SLUG = 'prologue-final-quiz'
const VARIABLES_TOPIC_SLUG = 'variables-let-var'
const CONSTANTS_TOPIC_SLUG = 'constants-const'
const TYPES_TOPIC_SLUG = 'data-types-overview'
const SCOPE_TOPIC_SLUG = 'scope'
const FUNCTIONS_TOPIC_SLUG = 'functions'
const OBJECTS_TOPIC_SLUG = 'objects-complex-type'
const ARRAYS_TOPIC_SLUG = 'arrays'
const DATA_FOREST_TRIAL_SLUG = 'data-forest-trial'
const PROMISES_TOPIC_SLUG = 'promises'
const ASYNC_TOPIC_SLUG = 'async-await'
const BOOK2_CH1_TRIAL_SLUG = 'browser-ship-trial'
const BOOK2_CH2_TRIAL_SLUG = 'programming-browser-trial'
const BOOK2_FINAL_TRIAL_SLUG = 'book2-final-trial'

function chapterCompleted(progress: ProgressSnapshot, chapterSlug: string) {
  const chapter = progress.chapterTopicCounts.get(chapterSlug)
  if (!chapter || chapter.total === 0) return false
  return chapter.completed >= chapter.total
}

function completedTopic(progress: ProgressSnapshot, topicSlug: string) {
  return progress.completedTopicSlugs.has(topicSlug)
}

function topicExists(progress: ProgressSnapshot, topicSlug: string) {
  if (!progress.availableTopicSlugs) return true
  return progress.availableTopicSlugs.has(topicSlug)
}

function completedIfExists(progress: ProgressSnapshot, topicSlug: string) {
  return !topicExists(progress, topicSlug) || completedTopic(progress, topicSlug)
}

export function computeRank(progress: ProgressSnapshot): RankResult {
  const chapter1Done = chapterCompleted(progress, CHAPTER1_SLUG)
  const prologueTrialDone = completedTopic(progress, PROLOGUE_TRIAL_SLUG)

  if (!chapter1Done && !prologueTrialDone) {
    return { rankSlug: 'unranked', nextRankSlug: 'initiate' }
  }

  let currentRank: string = 'initiate'

  const campfireCadetReady =
    completedTopic(progress, VARIABLES_TOPIC_SLUG) &&
    completedTopic(progress, CONSTANTS_TOPIC_SLUG) &&
    completedIfExists(progress, TYPES_TOPIC_SLUG)

  if (campfireCadetReady) currentRank = 'campfire-cadet'
  if (completedIfExists(progress, SCOPE_TOPIC_SLUG) && completedTopic(progress, SCOPE_TOPIC_SLUG)) {
    currentRank = 'scope-ranger'
  }

  const stackAdeptReady =
    completedIfExists(progress, DATA_FOREST_TRIAL_SLUG) && completedTopic(progress, DATA_FOREST_TRIAL_SLUG)
      ? true
      : completedIfExists(progress, FUNCTIONS_TOPIC_SLUG) &&
        completedIfExists(progress, OBJECTS_TOPIC_SLUG) &&
        completedIfExists(progress, ARRAYS_TOPIC_SLUG) &&
        completedTopic(progress, FUNCTIONS_TOPIC_SLUG) &&
        completedTopic(progress, OBJECTS_TOPIC_SLUG) &&
        completedTopic(progress, ARRAYS_TOPIC_SLUG)

  if (stackAdeptReady) currentRank = 'stack-adept'

  const asyncTopicExists = topicExists(progress, PROMISES_TOPIC_SLUG) || topicExists(progress, ASYNC_TOPIC_SLUG)
  if (asyncTopicExists && (completedTopic(progress, PROMISES_TOPIC_SLUG) || completedTopic(progress, ASYNC_TOPIC_SLUG))) {
    currentRank = 'async-apprentice'
  }

  if (completedTopic(progress, BOOK2_CH1_TRIAL_SLUG)) currentRank = 'runtime-navigator'
  if (completedTopic(progress, BOOK2_CH2_TRIAL_SLUG)) currentRank = 'flux-architect'
  if (completedTopic(progress, BOOK2_FINAL_TRIAL_SLUG)) currentRank = 'loop-sage'

  const index = BOOK1_RANKS.findIndex((rank) => rank.slug === currentRank)
  const nextRank = index >= 0 ? BOOK1_RANKS[index + 1] : null

  return {
    rankSlug: currentRank,
    nextRankSlug: nextRank?.slug,
    comingSoon: nextRank?.lockedByContent ?? false,
  }
}
