import type { AppState } from '../types'

export type ChipKind = 'activities' | 'locations' | 'times' | 'participants'

type ChipHistory = Record<ChipKind, Record<string, number>>

const KEY = 'wpp-chip-history'

const emptyHistory = (): ChipHistory => ({
  activities: {},
  locations: {},
  times: {},
  participants: {},
})

function loadHistory(): ChipHistory {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyHistory()
    const parsed = JSON.parse(raw) as Partial<ChipHistory>
    return { ...emptyHistory(), ...parsed }
  } catch {
    return emptyHistory()
  }
}

const MAX_ENTRIES_PER_KIND = 30

function prune(bucket: Record<string, number>): Record<string, number> {
  const top = Object.entries(bucket)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_ENTRIES_PER_KIND)
  return Object.fromEntries(top)
}

function saveHistory(history: ChipHistory): void {
  const pruned: ChipHistory = {
    activities: prune(history.activities),
    locations: prune(history.locations),
    times: prune(history.times),
    participants: prune(history.participants),
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(pruned))
  } catch {
    // history is an optimization — never let persistence failures break copying
  }
}

function record(bucket: Record<string, number>, value: string): void {
  const trimmed = value.trim()
  if (!trimmed) return
  bucket[trimmed] = (bucket[trimmed] ?? 0) + 1
}

/**
 * Called when the message is copied — the "commit" signal. The same value
 * appearing in N activities counts N times on purpose: that IS the frequency
 * signal that orders suggestion chips.
 */
export function recordStateUsage(state: AppState): void {
  const history = loadHistory()
  for (const group of state.dateGroups) {
    for (const activity of group.activities) {
      record(history.activities, activity.name)
      record(history.times, activity.time)
      record(history.locations, activity.location)
      for (const p of activity.participants) {
        record(history.participants, p)
      }
    }
  }
  saveHistory(history)
}

/**
 * Presets first (original order), then remembered values not in presets,
 * ordered by use count desc (ties: alphabetical), capped at n total.
 */
export function getTopValues(kind: ChipKind, presets: string[], n = 10): string[] {
  const bucket = loadHistory()[kind]
  const remembered = Object.keys(bucket)
    .filter(v => !presets.includes(v))
    .sort((a, b) => bucket[b] - bucket[a] || a.localeCompare(b))
  return [...presets, ...remembered].slice(0, Math.max(n, presets.length))
}
