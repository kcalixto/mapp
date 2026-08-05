import { describe, it, expect } from 'vitest'
import { isIsoDate, formatDateDisplay, addDaysIso, todayIso } from './dateFormat'

describe('todayIso', () => {
  it('returns a valid ISO date matching the local clock', () => {
    const result = todayIso()
    expect(isIsoDate(result)).toBe(true)
    const now = new Date()
    const [y, m, d] = result.split('-').map(Number)
    expect(y).toBe(now.getFullYear())
    expect(m).toBe(now.getMonth() + 1)
    expect(d).toBe(now.getDate())
  })
})

describe('addDaysIso', () => {
  it('adds days within a month', () => {
    expect(addDaysIso('2026-07-15', 1)).toBe('2026-07-16')
  })

  it('crosses month boundaries', () => {
    expect(addDaysIso('2026-05-27', 7)).toBe('2026-06-03')
  })

  it('crosses year boundaries', () => {
    expect(addDaysIso('2026-12-28', 7)).toBe('2027-01-04')
  })

  it('zero-pads day and month', () => {
    expect(addDaysIso('2026-01-05', 1)).toBe('2026-01-06')
  })

  it('passes non-ISO strings through unchanged', () => {
    expect(addDaysIso('27/5 Quarta-feira', 7)).toBe('27/5 Quarta-feira')
    expect(addDaysIso('', 7)).toBe('')
  })
})

describe('isIsoDate', () => {
  it('matches ISO dates', () => {
    expect(isIsoDate('2026-05-27')).toBe(true)
  })

  it('rejects free text and empty string', () => {
    expect(isIsoDate('27/5 Quarta-feira')).toBe(false)
    expect(isIsoDate('')).toBe(false)
  })
})

describe('formatDateDisplay', () => {
  it('formats an ISO date as d/M with capitalized pt-BR weekday', () => {
    expect(formatDateDisplay('2026-05-27')).toBe('27/5 Quarta-feira')
  })

  it('does not pad day or month with zeros', () => {
    expect(formatDateDisplay('2026-06-01')).toBe('1/6 Segunda-feira')
  })

  it('does not shift the day across timezones', () => {
    expect(formatDateDisplay('2026-05-31')).toBe('31/5 Domingo')
  })

  it('passes legacy free text through unchanged', () => {
    expect(formatDateDisplay('27/5 Quarta-feira')).toBe('27/5 Quarta-feira')
  })

  it('passes empty string through unchanged', () => {
    expect(formatDateDisplay('')).toBe('')
  })
})
