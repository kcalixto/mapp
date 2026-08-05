import type { AppState } from '../types'
import { formatDateDisplay, isIsoDate } from './dateFormat'

export const TIME_PREFIX = /^(às|as|das)\s/i

/**
 * Builds the "📍 às 17h na Estação Jabaquara" line from time + location.
 * Returns null when both are empty so the line is omitted entirely.
 */
export function formatObservationLine(time: string, location: string): string | null {
  const t = time.trim()
  const loc = location.trim()
  if (!t && !loc) return null
  const timePart = t ? (TIME_PREFIX.test(t) ? t : `às ${t}`) : ''
  if (t && loc) return `📍 ${timePart} na ${loc}`
  if (t) return `📍 ${timePart}`
  return `📍 ${loc}`
}

export function formatMessage(state: AppState): string {
  const groupBlocks: string[] = []

  // Message is sorted by date; editor order is user-owned and untouched.
  // Legacy/free-text dates keep insertion order after the ISO block.
  const isoGroups = state.dateGroups.filter(g => isIsoDate(g.date)).sort((a, b) => a.date.localeCompare(b.date))
  const restGroups = state.dateGroups.filter(g => !isIsoDate(g.date))

  for (const group of [...isoGroups, ...restGroups]) {
    const activityBlocks: string[] = []

    for (const activity of group.activities) {
      const observation = formatObservationLine(activity.time, activity.location)
      const participants = activity.participants.filter(p => p.trim())
      // Untouched seeded/empty activities never leak into the copied text
      if (!activity.name.trim() && !observation && participants.length === 0) continue
      const lines = [`*${activity.name}*`]
      if (observation) lines.push(observation)
      for (const p of participants) {
        lines.push(`- ${p}`)
      }
      activityBlocks.push(lines.join('\n'))
    }

    if (activityBlocks.length === 0) continue

    // Date header immediately followed by activities (no blank line between header and first activity)
    // Activities separated by one blank line
    groupBlocks.push(`_🗓️ ${formatDateDisplay(group.date)}_\n` + activityBlocks.join('\n\n'))
  }

  // One blank line after title, two blank lines between date groups
  return groupBlocks.length === 0 ? `🔥${state.title}🔥` : `🔥${state.title}🔥\n\n` + groupBlocks.join('\n\n\n')
}
