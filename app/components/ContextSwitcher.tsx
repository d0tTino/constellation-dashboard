'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { getClientContext } from '../../lib/client-context'
import { fetcher } from '../../lib/swr'

type ContextType = string

export default function ContextSwitcher() {
  const { data: session } = useSession()
  const [context, setContext] = useState<ContextType>('personal')

  const { data: groupsData } = useSWR<{ groups: string[] }>(
    session ? '/api/groups' : null,
    fetcher,
    { fallbackData: { groups: session?.groups ?? [] } }
  )
  const groups = groupsData?.groups ?? []

  useEffect(() => {
    const { context, groupId } = getClientContext()
    if (context === 'group' && groupId) {
      setContext(groupId)
    }
  }, [])

  const update = (value: ContextType) => {
    setContext(value)
    if (value === 'personal') {
      document.cookie = `context=personal; path=/`
      document.cookie = `groupId=; Max-Age=0; path=/`
    } else {
      document.cookie = `context=group; path=/`
      document.cookie = `groupId=${value}; path=/`
    }
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
