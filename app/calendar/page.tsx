'use client'

import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import { fetcher } from '../../lib/swr'
import { AppContext } from '../../lib/context'
import ScheduleCalendar from '../components/ScheduleCalendar'
import CalendarLayerPanel from '../components/CalendarLayerPanel'
import { useSocket } from '../socket-context'
import { useSession } from 'next-auth/react'

interface Layer {
  id: string
  name: string
  color: string
}

interface Event {
  id: string
  title?: string
  start: string
  end?: string
  layer?: string
  shared?: boolean
  invitees?: string[]
  permissions?: string[]
  owner?: string
}

interface CalendarData {
  events: Event[]
  layers: Layer[]
}

const getContext = (): AppContext => {
  const match = document.cookie.match(/(?:^|; )context=([^;]+)/)
  const value = match ? decodeURIComponent(match[1]) : 'personal'
  return value === 'personal' ? 'personal' : 'group'
}

export default function CalendarPage() {
  const [context, setContext] = useState<AppContext>(getContext())
  const { data = { events: [], layers: [] } as CalendarData, mutate } = useSWR<CalendarData>(
    ['/api/schedule', context],
    ([url]) => fetcher(url),
    { refreshInterval: 30000 },
  )
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [shared, setShared] = useState(false)
  const [invitees, setInvitees] = useState('')
  const [permissions, setPermissions] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedLayers, setSelectedLayers] = useState<string[]>([])
  const [layer, setLayer] = useState('')

  const socket = useSocket()
  const { data: session } = useSession()
  const [nl, setNl] = useState('')

  useEffect(() => {
    setSelectedLayers(data.layers.map(l => l.id))
    if (data.layers.length > 0) {
      setLayer(prev => (prev && data.layers.some(l => l.id === prev) ? prev : data.layers[0].id))
    }
  }, [data.layers])

  useEffect(() => {
    const handleContextChange = () => {
      const current = getContext()
      setContext(current)
      mutate()
    }
    window.addEventListener('context-changed', handleContextChange)
    return () => {
      window.removeEventListener('context-changed', handleContextChange)
    }
  }, [mutate])

  const handleNL = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nl) return
    const match = document.cookie.match(/(?:^|; )context=([^;]+)/)
    const context = match ? (match[1] === 'personal' ? 'personal' : 'group') : 'personal'
    socket?.send(
      JSON.stringify({
        type: 'calendar.nl.request',
        text: nl,
        context,
        user: session?.user?.id,
      }),
    )
    setNl('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const id = crypto.randomUUID()
    const inviteeList = invitees.split(',').map(i => i.trim()).filter(Boolean)
    const permissionList = permissions
      .split(',')
      .map(p => p.trim())
      .filter(Boolean)
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        title,
        start,
        end,
        layer,
        shared,
        invitees: inviteeList,
        permissions: permissionList,
        owner: session?.user?.id,
      })
    })
    if (!res.ok) {
      let message = 'Failed to create event'
      try {
        const data = await res.json()
        message = data.error || message
      } catch {
        try {
          message = await res.text()
        } catch {}
      }
      setError(message)
      return
    }
    setTitle('')
    setStart('')
    setEnd('')
    setShared(false)
    setInvitees('')
    setPermissions('')
    mutate()
  }

  const toggleLayer = (id: string) => {
    setSelectedLayers(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    )
  }

  return (
    <div>
      <form onSubmit={handleNL} className="mb-4">
        <input
          name="nl"
          value={nl}
          onChange={e => setNl(e.target.value)}
          className="border mr-2"
        />
        <button type="submit" className="border px-2">Send</button>
      </form>
      <CalendarLayerPanel layers={data.layers} selected={selectedLayers} onToggle={toggleLayer} />
      <form onSubmit={handleCreate} className="mb-4">
        <input
          name="title"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="border mr-2"
        />
        <input
          name="start"
          type="date"
          value={start}
          onChange={e => setStart(e.target.value)}
          className="border mr-2"
        />
        <input
          name="end"
          type="date"
          value={end}
          onChange={e => setEnd(e.target.value)}
          className="border mr-2"
        />
        <input
          name="invitees"
          placeholder="Invitees"
          value={invitees}
          onChange={e => setInvitees(e.target.value)}
          className="border mr-2"
        />
        <input
          name="permissions"
          placeholder="Permissions"
          value={permissions}
          onChange={e => setPermissions(e.target.value)}
          className="border mr-2"
        />
        <select
          name="layer"
          value={layer}
          onChange={e => setLayer(e.target.value)}
          className="border mr-2"
        >
          {data.layers.map(l => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <label className="mr-2">
          <input
            name="shared"
            type="checkbox"
            checked={shared}
            onChange={e => setShared(e.target.checked)}
            className="mr-1"
          />
          Shared
        </label>
        <button type="submit" className="border px-2">Add</button>
      </form>
      {error && <p role="alert" className="text-red-500">{error}</p>}
      <ScheduleCalendar
        events={data.events}
        layers={data.layers}
        visibleLayers={selectedLayers}
        mutate={mutate}
      />
    </div>
  )
}
