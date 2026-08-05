import type { Activity, DateGroup } from '../types'
import { isIsoDate, formatDateDisplay } from '../utils/dateFormat'
import { ActivityCard } from './ActivityCard'

interface DateGroupCardProps {
  group: DateGroup
  expandedActivityId: string | null
  activityOptions: string[]
  timeOptions: string[]
  locationOptions: string[]
  participantSuggestions: string[]
  onRemove: () => void
  onDuplicate: () => void
  onDateChange: (date: string) => void
  onAddActivity: () => void
  onRemoveActivity: (activityId: string) => void
  onDuplicateActivity: (activityId: string) => void
  onToggleActivity: (activityId: string) => void
  onActivityChange: (activityId: string, patch: Partial<Activity>) => void
  onAddParticipant: (activityId: string, name: string) => void
  onRemoveParticipant: (activityId: string, index: number) => void
}

export function DateGroupCard({
  group,
  expandedActivityId,
  activityOptions,
  timeOptions,
  locationOptions,
  participantSuggestions,
  onRemove,
  onDuplicate,
  onDateChange,
  onAddActivity,
  onRemoveActivity,
  onDuplicateActivity,
  onToggleActivity,
  onActivityChange,
  onAddParticipant,
  onRemoveParticipant,
}: DateGroupCardProps) {
  return (
    <div className="date-group-card">
      <div className="date-group-header">
        <input
          type="date"
          className="date-input-compact"
          value={isIsoDate(group.date) ? group.date : ''}
          onChange={e => onDateChange(e.target.value)}
        />
        <span className="date-group-label">
          {/* ISO: picker already shows the date; label = short weekday ("Quarta") */}
          {isIsoDate(group.date)
            ? formatDateDisplay(group.date).replace(/^\S+\s/, '').replace(/-feira$/, '')
            : group.date}
        </span>
        <button className="link-action" onClick={onDuplicate}>duplicar</button>
        <button className="link-danger" onClick={onRemove}>remover</button>
      </div>

      {group.activities.map(activity => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          expanded={expandedActivityId === activity.id}
          nameOptions={activityOptions}
          timeOptions={timeOptions}
          locationOptions={locationOptions}
          participantSuggestions={participantSuggestions}
          onToggle={() => onToggleActivity(activity.id)}
          onRemove={() => onRemoveActivity(activity.id)}
          onDuplicate={() => onDuplicateActivity(activity.id)}
          onChange={patch => onActivityChange(activity.id, patch)}
          onAddParticipant={name => onAddParticipant(activity.id, name)}
          onRemoveParticipant={i => onRemoveParticipant(activity.id, i)}
        />
      ))}

      <button className="dashed-btn compact" onClick={onAddActivity}>
        + atividade
      </button>
    </div>
  )
}
