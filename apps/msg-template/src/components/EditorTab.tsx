import type { Activity, AppState } from '../types'
import { formatMessage } from '../utils/messageFormatter'
import { CharCounter } from './CharCounter'
import { DateGroupCard } from './DateGroupCard'

interface EditorTabProps {
  state: AppState
  expandedActivityId: string | null
  activityOptions: string[]
  timeOptions: string[]
  locationOptions: string[]
  participantSuggestions: string[]
  onTitleChange: (title: string) => void
  onAddDateGroup: () => void
  onRemoveDateGroup: (groupId: string) => void
  onDuplicateDateGroup: (groupId: string) => void
  onDateChange: (groupId: string, date: string) => void
  onAddActivity: (groupId: string) => void
  onRemoveActivity: (groupId: string, activityId: string) => void
  onDuplicateActivity: (groupId: string, activityId: string) => void
  onToggleActivity: (activityId: string) => void
  onActivityChange: (groupId: string, activityId: string, patch: Partial<Activity>) => void
  onAddParticipant: (groupId: string, activityId: string, name: string) => void
  onRemoveParticipant: (groupId: string, activityId: string, index: number) => void
  onNewWeek: () => void
  onClear: () => void
  onCopy: () => void
  copyLabel: string
  saveFailed: boolean
}

export function EditorTab({
  state,
  expandedActivityId,
  activityOptions,
  timeOptions,
  locationOptions,
  participantSuggestions,
  onTitleChange,
  onAddDateGroup,
  onRemoveDateGroup,
  onDuplicateDateGroup,
  onDateChange,
  onAddActivity,
  onRemoveActivity,
  onDuplicateActivity,
  onToggleActivity,
  onActivityChange,
  onAddParticipant,
  onRemoveParticipant,
  onNewWeek,
  onClear,
  onCopy,
  copyLabel,
  saveFailed,
}: EditorTabProps) {
  return (
    <>
      <div className="field">
        <div className="field-label">Título</div>
        <input
          className="text-input"
          placeholder="ex: Calendário de Lutas da semana"
          value={state.title}
          onChange={e => onTitleChange(e.target.value)}
        />
      </div>

      {state.dateGroups.length > 0 && (
        <button className="btn btn-week" onClick={onNewWeek}>
          Nova semana (+7 dias, sem participantes)
        </button>
      )}

      {state.dateGroups.map(group => (
        <DateGroupCard
          key={group.id}
          group={group}
          expandedActivityId={expandedActivityId}
          activityOptions={activityOptions}
          timeOptions={timeOptions}
          locationOptions={locationOptions}
          participantSuggestions={participantSuggestions}
          onRemove={() => onRemoveDateGroup(group.id)}
          onDuplicate={() => onDuplicateDateGroup(group.id)}
          onDateChange={date => onDateChange(group.id, date)}
          onAddActivity={() => onAddActivity(group.id)}
          onRemoveActivity={aid => onRemoveActivity(group.id, aid)}
          onDuplicateActivity={aid => onDuplicateActivity(group.id, aid)}
          onToggleActivity={onToggleActivity}
          onActivityChange={(aid, patch) => onActivityChange(group.id, aid, patch)}
          onAddParticipant={(aid, name) => onAddParticipant(group.id, aid, name)}
          onRemoveParticipant={(aid, i) => onRemoveParticipant(group.id, aid, i)}
        />
      ))}

      <button className="dashed-btn primary" onClick={onAddDateGroup}>
        + Adicionar data
      </button>

      <div className="editor-footer">
        {saveFailed && <div className="save-warning">⚠️ Não foi possível salvar — o navegador bloqueou o armazenamento</div>}
        <CharCounter count={formatMessage(state).length} />
        <div className="footer-buttons">
          <button className="btn btn-clear" onClick={onClear}>
            Limpar tudo
          </button>
          <button className="btn btn-copy" onClick={onCopy}>
            {copyLabel}
          </button>
        </div>
      </div>
    </>
  )
}
