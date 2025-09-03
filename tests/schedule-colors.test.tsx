import React from 'react'
import ReactDOM from 'react-dom/client'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from 'react-dom/test-utils'
import ScheduleCalendar from '../app/components/ScheduleCalendar'

vi.mock('../app/socket-context', () => ({
  __esModule: true,
  useCalendarEvents: () => null,
  useTaskStatus: () => null,
  useSocketStatus: () => ({ connectionState: 'open', lastError: null, retry: () => {} }),
}))

let capturedEvents: any[] = []
let capturedEventDidMount: any = null
vi.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: (props: any) => {
    capturedEvents = props.events
    capturedEventDidMount = props.eventDidMount
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

describe('ScheduleCalendar color scheme', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    capturedEvents = []
    capturedEventDidMount = null
  })

  it('uses layer colors for background and user colors separately', () => {
    const layers = [{ id: 'l1', name: 'Layer 1', color: '#f00' }]
    const events = [
      { id: 'e1', title: 'Event', start: '2024-05-20T10:00:00', layer: 'l1', owner: 'alice' },
    ]
    render(<ScheduleCalendar events={events} layers={layers} visibleLayers={['l1']} mutate={() => {}} />)
    const event = capturedEvents.find((e: any) => e.id === 'e1')
    expect(event.layerColor).toBe('#f00')
    expect(event.backgroundColor).toBe('#f00')
    expect(event.borderColor).toBe('#f00')
    expect(event.userColor).toBe('#1f77b4')
  })

  it('applies shared border class', () => {
    const layers: any[] = []
    const events = [
      { id: 'e2', title: 'Shared', start: '2024-05-20T10:00:00', shared: true },
    ]
    render(<ScheduleCalendar events={events} layers={layers} visibleLayers={[]} mutate={() => {}} />)
    const el = document.createElement('div')
    const event = capturedEvents.find((e: any) => e.id === 'e2')
    capturedEventDidMount({ event: { extendedProps: event }, el, view: { type: 'timeGridWeek' } })
    expect(el.classList.contains('border-blue-500')).toBe(true)
  })
})
