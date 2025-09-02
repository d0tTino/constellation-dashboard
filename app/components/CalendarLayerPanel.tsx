'use client'

import React from 'react'
import LayerLegend from './LayerLegend'
import UserLegend from './UserLegend'

interface Layer {
  id: string
  name: string
  color: string
}

interface CalendarLayerPanelProps {
  layers: Layer[]
  selected: string[]
  onToggle: (id: string) => void
  userColors?: Record<string, string>
}

export default function CalendarLayerPanel({ layers, selected, onToggle, userColors = {} }: CalendarLayerPanelProps) {
  return (
    <aside className="w-64 flex-shrink-0 mr-4 flex flex-col gap-4">
      <div>
        {layers.map(layer => (
          <label key={layer.id} className="flex items-center space-x-2 mb-1">
            <input
              type="checkbox"
              checked={selected.includes(layer.id)}
              onChange={() => onToggle(layer.id)}
            />
            <span
              className="w-3 h-3 inline-block"
              style={{ backgroundColor: layer.color }}
              aria-hidden="true"
            />
            <span className="sr-only">Color: {layer.color}</span>
            <span>{layer.name}</span>
          </label>
        ))}
      </div>
      <LayerLegend layers={layers} />
      <UserLegend userColors={userColors} />
    </aside>
  )
}
