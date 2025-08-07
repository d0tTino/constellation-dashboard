'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '../../lib/swr'
import ScheduleCalendar from '../components/ScheduleCalendar'
import CalendarLayerPanel from '../components/CalendarLayerPanel'

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
}

interface CalendarData {
  events: Event[]
  layers: Layer[]
}

export default function CalendarPanel() {
  const { data = { events: [], layers: [] } as CalendarData, mutate } = useSWR<CalendarData>(
    '/api/schedule',
    fetcher,
    { refreshInterval: 30000 },
  )
  const [visibleLayers, setVisibleLayers] = useState<string[]>([])

  useEffect(() => {
    setVisibleLayers(data.layers.map(l => l.id))
  }, [data.layers])

  const toggleLayer = (id: string) => {
    setVisibleLayers(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    )
  }

  return (
    <div>
      <CalendarLayerPanel layers={data.layers} selected={visibleLayers} onToggle={toggleLayer} />
      <ScheduleCalendar
        events={data.events}
        layers={data.layers}
        visibleLayers={visibleLayers}
        mutate={mutate}
      />
    </div>
  )
}

