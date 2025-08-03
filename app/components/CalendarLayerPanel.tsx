'use client'

import React from 'react'

interface Layer {
  id: string
  name: string
  color: string
}

interface CalendarLayerPanelProps {
  layers: Layer[]
  selected: string[]
  onToggle: (id: string) => void
}

export default function CalendarLayerPanel({ layers, selected, onToggle }: CalendarLayerPanelProps) {
  return (
    <div className="mb-4">
      {layers.map(layer => (
        <label key={layer.id} className="flex items-center space-x-2 mb-1">
          <input
            type="checkbox"
            checked={selected.includes(layer.id)}
            onChange={() => onToggle(layer.id)}
          />
          <span className="w-3 h-3 inline-block" style={{ backgroundColor: layer.color }} />
          <span>{layer.name}</span>
        </label>
      ))}
    </div>
  )
}
