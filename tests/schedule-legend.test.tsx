import React from 'react'
import ReactDOM from 'react-dom/client'
import { describe, it, expect, beforeEach } from 'vitest'
import { act } from 'react-dom/test-utils'
import CalendarLayerPanel from '../app/components/CalendarLayerPanel'
import useUserColors from '../lib/hooks/useUserColors'

function render(ui: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = ReactDOM.createRoot(container)
  act(() => {
    root.render(ui)
  })
  return { container, root }
}

describe('Sidebar legends', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('displays layer and user legends', () => {
    const layers = [{ id: 'l1', name: 'Layer 1', color: '#f00' }]
    const TestComponent = () => {
      const userColors = useUserColors([{ owner: 'alice' } as any])
      return (
        <CalendarLayerPanel
          layers={layers}
          selected={['l1']}
          onToggle={() => {}}
          userColors={userColors}
        />
      )
    }
    render(<TestComponent />)
    const layerLegend = document.querySelector('[aria-label="Layer color legend"]') as HTMLElement
    expect(layerLegend).toBeTruthy()
    expect(layerLegend.textContent).toContain('Layer 1')
    const userLegend = document.querySelector('[aria-label="User color legend"]') as HTMLElement
    expect(userLegend).toBeTruthy()
    expect(userLegend.textContent).toContain('AL')
  })
})

