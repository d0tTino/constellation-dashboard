import React from 'react'
import ReactDOM from 'react-dom/client'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from 'react-dom/test-utils'
import CalendarLayerPanel from '../app/components/CalendarLayerPanel'

function render(ui: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = ReactDOM.createRoot(container)
  act(() => {
    root.render(ui)
  })
  return { container, root }
}

describe('CalendarLayerPanel', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('reflects initial selection state from props', () => {
    const layers = [
      { id: '1', name: 'One', color: '#111111' },
      { id: '2', name: 'Two', color: '#222222' },
    ]
    render(
      <CalendarLayerPanel layers={layers} selected={['1']} onToggle={() => {}} />
    )
    const checkboxes = Array.from(
      document.querySelectorAll('input[type="checkbox"]')
    ) as HTMLInputElement[]
    expect(checkboxes[0].checked).toBe(true)
    expect(checkboxes[1].checked).toBe(false)
  })

  it('calls onToggle with correct layer id when checkbox toggled', () => {
    const layers = [
      { id: '1', name: 'One', color: '#111111' },
      { id: '2', name: 'Two', color: '#222222' },
    ]
    const onToggle = vi.fn()
    render(
      <CalendarLayerPanel layers={layers} selected={[]} onToggle={onToggle} />
    )
    const checkboxes = Array.from(
      document.querySelectorAll('input[type="checkbox"]')
    ) as HTMLInputElement[]
    act(() => {
      checkboxes[0].click()
      checkboxes[1].click()
    })
    expect(onToggle).toHaveBeenNthCalledWith(1, '1')
    expect(onToggle).toHaveBeenNthCalledWith(2, '2')
  })
})
