export interface Activity {
  id: string
  name: string
  time: string
  location: string
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
  title: 'Calendário de Lutas da semana',
  dateGroups: [],
}
