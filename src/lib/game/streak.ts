export type StreakScope = 'micro' | 'quiz'

export type StreakState = {
  streak: number
  shield: number
  hintTokens: number
}

const DEFAULT_STATE: StreakState = {
  streak: 0,
  shield: 0,
  hintTokens: 0,
}

function getKey(sessionToken: string, scope: StreakScope) {
  return `jstopia:${sessionToken}:streak:${scope}`
}

export function loadStreakState(sessionToken: string | null, scope: StreakScope): StreakState {
  if (!sessionToken || typeof window === 'undefined') return { ...DEFAULT_STATE }
  const raw = window.localStorage.getItem(getKey(sessionToken, scope))
  if (!raw) return { ...DEFAULT_STATE }
  try {
    const parsed = JSON.parse(raw) as Partial<StreakState>
    return {
      streak: Number(parsed.streak ?? 0),
      shield: Number(parsed.shield ?? 0),
      hintTokens: Number(parsed.hintTokens ?? 0),
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function saveStreakState(sessionToken: string | null, scope: StreakScope, state: StreakState) {
  if (!sessionToken || typeof window === 'undefined') return
  window.localStorage.setItem(getKey(sessionToken, scope), JSON.stringify(state))
}

const MICRO_STREAK_MILESTONE = 5
const MICRO_STREAK_BONUS_XP = 10

export function applyAnswerResult(params: {
  sessionToken: string | null
  scope: StreakScope
  correct: boolean
}): { state: StreakState; shieldUsed: boolean; bonusXp: number } {
  const current = loadStreakState(params.sessionToken, params.scope)
  let shieldUsed = false
  let bonusXp = 0
  const next: StreakState = { ...current }

  if (params.correct) {
    next.streak += 1
    if (params.scope === 'micro' && next.streak % MICRO_STREAK_MILESTONE === 0) {
      next.shield += 1
      next.hintTokens += 1
      bonusXp = MICRO_STREAK_BONUS_XP
    }
  } else {
    if (params.scope === 'micro' && next.shield > 0) {
      next.shield -= 1
      shieldUsed = true
    } else {
      next.streak = 0
    }
  }

  saveStreakState(params.sessionToken, params.scope, next)
  return { state: next, shieldUsed, bonusXp }
}
