import { useState, useRef, useEffect } from 'react'

interface ChipSelectProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  prefix?: string
}

export function ChipSelect({ options, value, onChange, placeholder, prefix }: ChipSelectProps) {
  const isCustom = value !== '' && !options.includes(value)
  const [showInput, setShowInput] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showInput) inputRef.current?.focus()
  }, [showInput])

  // Custom (or migrated) values keep the input visible so they stay editable
  const inputVisible = showInput || isCustom

  return (
    <div>
      <div className="chip-row">
        {prefix && <span className="chip-row-prefix">{prefix}</span>}
        {options.map(option => (
          <button
            key={option}
            className={`chip${value === option ? ' selected' : ''}`}
            onClick={() => {
              onChange(option)
              setShowInput(false)
            }}
          >
            {option}
          </button>
        ))}
        {!inputVisible && (
          <button className="chip chip-add" onClick={() => setShowInput(true)} aria-label="Valor personalizado">
            +
          </button>
        )}
      </div>
      {inputVisible && (
        <input
          ref={inputRef}
          className="text-input"
          placeholder={placeholder}
          value={isCustom ? value : ''}
          onChange={e => {
            // Keep the input open while the user erases back to empty
            setShowInput(true)
            onChange(e.target.value)
          }}
        />
      )}
    </div>
  )
}
