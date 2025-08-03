'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

type ContextType = 'personal' | 'group'

export default function ContextSwitcher() {
  const { data: session } = useSession()
  const [context, setContext] = useState<ContextType>('personal')

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )context=(personal|group)/)
    if (match) {
      setContext(match[1] as ContextType)
    }
  }, [])

  const update = (value: ContextType) => {
    setContext(value)
    document.cookie = `context=${value}; path=/`
  }

  if (!session) return null

  return (
    <select value={context} onChange={e => update(e.target.value as ContextType)}>
      <option value="personal">Personal</option>
      <option value="group">Group</option>
    </select>
  )
}
