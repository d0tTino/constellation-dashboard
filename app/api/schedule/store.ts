import { promises as fs } from 'fs'
import path from 'path'

export interface CalendarEvent {
  id: string
  title?: string
  start: string
  end?: string
}

const dataFile =
  process.env.SCHEDULE_DATA_FILE ||
  path.join(process.cwd(), 'app/api/schedule/events.json')

async function read(): Promise<CalendarEvent[]> {
  try {
    const text = await fs.readFile(dataFile, 'utf8')
    return JSON.parse(text)
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      await fs.writeFile(dataFile, '[]', 'utf8')
      return []
    }
    throw err
  }
}

async function write(events: CalendarEvent[]): Promise<void> {
  await fs.writeFile(dataFile, JSON.stringify(events, null, 2), 'utf8')
}

export async function getEvents(): Promise<CalendarEvent[]> {
  return read()
}

export async function getEvent(id: string): Promise<CalendarEvent | undefined> {
  const events = await read()
  return events.find(e => e.id === id)
}

export function validateEvent(data: any): CalendarEvent {
  if (!data || typeof data !== 'object') throw new Error('Invalid payload')
  const { id, title, start, end } = data
  if (typeof id !== 'string' || typeof start !== 'string') {
    throw new Error('id and start are required')
  }
  if (title !== undefined && typeof title !== 'string') {
    throw new Error('title must be string')
  }
  if (end !== undefined && typeof end !== 'string') {
    throw new Error('end must be string')
  }
  return { id, title, start, end }
}

export function validateEventPatch(data: any): Partial<CalendarEvent> {
  if (!data || typeof data !== 'object') throw new Error('Invalid payload')
  const result: Partial<CalendarEvent> = {}
  if (data.title !== undefined) {
    if (typeof data.title !== 'string') throw new Error('title must be string')
    result.title = data.title
  }
  if (data.start !== undefined) {
    if (typeof data.start !== 'string') throw new Error('start must be string')
    result.start = data.start
  }
  if (data.end !== undefined) {
    if (typeof data.end !== 'string') throw new Error('end must be string')
    result.end = data.end
  }
  if (data.id !== undefined) {
    throw new Error('id cannot be updated')
  }
  if (Object.keys(result).length === 0) throw new Error('No valid fields')
  return result
}

export async function addEvent(event: CalendarEvent): Promise<void> {
  const events = await read()
  events.push(event)
  await write(events)
}

export async function updateEvent(
  id: string,
  patch: Partial<CalendarEvent>,
): Promise<void> {
  const events = await read()
  const idx = events.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Not found')
  events[idx] = { ...events[idx], ...patch }
  await write(events)
}
