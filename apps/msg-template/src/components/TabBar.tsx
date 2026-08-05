interface TabBarProps {
  active: 'edit' | 'preview'
  onChange: (tab: 'edit' | 'preview') => void
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="tab-bar">
      <button
        className={`tab-btn ${active === 'edit' ? 'active' : ''}`}
        onClick={() => onChange('edit')}
      >
        Editar
      </button>
      <button
        className={`tab-btn ${active === 'preview' ? 'active' : ''}`}
        onClick={() => onChange('preview')}
      >
        Preview
      </button>
    </nav>
  )
}
