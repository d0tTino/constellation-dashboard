import { describe, it, expect } from 'vitest'
import { getPanels } from '../lib/panels'

// Ensure that the panel registry loads all panels and provides a Component
// for each entry.
describe('panel registry', () => {
  it('loads all configured panels', async () => {
    const panels = await getPanels()
    expect(panels).toHaveLength(8)
    for (const panel of panels) {
      expect(panel.id).toBeTruthy()
      expect(panel.title).toBeTruthy()
      expect(typeof panel.Component).toBe('function')
    }
  })

  it('returns metadata for each known panel', async () => {
    const panels = await getPanels()
    const ids = panels.map(p => p.id)
    const titles = panels.map(p => p.title)
    expect(ids).toEqual([
      'home',
      'about',
      'calendar',
      'finance',
      'invest',
      'idea-garden',
      'memory-graph',
      'settings',
    ])
    expect(titles).toEqual([
      'Home Panel',
      'About Panel',
      'Calendar Panel',
      'Finance Panel',
      'Invest Panel',
      'Idea Garden Panel',
      'Memory Graph Panel',
      'Settings Panel',
    ])
  })
})
