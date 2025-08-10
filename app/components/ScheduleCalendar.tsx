'use client'

import React, { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin, { DayCellContentArg } from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { EventDropArg, DateClickArg } from '@fullcalendar/interaction'
import { EventContentArg, EventMountArg } from '@fullcalendar/core'
import { useCalendarEvents, useTaskStatus } from '../socket-context'
import SharedEventTooltip from './SharedEventTooltip'

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

interface ScheduleCalendarProps {
  events: Event[]
  layers: Layer[]
  visibleLayers: string[]
  mutate: () => void
}

export default function ScheduleCalendar({ events, layers, visibleLayers, mutate }: ScheduleCalendarProps) {
  const event = useCalendarEvents()
  const taskStatus = useTaskStatus()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    if (event) mutate()
  }, [event, mutate])

  useEffect(() => {
    if (taskStatus) mutate()
  }, [taskStatus, mutate])

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

  const handleEventMount = (info: EventMountArg) => {
    const shared = info.event.extendedProps.shared
    if (info.view.type === 'dayGridMonth') {
      info.el.style.display = 'none'
      return
    }
    if (shared) {
      info.el.classList.add('border-2', 'border-dashed')
      const icon = document.createElement('span')
      icon.textContent = '👥'
      icon.className = 'mr-1'
      info.el.prepend(icon)
    }
    const color = info.event.backgroundColor || info.event.extendedProps.backgroundColor
    if (color) {
      info.el.style.backgroundColor = color
      info.el.style.borderColor = color
    }
  }

  const renderEventContent = (arg: EventContentArg) => {
    if (arg.view.type === 'dayGridMonth') return null
    const shared = arg.event.extendedProps.shared
    const invitees: string[] = arg.event.extendedProps.invitees || []
    const permissions: string[] = arg.event.extendedProps.permissions || []
    const content = (
      <div className="flex items-center">
        {shared && <span className="mr-1">👥</span>}
        <span>{arg.event.title}</span>
      </div>
    )
    if (invitees.length || permissions.length) {
      return (
        <SharedEventTooltip invitees={invitees} permissions={permissions}>
          {content}
        </SharedEventTooltip>
      )
    }
    return content
  }

  const renderDayCell = (arg: DayCellContentArg) => {
    const dateStr = arg.date.toISOString().split('T')[0]
    const dayEvents = filtered.filter(e => e.start.split('T')[0] === dateStr)
    if (selectedDate === dateStr) {
      return (
        <div>
          <div className="fc-daygrid-day-number">{arg.dayNumberText}</div>
          <ul className="mt-1 text-xs">
            {dayEvents.map(e => (
              <li key={e.id} className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: e.backgroundColor, border: e.shared ? '1px solid black' : 'none' }}
                />
                {e.shared && <span className="mr-1">👥</span>}
                {e.title || '(no title)'}
              </li>
            ))}
          </ul>
        </div>
      )
    }
    return (
      <div>
        <div className="fc-daygrid-day-number">{arg.dayNumberText}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {dayEvents.map(e => (
            <span
              key={e.id}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: e.backgroundColor, border: e.shared ? '1px solid black' : 'none' }}
            />
          ))}
        </div>
      </div>
    )
  }

  const handleDateClick = (arg: DateClickArg) => {
    const dateStr = arg.dateStr
    setSelectedDate(prev => (prev === dateStr ? null : dateStr))
  }

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
      eventDidMount={handleEventMount}
      eventContent={renderEventContent}
      dayCellContent={renderDayCell}
      dateClick={handleDateClick}
    />
  )
}
