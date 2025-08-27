'use client'

import React from 'react'

interface Layer {
  id: string
  name: string
  color: string
}

interface LayerLegendProps {
  layers: Layer[]
}

export default function LayerLegend({ layers }: LayerLegendProps) {
  if (layers.length === 0) return null
  return (
    <div className="flex items-center gap-2 mt-2 text-xs" aria-label="Layer color legend">
      {layers.map(layer => (
        <div key={layer.id} className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: layer.color }} />
          <span>{layer.name}</span>
        </div>
      ))}
    </div>
  )
}
