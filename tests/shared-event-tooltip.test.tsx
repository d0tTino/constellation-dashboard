import React from 'react'
import ReactDOM from 'react-dom/client'
import { describe, it, expect, beforeEach } from 'vitest'
import { act } from 'react-dom/test-utils'
import SharedEventTooltip from '../app/components/SharedEventTooltip'

function render(ui: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = ReactDOM.createRoot(container)
  act(() => {
    root.render(ui)
  })
  return { container, root }
}

describe('SharedEventTooltip', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('shows tooltip with invitees and permissions on hover', () => {
    render(
      <SharedEventTooltip invitees={['Alice', 'Bob']} permissions={['view', 'edit']}>
        <span>Event</span>
      </SharedEventTooltip>
    )
    const trigger = document.querySelector('div[tabindex="0"]') as HTMLElement
    act(() => {
      trigger.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })
    const tooltip = document.querySelector('[role="tooltip"]') as HTMLElement
    expect(tooltip).toBeTruthy()
    expect(tooltip.textContent).toContain('Invitees: Alice, Bob')
    expect(tooltip.textContent).toContain('Permissions: view, edit')
    expect(tooltip.getAttribute('role')).toBe('tooltip')
  })
})

