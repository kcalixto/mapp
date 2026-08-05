import type { Activity } from '../types'
import { ChipSelect } from './ChipSelect'
import { ParticipantList } from './ParticipantList'

interface ActivityCardProps {
  activity: Activity
  expanded: boolean
  nameOptions: string[]
  timeOptions: string[]
  locationOptions: string[]
  participantSuggestions: string[]
  onToggle: () => void
  onRemove: () => void
  onDuplicate: () => void
  onChange: (patch: Partial<Activity>) => void
  onAddParticipant: (name: string) => void
  onRemoveParticipant: (index: number) => void
}

export function ActivityCard({
  activity,
  expanded,
  nameOptions,
  timeOptions,
  locationOptions,
  participantSuggestions,
  onToggle,
  onRemove,
  onDuplicate,
  onChange,
  onAddParticipant,
  onRemoveParticipant,
}: ActivityCardProps) {
  return (
    <div className={`activity-card${expanded ? ' expanded' : ''}`}>
      <button className="activity-summary" onClick={onToggle} aria-expanded={expanded}>
        <span className="activity-summary-name">
          {activity.name || <span className="placeholder">Atividade</span>}
        </span>
        {activity.time && <span className="activity-summary-meta">· {activity.time}</span>}
        {activity.location && <span className="activity-summary-meta truncate">· {activity.location}</span>}
        {activity.participants.length > 0 && (
          <span className="activity-summary-count">👥{activity.participants.length}</span>
        )}
      </button>

      {expanded && (
        <div className="activity-editor">
          <ChipSelect
            options={nameOptions}
            value={activity.name}
            onChange={name => onChange({ name })}
            placeholder="ex: 🆙 Brigada Operária"
          />
          <ChipSelect
            options={timeOptions}
            value={activity.time}
            onChange={time => onChange({ time })}
            placeholder="ex: 17h ou das 19h às 23h"
            prefix="🕐"
          />
          <ChipSelect
            options={locationOptions}
            value={activity.location}
            onChange={location => onChange({ location })}
            placeholder="ex: catraca do metrô Sacomã"
            prefix="📍"
          />
          <ParticipantList
            participants={activity.participants}
            suggestions={participantSuggestions}
            onAdd={onAddParticipant}
            onRemove={onRemoveParticipant}
          />
          <div className="activity-actions">
            <button className="link-action" onClick={onDuplicate}>duplicar</button>
            <button className="link-danger" onClick={onRemove}>remover</button>
          </div>
        </div>
      )}
    </div>
  )
}
