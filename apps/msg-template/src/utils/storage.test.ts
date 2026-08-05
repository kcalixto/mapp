import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveState, loadState, clearState } from './storage'
import type { AppState } from '../types'

const mockState: AppState = {
  title: 'Calendário de Lutas',
  dateGroups: [{
    id: 'g1',
    date: '2026-05-27',
    activities: [{
      id: 'a1',
      name: 'Brigada',
      time: '17h',
      location: 'Estação Jabaquara',
      participants: ['Calixto'],
    }],
  }],
}

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when nothing is stored', () => {
    expect(loadState()).toBeNull()
  })

  it('saves and loads state round-trip', () => {
    saveState(mockState)
    expect(loadState()).toEqual(mockState)
  })

  it('clearState removes the stored item', () => {
    saveState(mockState)
    clearState()
    expect(loadState()).toBeNull()
  })

  it('returns null when stored value is malformed JSON', () => {
    localStorage.setItem('wpp-template-state', '{bad json')
    expect(loadState()).toBeNull()
  })

  it('saveState returns false instead of throwing when localStorage fails', () => {
    // Storage objects turn plain property assignment into setItem('setItem', ...) — spy on the prototype
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    try {
      expect(saveState(mockState)).toBe(false)
    } finally {
      spy.mockRestore()
    }
    expect(saveState(mockState)).toBe(true)
  })

  it('migrates legacy observation starting with a time prefix into time', () => {
    localStorage.setItem('wpp-template-state', JSON.stringify({
      title: 'T',
      dateGroups: [{
        id: 'g1',
        date: '27/5 Quarta-feira',
        activities: [{ id: 'a1', name: 'Brigada Operária', observation: 'às 7h30 na Embapack', participants: ['Bruno'] }],
      }],
    }))
    const state = loadState()
    expect(state?.dateGroups[0].activities[0]).toEqual({
      id: 'a1',
      name: 'Brigada Operária',
      time: 'às 7h30 na Embapack',
      location: '',
      participants: ['Bruno'],
    })
  })

  it('migrates legacy observation without a time prefix into location', () => {
    localStorage.setItem('wpp-template-state', JSON.stringify({
      title: 'T',
      dateGroups: [{
        id: 'g1',
        date: 'D1',
        activities: [{ id: 'a1', name: 'Ato', observation: 'Sede do sindicato', participants: [] }],
      }],
    }))
    const state = loadState()
    expect(state?.dateGroups[0].activities[0]).toEqual({
      id: 'a1',
      name: 'Ato',
      time: '',
      location: 'Sede do sindicato',
      participants: [],
    })
  })

  it('drops the legacy observation field from migrated activities', () => {
    localStorage.setItem('wpp-template-state', JSON.stringify({
      title: 'T',
      dateGroups: [{
        id: 'g1',
        date: 'D1',
        activities: [{ id: 'a1', name: 'A', observation: 'às 10h', participants: [] }],
      }],
    }))
    expect(loadState()?.dateGroups[0].activities[0]).not.toHaveProperty('observation')
  })
})
