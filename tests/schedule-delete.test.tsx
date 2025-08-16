import React from 'react'
import ReactDOM from 'react-dom/client'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from 'react-dom/test-utils'
import ScheduleCalendar from '../app/components/ScheduleCalendar'

let calendarProps: any

vi.mock('../app/socket-context', () => ({
  __esModule: true,
  useCalendarEvents: () => null,
  useTaskStatus: () => null,
  useSocketStatus: () => ({ connectionState: 'open', lastError: null, retry: () => {} }),
}))

vi.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: (props: any) => {
    calendarProps = props
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

describe('ScheduleCalendar delete', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    calendarProps = {}
  })

  const layers = [{ id: 'l1', name: 'Layer 1', color: '#f00' }]
  const events = [{ id: 'e1', title: 'Event', start: '2024-05-20T10:00:00', layer: 'l1' }]

  it('deletes events and refreshes list', async () => {
    const mutate = vi.fn()
    global.fetch = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }))) as any
    const { container } = render(<ScheduleCalendar events={events} layers={layers} visibleLayers={['l1']} mutate={mutate} />)

    act(() => {
      calendarProps.dateClick({ date: new Date('2024-05-20') })
    })

    const cell = calendarProps.dayCellContent({ date: new Date('2024-05-20'), dayNumberText: '20' })
    const cellContainer = document.createElement('div')
    const cellRoot = ReactDOM.createRoot(cellContainer)
    act(() => {
      cellRoot.render(cell)
    })
    const btn = cellContainer.querySelector('button') as HTMLButtonElement
    expect(btn).toBeTruthy()
    await act(async () => {
      btn.click()
    })
    expect(global.fetch).toHaveBeenCalledWith('/api/task/e1', { method: 'DELETE' })
    expect(mutate).toHaveBeenCalled()
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('shows error when delete fails', async () => {
    const mutate = vi.fn()
    global.fetch = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ error: 'Nope' }), { status: 500 }))) as any
    const { container } = render(<ScheduleCalendar events={events} layers={layers} visibleLayers={['l1']} mutate={mutate} />)

    act(() => {
      calendarProps.dateClick({ date: new Date('2024-05-20') })
    })
    const cell = calendarProps.dayCellContent({ date: new Date('2024-05-20'), dayNumberText: '20' })
    const cellContainer = document.createElement('div')
    const cellRoot = ReactDOM.createRoot(cellContainer)
    act(() => {
      cellRoot.render(cell)
    })
    const btn = cellContainer.querySelector('button') as HTMLButtonElement
    await act(async () => {
      btn.click()
    })
    const alert = container.querySelector('[role="alert"]') as HTMLElement
    expect(alert.textContent).toBe('Nope')
    expect(mutate).not.toHaveBeenCalled()
  })
})

