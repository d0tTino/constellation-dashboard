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

vi.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: (props: any) => {
    const arg = {
      event: {
        title: 'Meeting',
        extendedProps: {
          invitees: ['Alice', 'Bob'],
          permissions: ['view', 'edit'],
          shared: true,
        },
      },
      view: { type: 'timeGridWeek' },
    }
    const node = props.eventContent(arg)
    return React.createElement('div', null, node)
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

describe('ScheduleCalendar accessibility', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('shows tooltip with invitees and permissions', () => {
    render(<ScheduleCalendar events={[]} layers={[]} visibleLayers={[]} mutate={() => {}} />)
    const wrapper = document.querySelector('div[tabindex="0"]') as HTMLElement
    act(() => {
      wrapper.focus()
    })
    const tooltip = document.querySelector('[role="tooltip"]') as HTMLElement
    expect(tooltip).toBeTruthy()
    expect(tooltip.textContent).toContain('Invitees: Alice, Bob')
    expect(tooltip.textContent).toContain('Permissions: view, edit')
  })
})

