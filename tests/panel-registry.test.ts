import { describe, it, expect } from 'vitest'
import { getPanels } from '../lib/panels'

// Ensure that the panel registry loads all panels and provides a Component
// for each entry.
describe('panel registry', () => {
  it('loads all configured panels', async () => {
    const panels = await getPanels()
    expect(panels).toHaveLength(7)
    for (const panel of panels) {
      expect(panel.id).toBeTruthy()
      expect(panel.title).toBeTruthy()
      expect(typeof panel.Component).toBe('function')
    }
  })
})
