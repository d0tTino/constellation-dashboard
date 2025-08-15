'use client'

import React from 'react'

interface UserLegendProps {
  userColors: Record<string, string>
}

export default function UserLegend({ userColors }: UserLegendProps) {
  const entries = Object.entries(userColors)
  if (entries.length === 0) return null
  return (
    <div className="flex items-center gap-2 mt-2 text-xs" aria-label="User color legend">
      {entries.map(([user, color]) => (
        <div key={user} className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
          <span>{user.slice(0, 2).toUpperCase()}</span>
        </div>
      ))}
    </div>
  )
}
