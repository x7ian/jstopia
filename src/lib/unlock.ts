import type { ProgressStatus } from '@/lib/unlock-types'

export function deriveStatusFromTopics(statuses: ProgressStatus[]) {
  if (statuses.length === 0) return 'locked'
  if (statuses.every((status) => status === 'completed')) return 'completed'
  if (statuses.some((status) => status === 'unlocked' || status === 'completed')) return 'unlocked'
  return 'locked'
}
