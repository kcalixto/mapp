const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export const isIsoDate = (s: string): boolean => ISO_DATE.test(s)

const pad = (n: number) => String(n).padStart(2, '0')

/** Today's local date as ISO "YYYY-MM-DD". */
export function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * ISO "2026-05-27" → "27/5 Quarta-feira" (pt-BR). Anything else passes through
 * unchanged so legacy free-text dates keep rendering as typed.
 */
/**
 * ISO "2026-05-27" + n days → ISO. Non-ISO input passes through unchanged so
 * callers ("Nova semana", duplicate day) don't need to guard legacy dates.
 */
export function addDaysIso(s: string, days: number): string {
  if (!isIsoDate(s)) return s
  const [y, m, d] = s.split('-').map(Number)
  const date = new Date(y, m - 1, d + days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatDateDisplay(s: string): string {
  if (!isIsoDate(s)) return s
  const [y, m, d] = s.split('-').map(Number)
  // Construct from parts: new Date('YYYY-MM-DD') parses as UTC midnight and
  // shifts a day back in UTC-3.
  const date = new Date(y, m - 1, d)
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date)
  return `${d}/${m} ${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`
}
