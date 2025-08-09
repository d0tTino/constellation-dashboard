'use client'

import { useEffect, useState } from 'react'
import { useTaskStatus } from '../socket-context'

interface StatusEntry {
  timestamp: number
  message: string
}

export default function TaskStatusPanel() {
  const status = useTaskStatus()
  const [entries, setEntries] = useState<StatusEntry[]>([])

  useEffect(() => {
    if (!status) return
    const message =
      typeof status.message === 'string'
        ? status.message
        : typeof status.status === 'string'
          ? status.status
          : status.type || JSON.stringify(status)
    setEntries(prev => [...prev, { timestamp: Date.now(), message }])
  }, [status])

  return (
    <div className="p-2">
      <h2 className="font-bold mb-2">Task Status</h2>
      <ul className="space-y-1 text-sm">
        {entries.map((e, i) => (
          <li key={i}>
            <span className="text-gray-500 mr-2">
              {new Date(e.timestamp).toLocaleTimeString()}
            </span>
            {e.message}
          </li>
        ))}
      </ul>
    </div>
  )
}

