'use client'

import { useEffect, useState } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import { getPanels, LoadedPanel } from '../../lib/panels'

const storageKey = 'dashboard-layout'

export default function DashboardPage() {
  const [panels, setPanels] = useState<LoadedPanel[]>([])
  const [layout, setLayout] = useState<Layout[]>([])

  useEffect(() => {
    getPanels().then(setPanels)
  }, [])

  // Persist layout changes to localStorage
  useEffect(() => {
    if (layout.length) {
      window.localStorage.setItem(storageKey, JSON.stringify(layout))
    }
  }, [layout])

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey)
    if (saved) {
      setLayout(JSON.parse(saved))
    }
  }, [])

  const onLayoutChange = (next: Layout[]) => {
    setLayout(next)
    window.localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const addPanel = (panelId: string) => {
    if (layout.find(l => l.i === panelId)) return
    if (!panels.find(p => p.id === panelId)) return
    const y = layout.reduce((max, l) => Math.max(max, l.y + l.h), 0)
    const next = [...layout, { i: panelId, x: 0, y, w: 2, h: 2 }]
    setLayout(next)
    window.localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const removePanel = (panelId: string) => {
    const next = layout.filter(l => l.i !== panelId)
    setLayout(next)
    window.localStorage.setItem(storageKey, JSON.stringify(next))
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Dashboard</h1>
      <div style={{ marginBottom: '1rem' }}>
        {panels.map(p => (
          <button key={p.id} style={{ marginRight: '0.5rem' }} onClick={() => addPanel(p.id)}>
            Add {p.title}
          </button>
        ))}
      </div>
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={30}
        width={1200}
        onLayoutChange={onLayoutChange}
      >
        {layout.map(l => {
          const panel = panels.find(p => p.id === l.i)
          if (!panel) return null
          return (
            <div key={l.i} data-grid={l} style={{ border: '1px solid #ccc', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => removePanel(l.i)}>x</button>
              </div>
              <panel.Component />
            </div>
          )
        })}
      </GridLayout>
    </div>
  )
}
