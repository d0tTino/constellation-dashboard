'use client'

import React, { useState } from 'react'

interface SharedEventTooltipProps {
  children: React.ReactNode
  invitees?: string[]
  permissions?: string[]
}

export default function SharedEventTooltip({ children, invitees = [], permissions = [] }: SharedEventTooltipProps) {
  const [visible, setVisible] = useState(false)
  const content = `Invitees: ${invitees.join(', ') || 'None'}\nPermissions: ${permissions.join(', ') || 'None'}`
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className="absolute z-10 p-2 text-xs text-white bg-gray-800 rounded shadow whitespace-pre-line"
        >
          {content}
        </div>
      )}
    </div>
  )
}

