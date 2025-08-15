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

let eventContent: any
vi.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: (props: any) => {
    eventContent = props.eventContent
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

describe('ScheduleCalendar tooltip', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    eventContent = null
  })

  it('renders tooltip with invitees and permissions', () => {
    const events = [
      {
        id: '1',
        title: 'Meeting',
        start: '2024-05-20T10:00:00',
        invitees: ['Alice'],
        permissions: ['view'],
      },
    ]
    render(<ScheduleCalendar events={events} layers={[]} visibleLayers={[]} mutate={() => {}} />)
    const arg = {
      event: { title: 'Meeting', extendedProps: events[0] },
      view: { type: 'timeGridWeek' },
    } as any
    const result = eventContent(arg)
    const container = document.createElement('div')
    act(() => {
      ReactDOM.createRoot(container).render(result)
    })
    const trigger = container.querySelector('div[tabindex="0"]') as HTMLElement
    expect(trigger).toBeTruthy()
    act(() => {
      trigger.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })
    const tooltip = container.querySelector('[role="tooltip"]') as HTMLElement
    expect(tooltip.textContent).toContain('Invitees: Alice')
    expect(tooltip.textContent).toContain('Permissions: view')
  })
})

