'use client'

import React, { useState } from 'react'
import ScheduleCalendar from '../components/ScheduleCalendar'

export default function CalendarPage() {
  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mutate, setMutate] = useState<(() => void) | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, start, end })
    })
    if (!res.ok) {
      setError('Failed to create event')
      return
    }
    setTitle('')
    setStart('')
    setEnd('')
    mutate?.()
  }

  return (
    <div>
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
      <ScheduleCalendar onMutate={setMutate} />
    </div>
  )
}
