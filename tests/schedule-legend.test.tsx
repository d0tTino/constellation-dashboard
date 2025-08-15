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

vi.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: () => React.createElement('div')
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

describe('ScheduleCalendar user legend', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('displays legend entries for event owners', () => {
    const events = [
      { id: '1', title: 'A', start: '2024-05-20T10:00:00', owner: 'alice' },
      { id: '2', title: 'B', start: '2024-05-21T10:00:00', owner: 'bob' },
    ]
    render(<ScheduleCalendar events={events} layers={[]} visibleLayers={[]} mutate={() => {}} />)
    const legend = document.querySelector('[aria-label="User color legend"]') as HTMLElement
    expect(legend).toBeTruthy()
    expect(legend.textContent).toContain('AL')
    expect(legend.textContent).toContain('BO')
  })
})
