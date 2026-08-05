import type { Activity, AppState, DateGroup } from '../types'
import { TIME_PREFIX } from './messageFormatter'

const KEY = 'wpp-template-state'

interface LegacyActivity extends Partial<Activity> {
  observation?: string
}

function migrateActivity(raw: LegacyActivity): Activity {
  let time = typeof raw.time === 'string' ? raw.time : ''
  let location = typeof raw.location === 'string' ? raw.location : ''

  // Legacy shape: a single free-text `observation`. Prefixed text ("às 7h30 na
  // Embapack") renders as-is from `time`; anything else was a bare place/note
  // and belongs in `location` — putting it in `time` would gain a spurious "às".
  if (typeof raw.observation === 'string' && !time && !location) {
    if (TIME_PREFIX.test(raw.observation.trim())) {
      time = raw.observation
    } else {
      location = raw.observation
    }
  }

  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    time,
    location,
    participants: Array.isArray(raw.participants) ? raw.participants : [],
  }
}

function migrate(raw: AppState): AppState {
  return {
    title: typeof raw.title === 'string' ? raw.title : '',
    dateGroups: (Array.isArray(raw.dateGroups) ? raw.dateGroups : []).map((g: DateGroup) => ({
      ...g,
      activities: (Array.isArray(g.activities) ? g.activities : []).map(migrateActivity),
    })),
  }
}

/** Returns false when persistence failed (quota, private mode) so the UI can warn. */
export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return migrate(JSON.parse(raw) as AppState)
  } catch {
    return null
  }
}

export function clearState(): void {
  localStorage.removeItem(KEY)
}
