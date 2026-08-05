# WhatsApp Message Template Tool — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first React + Vite app that composes WhatsApp group activity messages via a structured form, renders a live WhatsApp-style preview, warns on character overrun, persists state in localStorage, and deploys to AWS S3 via Serverless Framework v3 + GitHub Actions.

**Architecture:** Single-page React app, no backend. All state lives in React + localStorage. Vite handles the build; the `dist/` folder is synced to an S3 bucket configured as a static website. GitHub Actions runs `npm ci && npm run build && npx serverless deploy` on push to `main`.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Serverless Framework v3, serverless-s3-sync, GitHub Actions.

---

## File Map

```
src/
  types.ts                     # AppState, DateGroup, Activity interfaces + genId
  utils/
    storage.ts                 # localStorage read/write/clear
    storage.test.ts
    messageFormatter.ts        # AppState → WhatsApp-formatted string
    messageFormatter.test.ts
    whatsappRenderer.ts        # *bold* _italic_ → HTML (no tests, trivial regex)
  components/
    TabBar.tsx                 # Editar | Preview tab buttons
    ParticipantList.tsx        # vertical list of participant rows + add row
    ActivityCard.tsx           # one activity (name, observação, participants)
    DateGroupCard.tsx          # one date group (date field + activity list)
    EditorTab.tsx              # full editor: title + date groups + footer buttons
    WhatsAppBubble.tsx         # green bubble with rendered HTML message
    CharCounter.tsx            # character count bar with threshold coloring
    PreviewTab.tsx             # chat background + bubble + counter + copy button
  App.tsx                      # root: tab state, all handlers, localStorage sync
  App.css                      # global styles, phone frame, all component classes
  main.tsx                     # entry point (untouched after scaffold)
index.html                     # Vite entry (untouched after scaffold)
vite.config.ts                 # add vitest config
serverless.yml
.github/workflows/deploy.yml
```

---

## Task 1: Scaffold project

**Files:**
- Create: all Vite scaffold files
- Modify: `vite.config.ts`
- Create: `src/test-setup.ts`

- [ ] **Step 1: Initialize Vite + React + TypeScript**

```bash
cd /Users/kaua.calixto/go/src/up/msg-template
npm create vite@latest . -- --template react-ts
```

Accept overwriting existing files when prompted.

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @types/node
```

- [ ] **Step 3: Replace `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
})
```

- [ ] **Step 4: Create `src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to `package.json`**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Delete boilerplate files**

```bash
rm src/App.css src/assets/react.svg public/vite.svg
```

Remove `src/counter.ts` if it exists. Empty `src/index.css` (keep the file, clear the content).

- [ ] **Step 7: Verify test runner works**

```bash
npm test
```

Expected: "No test files found" or 0 tests — no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite react-ts project with vitest"
```

---

## Task 2: Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create `src/types.ts`**

```typescript
export interface Activity {
  id: string
  name: string
  observation: string
  participants: string[]
}

export interface DateGroup {
  id: string
  date: string
  activities: Activity[]
}

export interface AppState {
  title: string
  dateGroups: DateGroup[]
}

export const genId = (): string => Math.random().toString(36).slice(2, 10)

export const defaultState: AppState = {
  title: '',
  dateGroups: [],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add AppState types and genId utility"
```

---

## Task 3: Storage utility

**Files:**
- Create: `src/utils/storage.ts`
- Create: `src/utils/storage.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `src/utils/storage.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { saveState, loadState, clearState } from './storage'
import { AppState } from '../types'

const mockState: AppState = {
  title: 'Calendário de Lutas',
  dateGroups: [],
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
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test
```

Expected: FAIL — "Cannot find module './storage'"

- [ ] **Step 3: Implement `src/utils/storage.ts`**

```typescript
import { AppState } from '../types'

const KEY = 'wpp-template-state'

export function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppState
  } catch {
    return null
  }
}

export function clearState(): void {
  localStorage.removeItem(KEY)
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test
```

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/utils/
git commit -m "feat: add localStorage storage utility"
```

---

## Task 4: Message formatter

**Files:**
- Create: `src/utils/messageFormatter.ts`
- Create: `src/utils/messageFormatter.test.ts`

The output format for a state with two date groups and two activities in the first group:

```
🔥Calendário de Lutas🔥

_🗓️ 27/5 Quarta-feira_
*Brigada Operária*
📍 às 7h30 na Embapack
- Calixto
- Bruno

*Ato 2*
📍 Local 2


_🗓️ 28/5 Quinta-feira_
*Atividade*
📍 Local
```

Rules:
- Title wrapped in 🔥 (no bold markers — WhatsApp renders the title plain)
- One blank line between title and first date group (`\n\n`)
- Date header directly followed by first activity (no blank line between them)
- Activities within a group separated by one blank line (`\n\n`)
- Date groups separated by two blank lines (`\n\n\n`)
- Activity name wrapped in `*...*`
- Date wrapped in `_🗓️ ..._`
- Observation prefixed with `📍 `
- Each participant on its own line prefixed with `- `

- [ ] **Step 1: Write failing tests**

Create `src/utils/messageFormatter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { formatMessage } from './messageFormatter'
import { AppState } from '../types'

describe('formatMessage', () => {
  it('formats a single activity message', () => {
    const state: AppState = {
      title: 'Calendário',
      dateGroups: [{
        id: '1',
        date: '27/5 Quarta-feira',
        activities: [{
          id: 'a1',
          name: 'Brigada Operária',
          observation: 'às 7h30 na Embapack',
          participants: ['Calixto', 'Bruno'],
        }],
      }],
    }
    expect(formatMessage(state)).toBe(
      '🔥Calendário🔥\n\n_🗓️ 27/5 Quarta-feira_\n*Brigada Operária*\n📍 às 7h30 na Embapack\n- Calixto\n- Bruno'
    )
  })

  it('separates two activities with one blank line', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [{
        id: '1',
        date: 'D1',
        activities: [
          { id: 'a1', name: 'Ato 1', observation: 'Local 1', participants: [] },
          { id: 'a2', name: 'Ato 2', observation: 'Local 2', participants: [] },
        ],
      }],
    }
    const result = formatMessage(state)
    expect(result).toContain('📍 Local 1\n\n*Ato 2*')
  })

  it('separates two date groups with two blank lines', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [
        { id: '1', date: 'D1', activities: [{ id: 'a1', name: 'A1', observation: 'O1', participants: [] }] },
        { id: '2', date: 'D2', activities: [{ id: 'a2', name: 'A2', observation: 'O2', participants: [] }] },
      ],
    }
    const result = formatMessage(state)
    expect(result).toContain('📍 O1\n\n\n_🗓️ D2_')
  })

  it('renders empty title and no groups as just the fire emoji wrapper', () => {
    const state: AppState = { title: '', dateGroups: [] }
    expect(formatMessage(state)).toBe('🔥🔥')
  })

  it('omits participant lines when list is empty', () => {
    const state: AppState = {
      title: 'T',
      dateGroups: [{
        id: '1',
        date: 'D1',
        activities: [{ id: 'a1', name: 'A', observation: 'O', participants: [] }],
      }],
    }
    expect(formatMessage(state)).not.toContain('- ')
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
npm test
```

Expected: FAIL — "Cannot find module './messageFormatter'"

- [ ] **Step 3: Implement `src/utils/messageFormatter.ts`**

```typescript
import { AppState } from '../types'

export function formatMessage(state: AppState): string {
  const groupBlocks: string[] = []

  for (const group of state.dateGroups) {
    const activityBlocks: string[] = []

    for (const activity of group.activities) {
      const lines = [`*${activity.name}*`, `📍 ${activity.observation}`]
      for (const p of activity.participants) {
        lines.push(`- ${p}`)
      }
      activityBlocks.push(lines.join('\n'))
    }

    // Date header immediately followed by activities (no blank line between header and first activity)
    // Activities separated by one blank line
    groupBlocks.push(`_🗓️ ${group.date}_\n` + activityBlocks.join('\n\n'))
  }

  // One blank line after title, two blank lines between date groups
  return `🔥${state.title}🔥\n\n` + groupBlocks.join('\n\n\n')
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npm test
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/utils/
git commit -m "feat: add message formatter with WhatsApp markdown output"
```

---

## Task 5: WhatsApp renderer utility

**Files:**
- Create: `src/utils/whatsappRenderer.ts`

No tests — it's three regex substitutions on a known-safe internal string.

- [ ] **Step 1: Create `src/utils/whatsappRenderer.ts`**

```typescript
/**
 * Converts WhatsApp markdown (*bold*, _italic_) to HTML.
 * Input is always a string produced by formatMessage — not user-supplied HTML.
 */
export function renderToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*(.*?)\*/gs, '<strong>$1</strong>')
    .replace(/_(.*?)_/gs, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/whatsappRenderer.ts
git commit -m "feat: add WhatsApp markdown to HTML renderer"
```

---

## Task 6: Global CSS + App shell

**Files:**
- Create: `src/App.css` (complete styles)
- Modify: `src/App.tsx` (phone frame shell + tab routing)
- Create: `src/components/TabBar.tsx`

- [ ] **Step 1: Create `src/App.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --green: #25D366;
  --green-dark: #128C7E;
  --green-bubble: #005c4b;
  --wpp-bg: #0b141a;
  --bg: #111827;
  --surface: #1f2937;
  --surface-2: #0d1117;
  --border: #374151;
  --text: #f3f4f6;
  --muted: #9ca3af;
  --danger: #ef4444;
  --radius: 8px;
  --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

html, body, #root {
  height: 100%;
  background: #0d0d0d;
  color: var(--text);
  font-family: var(--font);
}

/* Phone frame */
.app {
  max-width: 430px;
  min-height: 100vh;
  margin: 0 auto;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  position: relative;
}

@media (min-width: 431px) {
  .app {
    box-shadow: 0 0 0 1px #333, 0 20px 60px rgba(0,0,0,0.8);
    min-height: 100vh;
  }
}

/* Tab bar */
.tab-bar {
  display: flex;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-btn {
  flex: 1;
  padding: 14px 0;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  font-family: var(--font);
}

.tab-btn.active {
  color: var(--green);
  border-bottom-color: var(--green);
}

/* Scrollable content area */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* Form labels */
.field-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 4px;
}

/* Text inputs */
.text-input {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 12px;
  color: var(--text);
  font-size: 15px;
  font-family: var(--font);
  outline: none;
  transition: border-color 0.15s;
}

.text-input:focus {
  border-color: var(--green);
}

.text-input::placeholder {
  color: #4b5563;
}

/* Field group spacing */
.field {
  margin-bottom: 12px;
}

/* Date group card */
.date-group-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  margin-bottom: 12px;
}

.date-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.date-group-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--green);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Activity card */
.activity-card {
  background: var(--bg);
  border: 1px solid #2d3748;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.activity-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Participant rows */
.participant-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.participant-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1a2e20;
  border-radius: 6px;
  padding: 10px 12px;
  min-height: 44px;
}

.participant-name {
  color: var(--green);
  font-size: 14px;
  flex: 1;
}

.participant-remove {
  background: none;
  border: none;
  color: var(--danger);
  font-size: 20px;
  cursor: pointer;
  padding: 0 0 0 16px;
  line-height: 1;
  min-width: 44px;
  text-align: right;
  font-family: var(--font);
}

.add-participant-row {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.add-participant-input {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
  color: var(--text);
  font-size: 14px;
  font-family: var(--font);
  outline: none;
}

.add-participant-input:focus {
  border-color: var(--green);
}

.add-participant-btn {
  background: var(--green);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font);
  white-space: nowrap;
}

/* Dashed add buttons */
.dashed-btn {
  width: 100%;
  background: none;
  border: 1px dashed var(--border);
  border-radius: 6px;
  padding: 10px;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  text-align: center;
  font-family: var(--font);
  transition: border-color 0.15s, color 0.15s;
}

.dashed-btn.primary {
  border-color: var(--green);
  color: var(--green);
}

.dashed-btn:hover {
  border-color: var(--green);
  color: var(--green);
}

/* Link-style danger button */
.link-danger {
  background: none;
  border: none;
  color: var(--danger);
  font-size: 12px;
  cursor: pointer;
  font-family: var(--font);
  padding: 0;
}

/* Footer buttons */
.footer-buttons {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.btn {
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font);
  transition: opacity 0.15s;
}

.btn:active {
  opacity: 0.75;
}

.btn-clear {
  flex: 1;
  background: var(--surface);
  color: var(--danger);
  border: 1px solid var(--border);
}

.btn-copy {
  flex: 2;
  background: var(--green);
  color: #fff;
}

/* WhatsApp Preview */
.preview-tab {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 50px);
  padding: 0;
}

.wpp-chat {
  flex: 1;
  background: var(--wpp-bg);
  padding: 16px 12px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.wpp-bubble {
  background: var(--green-bubble);
  color: #e9edef;
  border-radius: 8px 0 8px 8px;
  padding: 8px 10px 6px;
  max-width: 90%;
  font-size: 14px;
  line-height: 1.6;
  font-family: var(--font);
  position: relative;
  word-break: break-word;
}

.wpp-bubble-time {
  text-align: right;
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  margin-top: 4px;
}

.preview-footer {
  padding: 12px;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Char counter */
.char-counter {
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
}

.char-counter.ok {
  background: #0d2a18;
  color: var(--green);
  border: 1px solid #1a4a2a;
}

.char-counter.warn {
  background: #2a1f00;
  color: #f59e0b;
  border: 1px solid #4a3500;
}

.char-counter.over {
  background: #2a0d0d;
  color: var(--danger);
  border: 1px solid #4a1a1a;
}
```

- [ ] **Step 2: Create `src/components/TabBar.tsx`**

```typescript
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
```

- [ ] **Step 3: Replace `src/App.tsx` with the shell (tabs + placeholder content)**

```typescript
import { useState, useEffect } from 'react'
import './App.css'
import { AppState, defaultState } from './types'
import { loadState, saveState, clearState } from './utils/storage'
import { TabBar } from './components/TabBar'

export default function App() {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [state, setState] = useState<AppState>(() => loadState() ?? defaultState)

  useEffect(() => {
    const timer = setTimeout(() => saveState(state), 300)
    return () => clearTimeout(timer)
  }, [state])

  return (
    <div className="app">
      <TabBar active={tab} onChange={setTab} />
      <div className="tab-content">
        {tab === 'edit' ? (
          <p style={{ color: 'var(--muted)' }}>Editor — em breve</p>
        ) : (
          <p style={{ color: 'var(--muted)' }}>Preview — em breve</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Replace `src/main.tsx`**

Verify `src/main.tsx` imports `App` and `./index.css`. If the scaffold produced:

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Leave it as-is.

- [ ] **Step 5: Run dev server and verify**

```bash
npm run dev
```

Expected: browser shows two tabs "Editar" / "Preview" with placeholder text. Phone frame (max 430px) visible on desktop.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add global styles, phone frame, App shell and TabBar"
```

---

## Task 7: ParticipantList component

**Files:**
- Create: `src/components/ParticipantList.tsx`

- [ ] **Step 1: Create `src/components/ParticipantList.tsx`**

```typescript
import { useState, KeyboardEvent } from 'react'

interface ParticipantListProps {
  participants: string[]
  onAdd: (name: string) => void
  onRemove: (index: number) => void
}

export function ParticipantList({ participants, onAdd, onRemove }: ParticipantListProps) {
  const [input, setInput] = useState('')

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

  return (
    <div>
      <div className="field-label">Participantes</div>
      <div className="participant-list">
        {participants.map((name, i) => (
          <div key={i} className="participant-row">
            <span className="participant-name">{name}</span>
            <button
              className="participant-remove"
              onClick={() => onRemove(i)}
              aria-label={`Remover ${name}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="add-participant-row">
        <input
          className="add-participant-input"
          placeholder="nome do participante"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="add-participant-btn" onClick={handleAdd}>
          Adicionar
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ParticipantList.tsx
git commit -m "feat: add ParticipantList component"
```

---

## Task 8: ActivityCard component

**Files:**
- Create: `src/components/ActivityCard.tsx`

- [ ] **Step 1: Create `src/components/ActivityCard.tsx`**

```typescript
import { Activity } from '../types'
import { ParticipantList } from './ParticipantList'

interface ActivityCardProps {
  activity: Activity
  index: number
  onRemove: () => void
  onNameChange: (name: string) => void
  onObservationChange: (observation: string) => void
  onAddParticipant: (name: string) => void
  onRemoveParticipant: (index: number) => void
}

export function ActivityCard({
  activity,
  index,
  onRemove,
  onNameChange,
  onObservationChange,
  onAddParticipant,
  onRemoveParticipant,
}: ActivityCardProps) {
  return (
    <div className="activity-card">
      <div className="activity-header">
        <span className="activity-title">Atividade {index + 1}</span>
        <button className="link-danger" onClick={onRemove}>remover</button>
      </div>

      <div className="field">
        <div className="field-label">Nome</div>
        <input
          className="text-input"
          placeholder="ex: 🆙 Brigada Operária"
          value={activity.name}
          onChange={e => onNameChange(e.target.value)}
        />
      </div>

      <div className="field">
        <div className="field-label">Observação</div>
        <input
          className="text-input"
          placeholder="ex: às 7h30 na Embapack, Rua X, nº 10"
          value={activity.observation}
          onChange={e => onObservationChange(e.target.value)}
        />
      </div>

      <ParticipantList
        participants={activity.participants}
        onAdd={onAddParticipant}
        onRemove={onRemoveParticipant}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ActivityCard.tsx
git commit -m "feat: add ActivityCard component"
```

---

## Task 9: DateGroupCard component

**Files:**
- Create: `src/components/DateGroupCard.tsx`

- [ ] **Step 1: Create `src/components/DateGroupCard.tsx`**

```typescript
import { DateGroup } from '../types'
import { ActivityCard } from './ActivityCard'

interface DateGroupCardProps {
  group: DateGroup
  index: number
  onRemove: () => void
  onDateChange: (date: string) => void
  onAddActivity: () => void
  onRemoveActivity: (activityId: string) => void
  onActivityNameChange: (activityId: string, name: string) => void
  onActivityObservationChange: (activityId: string, observation: string) => void
  onAddParticipant: (activityId: string, name: string) => void
  onRemoveParticipant: (activityId: string, index: number) => void
}

export function DateGroupCard({
  group,
  index,
  onRemove,
  onDateChange,
  onAddActivity,
  onRemoveActivity,
  onActivityNameChange,
  onActivityObservationChange,
  onAddParticipant,
  onRemoveParticipant,
}: DateGroupCardProps) {
  return (
    <div className="date-group-card">
      <div className="date-group-header">
        <span className="date-group-title">Data {index + 1}</span>
        <button className="link-danger" onClick={onRemove}>remover</button>
      </div>

      <div className="field">
        <div className="field-label">Data</div>
        <input
          className="text-input"
          placeholder="ex: 27/5 Quarta-feira"
          value={group.date}
          onChange={e => onDateChange(e.target.value)}
        />
      </div>

      {group.activities.map((activity, ai) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          index={ai}
          onRemove={() => onRemoveActivity(activity.id)}
          onNameChange={name => onActivityNameChange(activity.id, name)}
          onObservationChange={obs => onActivityObservationChange(activity.id, obs)}
          onAddParticipant={name => onAddParticipant(activity.id, name)}
          onRemoveParticipant={i => onRemoveParticipant(activity.id, i)}
        />
      ))}

      <button className="dashed-btn" onClick={onAddActivity}>
        + Adicionar atividade
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DateGroupCard.tsx
git commit -m "feat: add DateGroupCard component"
```

---

## Task 10: EditorTab component

**Files:**
- Create: `src/components/EditorTab.tsx`

- [ ] **Step 1: Create `src/components/EditorTab.tsx`**

```typescript
import { useState } from 'react'
import { AppState } from '../types'
import { DateGroupCard } from './DateGroupCard'

interface EditorTabProps {
  state: AppState
  onTitleChange: (title: string) => void
  onAddDateGroup: () => void
  onRemoveDateGroup: (groupId: string) => void
  onDateChange: (groupId: string, date: string) => void
  onAddActivity: (groupId: string) => void
  onRemoveActivity: (groupId: string, activityId: string) => void
  onActivityNameChange: (groupId: string, activityId: string, name: string) => void
  onActivityObservationChange: (groupId: string, activityId: string, observation: string) => void
  onAddParticipant: (groupId: string, activityId: string, name: string) => void
  onRemoveParticipant: (groupId: string, activityId: string, index: number) => void
  onClear: () => void
  onCopy: () => void
  copyLabel: string
}

export function EditorTab({
  state,
  onTitleChange,
  onAddDateGroup,
  onRemoveDateGroup,
  onDateChange,
  onAddActivity,
  onRemoveActivity,
  onActivityNameChange,
  onActivityObservationChange,
  onAddParticipant,
  onRemoveParticipant,
  onClear,
  onCopy,
  copyLabel,
}: EditorTabProps) {
  const [confirmingClear, setConfirmingClear] = useState(false)

  function handleClearClick() {
    if (confirmingClear) {
      onClear()
      setConfirmingClear(false)
    } else {
      setConfirmingClear(true)
      setTimeout(() => setConfirmingClear(false), 3000)
    }
  }

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

      {state.dateGroups.map((group, gi) => (
        <DateGroupCard
          key={group.id}
          group={group}
          index={gi}
          onRemove={() => onRemoveDateGroup(group.id)}
          onDateChange={date => onDateChange(group.id, date)}
          onAddActivity={() => onAddActivity(group.id)}
          onRemoveActivity={aid => onRemoveActivity(group.id, aid)}
          onActivityNameChange={(aid, name) => onActivityNameChange(group.id, aid, name)}
          onActivityObservationChange={(aid, obs) => onActivityObservationChange(group.id, aid, obs)}
          onAddParticipant={(aid, name) => onAddParticipant(group.id, aid, name)}
          onRemoveParticipant={(aid, i) => onRemoveParticipant(group.id, aid, i)}
        />
      ))}

      <button className="dashed-btn primary" style={{ marginBottom: 16 }} onClick={onAddDateGroup}>
        + Adicionar data
      </button>

      <div className="footer-buttons">
        <button className="btn btn-clear" onClick={handleClearClick}>
          {confirmingClear ? 'Tem certeza?' : 'Limpar tudo'}
        </button>
        <button className="btn btn-copy" onClick={onCopy}>
          {copyLabel}
        </button>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/EditorTab.tsx
git commit -m "feat: add EditorTab component with clear confirmation"
```

---

## Task 11: Preview components

**Files:**
- Create: `src/components/CharCounter.tsx`
- Create: `src/components/WhatsAppBubble.tsx`
- Create: `src/components/PreviewTab.tsx`

- [ ] **Step 1: Create `src/components/CharCounter.tsx`**

```typescript
const LIMIT = 700
const WARN_AT = 600

interface CharCounterProps {
  count: number
}

export function CharCounter({ count }: CharCounterProps) {
  let cls = 'char-counter ok'
  let msg = `${count} caracteres — dentro do limite`

  if (count > LIMIT) {
    cls = 'char-counter over'
    msg = `${count} caracteres — WhatsApp vai exibir "Ver mais" (limite: ${LIMIT})`
  } else if (count >= WARN_AT) {
    cls = 'char-counter warn'
    msg = `${count} caracteres — atenção: próximo do limite (${LIMIT})`
  }

  return <div className={cls}>{msg}</div>
}
```

- [ ] **Step 2: Create `src/components/WhatsAppBubble.tsx`**

```typescript
import { renderToHtml } from '../utils/whatsappRenderer'

interface WhatsAppBubbleProps {
  message: string
}

export function WhatsAppBubble({ message }: WhatsAppBubbleProps) {
  const html = renderToHtml(message)

  return (
    <div className="wpp-bubble">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <div className="wpp-bubble-time">14:32 ✓✓</div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/PreviewTab.tsx`**

```typescript
import { AppState } from '../types'
import { formatMessage } from '../utils/messageFormatter'
import { WhatsAppBubble } from './WhatsAppBubble'
import { CharCounter } from './CharCounter'

interface PreviewTabProps {
  state: AppState
  onCopy: () => void
  copyLabel: string
}

export function PreviewTab({ state, onCopy, copyLabel }: PreviewTabProps) {
  const message = formatMessage(state)

  return (
    <div className="preview-tab">
      <div className="wpp-chat">
        <WhatsAppBubble message={message} />
      </div>
      <div className="preview-footer">
        <CharCounter count={message.length} />
        <button className="btn btn-copy" style={{ width: '100%' }} onClick={onCopy}>
          {copyLabel}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/
git commit -m "feat: add CharCounter, WhatsAppBubble, and PreviewTab components"
```

---

## Task 12: Wire App.tsx with all handlers

**Files:**
- Modify: `src/App.tsx` (replace shell placeholder with full implementation)

- [ ] **Step 1: Replace `src/App.tsx`**

```typescript
import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { AppState, DateGroup, Activity, defaultState, genId } from './types'
import { loadState, saveState, clearState } from './utils/storage'
import { formatMessage } from './utils/messageFormatter'
import { TabBar } from './components/TabBar'
import { EditorTab } from './components/EditorTab'
import { PreviewTab } from './components/PreviewTab'

export default function App() {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [state, setState] = useState<AppState>(() => loadState() ?? defaultState)
  const [copyLabel, setCopyLabel] = useState('Copiar mensagem')

  useEffect(() => {
    const timer = setTimeout(() => saveState(state), 300)
    return () => clearTimeout(timer)
  }, [state])

  const handleCopy = useCallback(() => {
    const text = formatMessage(state)
    navigator.clipboard.writeText(text).then(() => {
      setCopyLabel('Copiado!')
      setTimeout(() => setCopyLabel('Copiar mensagem'), 2000)
    })
  }, [state])

  const handleClear = useCallback(() => {
    setState(defaultState)
    clearState()
  }, [])

  const handleTitleChange = useCallback((title: string) => {
    setState(s => ({ ...s, title }))
  }, [])

  const handleAddDateGroup = useCallback(() => {
    const group: DateGroup = { id: genId(), date: '', activities: [] }
    setState(s => ({ ...s, dateGroups: [...s.dateGroups, group] }))
  }, [])

  const handleRemoveDateGroup = useCallback((groupId: string) => {
    setState(s => ({ ...s, dateGroups: s.dateGroups.filter(g => g.id !== groupId) }))
  }, [])

  const handleDateChange = useCallback((groupId: string, date: string) => {
    setState(s => ({
      ...s,
      dateGroups: s.dateGroups.map(g => g.id === groupId ? { ...g, date } : g),
    }))
  }, [])

  const handleAddActivity = useCallback((groupId: string) => {
    const activity: Activity = { id: genId(), name: '', observation: '', participants: [] }
    setState(s => ({
      ...s,
      dateGroups: s.dateGroups.map(g =>
        g.id === groupId ? { ...g, activities: [...g.activities, activity] } : g
      ),
    }))
  }, [])

  const handleRemoveActivity = useCallback((groupId: string, activityId: string) => {
    setState(s => ({
      ...s,
      dateGroups: s.dateGroups.map(g =>
        g.id === groupId
          ? { ...g, activities: g.activities.filter(a => a.id !== activityId) }
          : g
      ),
    }))
  }, [])

  function updateActivity(groupId: string, activityId: string, patch: Partial<Activity>) {
    setState(s => ({
      ...s,
      dateGroups: s.dateGroups.map(g =>
        g.id === groupId
          ? {
              ...g,
              activities: g.activities.map(a =>
                a.id === activityId ? { ...a, ...patch } : a
              ),
            }
          : g
      ),
    }))
  }

  const handleActivityNameChange = useCallback((groupId: string, activityId: string, name: string) => {
    updateActivity(groupId, activityId, { name })
  }, [])

  const handleActivityObservationChange = useCallback((groupId: string, activityId: string, observation: string) => {
    updateActivity(groupId, activityId, { observation })
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
            onTitleChange={handleTitleChange}
            onAddDateGroup={handleAddDateGroup}
            onRemoveDateGroup={handleRemoveDateGroup}
            onDateChange={handleDateChange}
            onAddActivity={handleAddActivity}
            onRemoveActivity={handleRemoveActivity}
            onActivityNameChange={handleActivityNameChange}
            onActivityObservationChange={handleActivityObservationChange}
            onAddParticipant={handleAddParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onClear={handleClear}
            onCopy={handleCopy}
            copyLabel={copyLabel}
          />
        </div>
      ) : (
        <PreviewTab
          state={state}
          onCopy={handleCopy}
          copyLabel={copyLabel}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run dev server and smoke test manually**

```bash
npm run dev
```

Verify:
1. Add a date group → appears in form
2. Add an activity inside the date group → form fields appear
3. Type in nome and observação → live update
4. Add participants → rows appear with large ✕
5. Switch to Preview tab → bubble shows formatted message
6. Character counter shows correct count
7. Click "Copiar mensagem" → paste in text editor → format matches `wpp_messages_example.txt`
8. Click "Limpar tudo" → button changes to "Tem certeza?" → click again → form cleared
9. Refresh page → form state restored from localStorage

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire App with full state handlers and localStorage sync"
```

---

## Task 13: Serverless deployment config

**Files:**
- Create: `serverless.yml`

- [ ] **Step 1: Install serverless-s3-sync**

```bash
npm install --save-dev serverless serverless-s3-sync
```

- [ ] **Step 2: Create `serverless.yml`**

```yaml
service: wpp-template

frameworkVersion: '3'

provider:
  name: aws
  region: us-east-1

plugins:
  - serverless-s3-sync

custom:
  bucketName: wpp-template-${sls:stage}
  s3Sync:
    - bucketName: ${self:custom.bucketName}
      localDir: dist
      deleteRemoved: true
      acl: public-read
      defaultContentType: text/html

resources:
  Resources:
    StaticSiteBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${self:custom.bucketName}
        WebsiteConfiguration:
          IndexDocument: index.html
          ErrorDocument: index.html
        PublicAccessBlockConfiguration:
          BlockPublicAcls: false
          BlockPublicPolicy: false
          IgnorePublicAcls: false
          RestrictPublicBuckets: false

    BucketPolicy:
      Type: AWS::S3::BucketPolicy
      Properties:
        Bucket: !Ref StaticSiteBucket
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Principal: '*'
              Action: s3:GetObject
              Resource: !Sub '${StaticSiteBucket.Arn}/*'

  Outputs:
    WebsiteURL:
      Value: !GetAtt StaticSiteBucket.WebsiteURL
      Description: S3 static website URL
```

- [ ] **Step 3: Commit**

```bash
git add serverless.yml package.json package-lock.json
git commit -m "feat: add Serverless Framework v3 config for S3 static hosting"
```

---

## Task 14: GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to S3

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to S3
        run: npx serverless deploy --stage prod --verbose
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ID }}
```

- [ ] **Step 2: Add `.superpowers/` to `.gitignore`**

Append to `.gitignore` (create it if absent):

```
# Superpowers brainstorming sessions
.superpowers/
```

- [ ] **Step 3: Commit**

```bash
git add .github/ .gitignore
git commit -m "feat: add GitHub Actions CI/CD pipeline for S3 deploy"
```

---

## Task 15: Final verification

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: all tests pass with no failures.

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: `dist/` folder created with `index.html` and hashed assets. No TypeScript or build errors.

- [ ] **Step 3: Preview build locally**

```bash
npm run preview
```

Open the printed URL and verify:
- Form works end-to-end (add date group → activity → participants → copy)
- Preview tab shows WhatsApp-style bubble
- Character warning appears when message exceeds 700 chars (fill in many activities to test)
- Refreshing restores form state
- "Limpar tudo" clears everything including localStorage (verify via DevTools → Application → localStorage)

- [ ] **Step 4: Add GitHub secrets**

In the GitHub repo settings → Secrets and variables → Actions, add:
- `AWS_ACCESS_ID` — AWS access key ID
- `AWS_SECRET_ID` — AWS secret access key

- [ ] **Step 5: Push to trigger deploy**

```bash
git push origin main
```

Watch GitHub Actions run. After completion, the `WebsiteURL` output from `serverless deploy` gives the S3 URL. Open it on mobile to verify the layout.
