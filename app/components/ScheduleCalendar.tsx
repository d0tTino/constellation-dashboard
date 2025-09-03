'use client'

import React, { useEffect, useState, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin, { DayCellContentArg } from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin, { EventDropArg, DateClickArg } from '@fullcalendar/interaction'
import { EventContentArg, EventMountArg } from '@fullcalendar/core'
import { useCalendarEvents, useTaskStatus } from '../socket-context'
import SharedEventTooltip from './SharedEventTooltip'
import useUserColors from '../../lib/hooks/useUserColors'

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
  userColorMap?: Record<string, string>
  backgroundColor?: string
  borderColor?: string
  layerColor?: string
  userColor?: string
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (
      event?.type === 'calendar.event.created' ||
      event?.type === 'calendar.event.updated' ||
      event?.type === 'calendar.event.deleted'
    ) {
      mutate()
    }
  }, [event, mutate])

  useEffect(() => {
    if (taskStatus) mutate()
  }, [taskStatus, mutate])

  const userColors = useUserColors(events)

  const filtered = events
    .filter(e => !e.layer || visibleLayers.includes(e.layer))
    .map(e => {
      const layer = layers.find(l => l.id === e.layer)
      const layerColor = layer?.color
      const userColor = e.owner ? userColors[e.owner] : undefined
      return {
        ...e,
        backgroundColor: layerColor,
        borderColor: layerColor,
        layerColor,
        userColor,
        userColorMap: userColors
      }
    })

  // FullCalendar renders month cells in local time. Using UTC dates would
  // shift events and break the heatmap counts, so always derive dates in
  // local time.
  const toLocalDate = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d
    return date.toLocaleDateString('en-CA')
  }

  const backgroundEvents = useMemo(() => {
    const dayLayer = new Set<string>()
    filtered.forEach(e => {
      if (!e.layer) return
      const date = toLocalDate(e.start)
      dayLayer.add(`${e.layer}|${date}`)
    })
    return Array.from(dayLayer).map(key => {
      const [layerId, date] = key.split('|')
      const layer = layers.find(l => l.id === layerId)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      return {
        id: `bg-${layerId}-${date}`,
        start: date,
        end: endDate.toISOString().split('T')[0],
        display: 'background' as const,
        backgroundColor: layer?.color,
        allDay: true
      }
    })
  }, [filtered, layers])

  const calendarEvents = useMemo(() => [...filtered, ...backgroundEvents], [filtered, backgroundEvents])

  const eventsByDate = useMemo(() => {
    return filtered.reduce<Record<string, Event[]>>((acc, e) => {
      const date = toLocalDate(e.start)
      acc[date] = acc[date] ? [...acc[date], e] : [e]
      return acc
    }, {})
  }, [filtered])

  const getColorStyle = (count: number): React.CSSProperties => {
    if (count === 0) return {}
    const intensity = Math.min(count, 5) / 5
    return { backgroundColor: `rgba(59, 130, 246, ${intensity})` }
  }

  const handleDelete = async (id: string) => {
    try {
      setError(null)
      const res = await fetch(`/api/task/${id}`, { method: 'DELETE' })
      let data: any = null
      try {
        data = await res.json()
      } catch {}
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Failed to delete event')
        return
      }
      mutate()
    } catch {
      setError('Failed to delete event')
    }
  }

  const handleEventMount = (info: EventMountArg) => {
    const shared = info.event.extendedProps.shared
    if (info.view.type === 'dayGridMonth') {
      info.el.style.display = 'none'
      return
    }
    if (shared) {
      info.el.classList.add('border-2', 'border-dashed', 'border-blue-500')
      const icon = document.createElement('span')
      icon.textContent = '👥'
      icon.className = 'mr-1'
      info.el.prepend(icon)
    }
    const layerColor = info.event.extendedProps.layerColor || info.event.backgroundColor
    if (layerColor) {
      info.el.style.backgroundColor = layerColor
      if (!shared) {
        info.el.style.borderColor = layerColor
      }
    }
  }

  const renderEventContent = (arg: EventContentArg) => {
    if (arg.view.type === 'dayGridMonth') return null
    const shared = arg.event.extendedProps.shared
    const invitees: string[] = arg.event.extendedProps.invitees || []
    const permissions: string[] = arg.event.extendedProps.permissions || []
    const owner: string | undefined = arg.event.extendedProps.owner
    const userColor: string | undefined = arg.event.extendedProps.userColor
    const initials = owner?.slice(0, 2).toUpperCase()
    const content = (
      <div className="flex items-center">
        {userColor && (
          <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: userColor }} />
        )}
        {shared && <span className="mr-1">👥</span>}
        {initials && <span className="mr-1">{initials}</span>}
        <span>{arg.event.title}</span>
      </div>
    )
    return (
      <SharedEventTooltip invitees={invitees} permissions={permissions}>
        {content}
      </SharedEventTooltip>
    )
  }

  const renderDayCell = (arg: DayCellContentArg) => {
    const dateStr = toLocalDate(arg.date)
    const dayEvents = eventsByDate[dateStr] || []
    const count = dayEvents.length
    const colorStyle = getColorStyle(count)
    if (selectedDate === dateStr) {
      return (
        <div className="h-full w-full" style={colorStyle} title={`${count} events`} aria-label={`${count} events`}>
          <div className="fc-daygrid-day-number">{arg.dayNumberText}</div>
          <ul className="mt-1 text-xs">
            {dayEvents.map(e => (
              <li key={e.id} className="flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-1 flex items-center justify-center"
                  style={{ backgroundColor: e.layerColor, border: `1px solid ${e.layerColor}` }}
                >
                  {e.userColor && (
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: e.userColor }} />
                  )}
                </span>
                {e.shared && <span className="mr-1">👥</span>}
                {e.owner && <span className="mr-1">{e.owner.slice(0, 2).toUpperCase()}</span>}
                {e.title || '(no title)'}
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() => handleDelete(e.id)}
                  aria-label={`Delete ${e.title || 'event'}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    return (
      <div className="h-full w-full" style={colorStyle} title={`${count} events`} aria-label={`${count} events`}>
        <div className="fc-daygrid-day-number">{arg.dayNumberText}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {dayEvents.map(e => (
            <span
              key={e.id}
              className="w-2 h-2 rounded-full flex items-center justify-center"
              style={{ backgroundColor: e.layerColor, border: `1px solid ${e.layerColor}` }}
            >
              {e.userColor && (
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: e.userColor }} />
              )}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const handleDateClick = (arg: DateClickArg) => {
    const dateStr = toLocalDate(arg.date)
    setSelectedDate(prev => (prev === dateStr ? null : dateStr))
  }

  const handleDrop = async (arg: EventDropArg) => {
    try {
      const res = await fetch(`/api/task/${arg.event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: arg.event.startStr, end: arg.event.endStr })
      })

      let data: any = null
      try {
        data = await res.json()
      } catch {}

      if (!res.ok || !data?.success) {
        arg.revert()
        setError(data?.error || 'Failed to update event')
        return
      }

      mutate()
      setError(null)
    } catch (err) {
      arg.revert()
      setError('Failed to update event')
    }
  }

  return (
    <div>
      {error && <p role="alert" className="text-red-500">{error}</p>}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={calendarEvents}
        editable
        eventDrop={handleDrop}
        eventDidMount={handleEventMount}
        eventContent={renderEventContent}
        dayCellContent={renderDayCell}
        dateClick={handleDateClick}
      />
      <div className="flex items-center gap-2 mt-2 text-xs" aria-label="Event count legend">
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={getColorStyle(n)} />
            <span>{n}{n === 5 ? '+' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
