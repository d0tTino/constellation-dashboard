'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { EventDropArg } from '@fullcalendar/interaction'
import useSWR from 'swr'
import { fetcher } from '../../lib/swr'

export default function CalendarPanel() {
  const { data: events = [], mutate } = useSWR('/api/schedule', fetcher)

  const handleDrop = async (arg: EventDropArg) => {
    await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: arg.event.id, start: arg.event.startStr, end: arg.event.endStr })
    })
    mutate()
  }

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      editable
      eventDrop={handleDrop}
    />
  )
}
