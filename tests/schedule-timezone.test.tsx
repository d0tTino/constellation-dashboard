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

const dayCells: Record<string, React.ReactElement> = {}
vi.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: (props: any) => {
    dayCells['2024-05-20'] = props.dayCellContent({ date: new Date(2024, 4, 20), dayNumberText: '20' })
    dayCells['2024-05-21'] = props.dayCellContent({ date: new Date(2024, 4, 21), dayNumberText: '21' })
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

describe('ScheduleCalendar timezone handling', () => {
  beforeEach(() => {
    process.env.TZ = 'America/Los_Angeles'
    document.body.innerHTML = ''
    for (const key of Object.keys(dayCells)) delete dayCells[key]
  })

  it('renders event near midnight on correct local day', () => {
    const events = [{ id: 'e1', title: 'Late', start: '2024-05-21T06:30:00Z' }]
    render(<ScheduleCalendar events={events} layers={[]} visibleLayers={[]} mutate={() => {}} />)
    const cell20 = dayCells['2024-05-20']
    const cell21 = dayCells['2024-05-21']
    expect(cell20).toBeTruthy()
    expect(cell21).toBeTruthy()
    const { container: c20 } = render(cell20 as React.ReactElement)
    const { container: c21 } = render(cell21 as React.ReactElement)
    expect(c20.firstChild?.getAttribute('title')).toBe('1 events')
    expect(c21.firstChild?.getAttribute('title')).toBe('0 events')
  })
})
