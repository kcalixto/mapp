import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import type { AppState, DateGroup, Activity } from './types'
import { defaultState, genId } from './types'
import { PRESET_ACTIVITIES, PRESET_LOCATIONS, PRESET_TIMES } from './constants'
import { loadState, saveState } from './utils/storage'
import { formatMessage } from './utils/messageFormatter'
import { addDaysIso, isIsoDate, todayIso } from './utils/dateFormat'
import { recordStateUsage, getTopValues } from './utils/chipHistory'
import { copyText } from './utils/clipboard'
import { TabBar } from './components/TabBar'
import { EditorTab } from './components/EditorTab'
import { PreviewTab } from './components/PreviewTab'

function computeChipOptions() {
  return {
    activityOptions: getTopValues('activities', PRESET_ACTIVITIES),
    timeOptions: getTopValues('times', PRESET_TIMES),
    locationOptions: getTopValues('locations', PRESET_LOCATIONS),
    participantSuggestions: getTopValues('participants', []),
  }
}

export default function App() {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [state, setState] = useState<AppState>(() => loadState() ?? defaultState)
  const [copyLabel, setCopyLabel] = useState('Copiar mensagem')
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null)
  const [chipOptions, setChipOptions] = useState(computeChipOptions)
  const [saveFailed, setSaveFailed] = useState(false)
  const [undo, setUndo] = useState<{ snapshot: AppState; label: string } | null>(null)
  const { activityOptions, timeOptions, locationOptions, participantSuggestions } = chipOptions

  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])
  const undoTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const timer = setTimeout(() => setSaveFailed(!saveState(state)), 300)
    return () => clearTimeout(timer)
  }, [state])

  // Single-slot undo replaces the old 2-tap confirms: destructive actions are
  // 1 tap and reversible for 5s
  const takeSnapshot = useCallback((label: string) => {
    setUndo({ snapshot: stateRef.current, label })
    clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setUndo(null), 5000)
  }, [])

  const handleUndo = useCallback(() => {
    setUndo(cur => {
      if (cur) {
        setState(cur.snapshot)
        setExpandedActivityId(null)
      }
      return null
    })
    clearTimeout(undoTimer.current)
  }, [])

  const handleCopy = useCallback(() => {
    // Copying is the "commit" signal — record chip usage regardless of clipboard success
    recordStateUsage(state)
    setChipOptions(computeChipOptions())
    copyText(formatMessage(state)).then(ok => {
      setCopyLabel(ok ? 'Copiado!' : 'Falha ao copiar')
      setTimeout(() => setCopyLabel('Copiar mensagem'), 2500)
    })
  }, [state])

  const handleClear = useCallback(() => {
    takeSnapshot('Tudo limpo')
    setState(s => ({ ...defaultState, title: s.title }))
    setExpandedActivityId(null)
  }, [takeSnapshot])

  const handleNewWeek = useCallback(() => {
    takeSnapshot('Nova semana aplicada')
    setState(s => ({
      ...s,
      dateGroups: s.dateGroups.map(g => ({
        ...g,
        date: addDaysIso(g.date, 7),
        activities: g.activities.map(a => ({ ...a, participants: [] })),
      })),
    }))
  }, [takeSnapshot])

  const handleTitleChange = useCallback((title: string) => {
    setState(s => ({ ...s, title }))
  }, [])

  const handleAddDateGroup = useCallback(() => {
    // Smart default: latest ISO date +1 (consecutive days are the common case),
    // today when empty. One tap lands on a dated group with an open activity.
    const isoDates = stateRef.current.dateGroups.map(g => g.date).filter(isIsoDate).sort()
    const lastIso = isoDates[isoDates.length - 1]
    const activity: Activity = { id: genId(), name: '', time: '', location: '', participants: [] }
    const group: DateGroup = {
      id: genId(),
      date: lastIso ? addDaysIso(lastIso, 1) : todayIso(),
      activities: [activity],
    }
    setState(s => ({ ...s, dateGroups: [...s.dateGroups, group] }))
    setExpandedActivityId(activity.id)
  }, [])

  const handleRemoveDateGroup = useCallback((groupId: string) => {
    takeSnapshot('Dia removido')
    setState(s => ({ ...s, dateGroups: s.dateGroups.filter(g => g.id !== groupId) }))
  }, [takeSnapshot])

  const handleDuplicateDateGroup = useCallback((groupId: string) => {
    setState(s => {
      const source = s.dateGroups.find(g => g.id === groupId)
      if (!source) return s
      const clone: DateGroup = {
        id: genId(),
        date: addDaysIso(source.date, 1),
        activities: source.activities.map(a => ({ ...a, id: genId(), participants: [...a.participants] })),
      }
      const index = s.dateGroups.findIndex(g => g.id === groupId)
      const dateGroups = [...s.dateGroups]
      dateGroups.splice(index + 1, 0, clone)
      return { ...s, dateGroups }
    })
  }, [])

  const handleDateChange = useCallback((groupId: string, date: string) => {
    setState(s => ({
      ...s,
      dateGroups: s.dateGroups.map(g => g.id === groupId ? { ...g, date } : g),
    }))
  }, [])

  const handleAddActivity = useCallback((groupId: string) => {
    const activity: Activity = { id: genId(), name: '', time: '', location: '', participants: [] }
    setState(s => ({
      ...s,
      dateGroups: s.dateGroups.map(g =>
        g.id === groupId ? { ...g, activities: [...g.activities, activity] } : g
      ),
    }))
    setExpandedActivityId(activity.id)
  }, [])

  const handleRemoveActivity = useCallback((groupId: string, activityId: string) => {
    takeSnapshot('Atividade removida')
    setState(s => ({
      ...s,
      dateGroups: s.dateGroups.map(g =>
        g.id === groupId
          ? { ...g, activities: g.activities.filter(a => a.id !== activityId) }
          : g
      ),
    }))
    setExpandedActivityId(cur => (cur === activityId ? null : cur))
  }, [takeSnapshot])

  const handleDuplicateActivity = useCallback((groupId: string, activityId: string) => {
    // id generated outside the updater: StrictMode double-invokes updaters
    const newId = genId()
    setState(s => ({
      ...s,
      dateGroups: s.dateGroups.map(g => {
        if (g.id !== groupId) return g
        const index = g.activities.findIndex(a => a.id === activityId)
        if (index === -1) return g
        const source = g.activities[index]
        const clone: Activity = { ...source, id: newId, participants: [...source.participants] }
        const activities = [...g.activities]
        activities.splice(index + 1, 0, clone)
        return { ...g, activities }
      }),
    }))
    setExpandedActivityId(newId)
  }, [])

  const handleToggleActivity = useCallback((activityId: string) => {
    setExpandedActivityId(cur => (cur === activityId ? null : activityId))
  }, [])

  const handleActivityChange = useCallback((groupId: string, activityId: string, patch: Partial<Activity>) => {
    setState(s => ({
      ...s,
      dateGroups: s.dateGroups.map(g =>
        g.id === groupId
          ? { ...g, activities: g.activities.map(a => a.id === activityId ? { ...a, ...patch } : a) }
          : g
      ),
    }))
  }, [])

  const handleAddParticipant = useCallback((groupId: string, activityId: string, name: string) => {
    setState(s => ({
      ...s,
      dateGroups: s.dateGroups.map(g =>
        g.id === groupId
          ? {
              ...g,
              activities: g.activities.map(a =>
                a.id === activityId
                  ? { ...a, participants: [...a.participants, name] }
                  : a
              ),
            }
          : g
      ),
    }))
  }, [])

  const handleRemoveParticipant = useCallback((groupId: string, activityId: string, index: number) => {
    setState(s => ({
      ...s,
      dateGroups: s.dateGroups.map(g =>
        g.id === groupId
          ? {
              ...g,
              activities: g.activities.map(a =>
                a.id === activityId
                  ? { ...a, participants: a.participants.filter((_, i) => i !== index) }
                  : a
              ),
            }
          : g
      ),
    }))
  }, [])

  return (
    <div className="app">
      <TabBar active={tab} onChange={setTab} />
      {tab === 'edit' ? (
        <div className="tab-content">
          <EditorTab
            state={state}
            expandedActivityId={expandedActivityId}
            activityOptions={activityOptions}
            timeOptions={timeOptions}
            locationOptions={locationOptions}
            participantSuggestions={participantSuggestions}
            onTitleChange={handleTitleChange}
            onAddDateGroup={handleAddDateGroup}
            onRemoveDateGroup={handleRemoveDateGroup}
            onDuplicateDateGroup={handleDuplicateDateGroup}
            onDateChange={handleDateChange}
            onAddActivity={handleAddActivity}
            onRemoveActivity={handleRemoveActivity}
            onDuplicateActivity={handleDuplicateActivity}
            onToggleActivity={handleToggleActivity}
            onActivityChange={handleActivityChange}
            onAddParticipant={handleAddParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onNewWeek={handleNewWeek}
            onClear={handleClear}
            onCopy={handleCopy}
            copyLabel={copyLabel}
            saveFailed={saveFailed}
          />
        </div>
      ) : (
        <PreviewTab
          state={state}
          onCopy={handleCopy}
          copyLabel={copyLabel}
        />
      )}
      {undo && (
        <div className="undo-toast">
          <span>{undo.label}</span>
          <button className="undo-btn" onClick={handleUndo}>Desfazer</button>
        </div>
      )}
    </div>
  )
}
