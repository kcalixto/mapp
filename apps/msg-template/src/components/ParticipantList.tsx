import { useState } from 'react'
import type { KeyboardEvent } from 'react'

interface ParticipantListProps {
  participants: string[]
  suggestions: string[]
  onAdd: (name: string) => void
  onRemove: (index: number) => void
}

export function ParticipantList({ participants, suggestions, onAdd, onRemove }: ParticipantListProps) {
  const [input, setInput] = useState('')

  const visibleSuggestions = suggestions.filter(s => !participants.includes(s))

  function handleAdd() {
    const trimmed = input.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setInput('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  // Blur commits too: a half-typed name must not be lost by tapping elsewhere
  function handleBlur() {
    handleAdd()
  }

  return (
    <div>
      {(participants.length > 0 || visibleSuggestions.length > 0) && (
        <div className="chip-row">
          {participants.map((name, i) => (
            // keyed by index: duplicate names are legal in a participant list
            <button key={i} className="chip chip-participant" onClick={() => onRemove(i)} aria-label={`Remover ${name}`}>
              {name} <span className="chip-x">✕</span>
            </button>
          ))}
          {participants.length > 0 && visibleSuggestions.length > 0 && <span className="chip-sep" />}
          {visibleSuggestions.map(s => (
            <button key={s} className="chip chip-suggest" onClick={() => onAdd(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <input
        className="add-participant-input"
        placeholder="+ participante (Enter adiciona)"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
    </div>
  )
}
