import { describe, it, expect, beforeEach, vi } from 'vitest'
import { recordStateUsage, getTopValues } from './chipHistory'
import type { AppState } from '../types'

function stateWith(activities: Array<{ name?: string; time?: string; location?: string; participants?: string[] }>): AppState {
  return {
    title: 'T',
    dateGroups: [{
      id: 'g1',
      date: '2026-07-15',
      activities: activities.map((a, i) => ({
        id: `a${i}`,
        name: a.name ?? '',
        time: a.time ?? '',
        location: a.location ?? '',
        participants: a.participants ?? [],
      })),
    }],
  }
}

describe('recordStateUsage + getTopValues', () => {
  beforeEach(() => localStorage.clear())

  it('records all four kinds', () => {
    recordStateUsage(stateWith([{ name: 'Vigília', time: '6h', location: 'Praça', participants: ['Zeca'] }]))
    expect(getTopValues('activities', [])).toEqual(['Vigília'])
    expect(getTopValues('times', [])).toEqual(['6h'])
    expect(getTopValues('locations', [])).toEqual(['Praça'])
    expect(getTopValues('participants', [])).toEqual(['Zeca'])
  })

  it('counts duplicate occurrences in the same state', () => {
    recordStateUsage(stateWith([
      { participants: ['Ana', 'Zeca'] },
      { participants: ['Zeca'] },
    ]))
    expect(getTopValues('participants', [])).toEqual(['Zeca', 'Ana'])
  })

  it('skips empty and whitespace-only values', () => {
    recordStateUsage(stateWith([{ name: '  ', time: '', location: '', participants: [' '] }]))
    expect(getTopValues('activities', [])).toEqual([])
    expect(getTopValues('participants', [])).toEqual([])
  })

  it('accumulates counts across calls', () => {
    recordStateUsage(stateWith([{ location: 'Praça' }]))
    recordStateUsage(stateWith([{ location: 'Sede' }]))
    recordStateUsage(stateWith([{ location: 'Sede' }]))
    expect(getTopValues('locations', [])).toEqual(['Sede', 'Praça'])
  })

  it('treats corrupt stored JSON as empty history', () => {
    localStorage.setItem('wpp-chip-history', '{nope')
    expect(getTopValues('activities', ['Ato'])).toEqual(['Ato'])
    recordStateUsage(stateWith([{ name: 'Vigília' }]))
    expect(getTopValues('activities', [])).toEqual(['Vigília'])
  })

  it('keeps presets first in original order', () => {
    recordStateUsage(stateWith([{ name: 'Vigília' }, { name: 'Vigília' }]))
    expect(getTopValues('activities', ['Brigada', 'Ato'])).toEqual(['Brigada', 'Ato', 'Vigília'])
  })

  it('does not duplicate a remembered value that equals a preset', () => {
    recordStateUsage(stateWith([{ name: 'Ato' }]))
    expect(getTopValues('activities', ['Ato'])).toEqual(['Ato'])
  })

  it('orders remembered values by count desc, ties alphabetical', () => {
    recordStateUsage(stateWith([{ name: 'B' }, { name: 'B' }, { name: 'C' }, { name: 'A' }]))
    expect(getTopValues('activities', [])).toEqual(['B', 'A', 'C'])
  })

  it('caps the merged list at n', () => {
    recordStateUsage(stateWith([1, 2, 3, 4].map(i => ({ name: `X${i}` }))))
    expect(getTopValues('activities', ['P1', 'P2'], 4)).toEqual(['P1', 'P2', 'X1', 'X2'])
  })

  it('prunes each bucket to the top 30 entries by count', () => {
    recordStateUsage(stateWith(
      Array.from({ length: 40 }, (_, i) => ({ name: `N${String(i).padStart(2, '0')}` }))
    ))
    // record N00 again so it clearly survives the prune
    recordStateUsage(stateWith([{ name: 'N00' }]))
    const stored = JSON.parse(localStorage.getItem('wpp-chip-history')!)
    expect(Object.keys(stored.activities)).toHaveLength(30)
    expect(stored.activities['N00']).toBe(2)
  })

  it('does not throw when localStorage.setItem fails', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    try {
      expect(() => recordStateUsage(stateWith([{ name: 'X' }]))).not.toThrow()
    } finally {
      spy.mockRestore()
    }
  })
})
