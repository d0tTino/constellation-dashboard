'use client'

import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import { fetcher } from '../../lib/swr'
import ScheduleCalendar from '../components/ScheduleCalendar'
import CalendarLayerPanel from '../components/CalendarLayerPanel'
import { useSocket } from '../socket-context'

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
}

interface CalendarData {
  events: Event[]
  layers: Layer[]
}

export default function CalendarPage() {
  const { data = { events: [], layers: [] } as CalendarData, mutate } = useSWR<CalendarData>(
    '/api/schedule',
    fetcher,
    { refreshInterval: 30000 },
  )
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedLayers, setSelectedLayers] = useState<string[]>([])

  const socket = useSocket()
  const [nl, setNl] = useState('')

  useEffect(() => {
    setSelectedLayers(data.layers.map(l => l.id))
  }, [data.layers])

  const handleNL = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nl) return
    socket?.send(JSON.stringify({ type: 'calendar.nl.request', text: nl }))
    setNl('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const layer = selectedLayers[0]
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, start, end, layer })
    })
    if (!res.ok) {
      setError('Failed to create event')
      return
    }
    setTitle('')
    setStart('')
    setEnd('')
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
