export interface CalendarEvent {
  id: string
  title?: string
  start: string
  end?: string
}

export let events: CalendarEvent[] = [
  { id: '1', title: 'Sample Event', start: new Date().toISOString().substring(0, 10) },
]

