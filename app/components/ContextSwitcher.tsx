'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

type ContextType = string

export default function ContextSwitcher() {
  const { data: session } = useSession()
  const [context, setContext] = useState<ContextType>('personal')
  const [groups, setGroups] = useState<string[]>([])

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )context=([^;]+)/)
    if (match) {
      setContext(match[1])
    }
  }, [])

  useEffect(() => {
    async function loadGroups() {
      if (session?.groups && session.groups.length) {
        setGroups(session.groups)
        return
      }
      try {
        const res = await fetch('/api/groups')
        if (res.ok) {
          const data = await res.json()
          setGroups(Array.isArray(data.groups) ? data.groups : [])
        }
      } catch {
        // ignore
      }
    }
    loadGroups()
  }, [session])

  const update = (value: ContextType) => {
    setContext(value)
    document.cookie = `context=${value}; path=/`
    window.dispatchEvent(new Event('context-changed'))
  }

  if (!session) return null

  return (
    <label htmlFor="context-select">
      Context
      <select
        id="context-select"
        value={context}
        onChange={e => update(e.target.value)}
      >
        <option value="personal">Personal</option>
        {groups.map(g => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
    </label>
  )
}
