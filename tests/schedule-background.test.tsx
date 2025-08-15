import React from 'react'
import ReactDOM from 'react-dom/client'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from 'react-dom/test-utils'
import ScheduleCalendar from '../app/components/ScheduleCalendar'

vi.mock('../app/socket-context', () => ({
  __esModule: true,
  useCalendarEvents: () => null,
  useTaskStatus: () => null,
}))

let capturedEvents: any[] = []
vi.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: (props: any) => {
    capturedEvents = props.events
    return React.createElement('div')
  },
}))

function render(ui: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = ReactDOM.createRoot(container)
  act(() => {
    root.render(ui)
  })
  return { container, root }
}

describe('ScheduleCalendar background events', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    capturedEvents = []
  })

  const layers = [{ id: 'l1', name: 'Layer 1', color: '#f00' }]
  const events = [{ id: 'e1', title: 'Event', start: '2024-05-20T10:00:00', layer: 'l1' }]

  it('creates background events for visible layers', () => {
    render(<ScheduleCalendar events={events} layers={layers} visibleLayers={['l1']} mutate={() => {}} />)
    const bg = capturedEvents.find(e => e.display === 'background')
    expect(bg).toBeTruthy()
    expect(bg.start).toBe('2024-05-20')
    expect(bg.end).toBe('2024-05-21')
  })

  it('does not create background events for hidden layers', () => {
    render(<ScheduleCalendar events={events} layers={layers} visibleLayers={[]} mutate={() => {}} />)
    expect(capturedEvents.some(e => e.display === 'background')).toBe(false)
  })
})
