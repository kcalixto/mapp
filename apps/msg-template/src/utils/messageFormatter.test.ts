import { describe, it, expect } from 'vitest'
import { formatMessage, formatObservationLine } from './messageFormatter'
import type { AppState } from '../types'

describe('formatObservationLine', () => {
  it('prefixes bare time with "às" and joins location with "na"', () => {
    expect(formatObservationLine('17h', 'Estação Jabaquara')).toBe('📍 às 17h na Estação Jabaquara')
  })

  it('does not double-prefix time already starting with "às"', () => {
    expect(formatObservationLine('às 7h30', 'Embapack')).toBe('📍 às 7h30 na Embapack')
  })

  it('keeps ranges starting with "das" untouched', () => {
    expect(formatObservationLine('das 19h às 23h', 'Vila Clara')).toBe('📍 das 19h às 23h na Vila Clara')
  })

  it('accepts unaccented "as" as an existing prefix', () => {
    expect(formatObservationLine('as 17h', '')).toBe('📍 as 17h')
  })

  it('renders time only', () => {
    expect(formatObservationLine('17h', '')).toBe('📍 às 17h')
  })

  it('renders location only without inventing a preposition', () => {
    expect(formatObservationLine('', 'Estação Conceição')).toBe('📍 Estação Conceição')
  })

  it('returns null when both are empty', () => {
    expect(formatObservationLine('', '')).toBeNull()
    expect(formatObservationLine('  ', ' ')).toBeNull()
  })
})

describe('formatMessage', () => {
  it('formats a single activity message', () => {
    const state: AppState = {
      title: 'Calendário',
      dateGroups: [{
        id: '1',
        date: '27/5 Quarta-feira',
        activities: [{
          id: 'a1',
          name: 'Brigada Operária',
          time: 'às 7h30',
          location: 'Embapack',
          participants: ['Calixto', 'Bruno'],
        }],
      }],
    }
    expect(formatMessage(state)).toBe(
      '🔥Calendário🔥\n\n_🗓️ 27/5 Quarta-feira_\n*Brigada Operária*\n📍 às 7h30 na Embapack\n- Calixto\n- Bruno'
    )
  })

  it('formats an ISO date as a pt-BR header', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [{
        id: '1',
        date: '2026-05-27',
        activities: [{ id: 'a1', name: 'Ato', time: '18h', location: '', participants: [] }],
      }],
    }
    expect(formatMessage(state)).toContain('_🗓️ 27/5 Quarta-feira_')
  })

  it('renders legacy free-text dates as-is', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [{
        id: '1',
        date: 'D1',
        activities: [{ id: 'a1', name: 'A', time: '', location: 'L', participants: [] }],
      }],
    }
    expect(formatMessage(state)).toContain('_🗓️ D1_')
  })

  it('omits the 📍 line when time and location are empty', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [{
        id: '1',
        date: 'D1',
        activities: [{ id: 'a1', name: 'A', time: '', location: '', participants: ['P'] }],
      }],
    }
    expect(formatMessage(state)).toBe('🔥T🔥\n\n_🗓️ D1_\n*A*\n- P')
  })

  it('separates two activities with one blank line', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [{
        id: '1',
        date: 'D1',
        activities: [
          { id: 'a1', name: 'Ato 1', time: '', location: 'Local 1', participants: [] },
          { id: 'a2', name: 'Ato 2', time: '', location: 'Local 2', participants: [] },
        ],
      }],
    }
    const result = formatMessage(state)
    expect(result).toContain('📍 Local 1\n\n*Ato 2*')
  })

  it('separates two date groups with two blank lines', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [
        { id: '1', date: 'D1', activities: [{ id: 'a1', name: 'A1', time: '', location: 'O1', participants: [] }] },
        { id: '2', date: 'D2', activities: [{ id: 'a2', name: 'A2', time: '', location: 'O2', participants: [] }] },
      ],
    }
    const result = formatMessage(state)
    expect(result).toContain('📍 O1\n\n\n_🗓️ D2_')
  })

  it('sorts ISO date groups ascending in the message', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [
        { id: '2', date: '2026-07-18', activities: [{ id: 'a2', name: 'B', time: '', location: '', participants: [] }] },
        { id: '1', date: '2026-07-15', activities: [{ id: 'a1', name: 'A', time: '', location: '', participants: [] }] },
      ],
    }
    const result = formatMessage(state)
    expect(result.indexOf('15/7')).toBeLessThan(result.indexOf('18/7'))
    // editor array untouched
    expect(state.dateGroups[0].date).toBe('2026-07-18')
  })

  it('keeps legacy and empty dates after the ISO block, in insertion order', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [
        { id: '1', date: 'Legado 1', activities: [{ id: 'a1', name: 'A', time: '', location: '', participants: [] }] },
        { id: '2', date: '2026-07-15', activities: [{ id: 'a2', name: 'B', time: '', location: '', participants: [] }] },
        { id: '3', date: '', activities: [{ id: 'a3', name: 'C', time: '', location: '', participants: [] }] },
      ],
    }
    const result = formatMessage(state)
    expect(result.indexOf('15/7')).toBeLessThan(result.indexOf('Legado 1'))
    expect(result.indexOf('Legado 1')).toBeLessThan(result.indexOf('*C*'))
  })

  it('renders empty title and no groups as just the fire emoji wrapper', () => {
    const state: AppState = { title: '', dateGroups: [] }
    expect(formatMessage(state)).toBe('🔥🔥')
  })

  it('skips activities with no name, time, location, or participants', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [{
        id: '1',
        date: 'D1',
        activities: [
          { id: 'a1', name: 'A', time: '', location: '', participants: [] },
          { id: 'a2', name: '', time: '', location: '', participants: [] },
        ],
      }],
    }
    expect(formatMessage(state)).toBe('🔥T🔥\n\n_🗓️ D1_\n*A*')
  })

  it('skips blank participants', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [{
        id: '1',
        date: 'D1',
        activities: [{ id: 'a1', name: 'A', time: '', location: '', participants: ['P', '  ', ''] }],
      }],
    }
    expect(formatMessage(state)).toBe('🔥T🔥\n\n_🗓️ D1_\n*A*\n- P')
  })

  it('skips groups whose activities are all empty (no orphan date header)', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [
        { id: '1', date: '2026-07-15', activities: [{ id: 'a1', name: '', time: '', location: '', participants: [] }] },
        { id: '2', date: '2026-07-16', activities: [{ id: 'a2', name: 'B', time: '', location: '', participants: [] }] },
        { id: '3', date: '2026-07-17', activities: [] },
      ],
    }
    expect(formatMessage(state)).toBe('🔥T🔥\n\n_🗓️ 16/7 Quinta-feira_\n*B*')
  })

  it('keeps an activity that only has participants', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [{
        id: '1',
        date: 'D1',
        activities: [{ id: 'a1', name: '', time: '', location: '', participants: ['P'] }],
      }],
    }
    expect(formatMessage(state)).toBe('🔥T🔥\n\n_🗓️ D1_\n**\n- P')
  })

  it('omits participant lines when list is empty', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [{
        id: '1',
        date: 'D1',
        activities: [{ id: 'a1', name: 'A', time: '10h', location: 'O', participants: [] }],
      }],
    }
    expect(formatMessage(state)).not.toContain('- ')
  })
})
