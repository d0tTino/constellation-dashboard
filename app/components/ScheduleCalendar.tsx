'use client'

import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { EventDropArg } from '@fullcalendar/interaction'

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

interface ScheduleCalendarProps {
  events: Event[]
  layers: Layer[]
  visibleLayers: string[]
  mutate: () => void
}

export default function ScheduleCalendar({ events, layers, visibleLayers, mutate }: ScheduleCalendarProps) {
  const filtered = events
    .filter(e => !e.layer || visibleLayers.includes(e.layer))
    .map(e => {
      const layer = layers.find(l => l.id === e.layer)
      const color = layer?.color
      return {
        ...e,
        backgroundColor: color,
        borderColor: color
      }
    })

  const handleDrop = async (arg: EventDropArg) => {
    await fetch(`/api/task/${arg.event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: arg.event.startStr, end: arg.event.endStr })
    })
    mutate()
  }

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      }}
      events={filtered}
      editable
      eventDrop={handleDrop}
    />
  )
}
