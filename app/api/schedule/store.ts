import { promises as fs } from 'fs'
import path from 'path'

export interface CalendarLayer {
  id: string
  name: string
  color: string
}

export interface CalendarEvent {
  id: string
  title?: string
  start: string
  end?: string
  layer?: string
  shared?: boolean
  invitees?: string[]
  permissions?: string[]
  owner?: string
  groupId?: string
}

interface CalendarData {
  events: CalendarEvent[]
  layers: CalendarLayer[]
}

const dataFile =
  process.env.SCHEDULE_DATA_FILE ||
  path.join(process.cwd(), 'app/api/schedule/events.json')

async function read(): Promise<CalendarData> {
  try {
    const text = await fs.readFile(dataFile, 'utf8')
    const data = JSON.parse(text)
    return {
      events: (data.events || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        layer: e.layer,
        shared: e.shared,
        invitees: e.invitees,
        permissions: e.permissions,
        owner: e.owner,
        groupId: e.groupId
      })),
      layers: data.layers || []
    }
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      const empty: CalendarData = { events: [], layers: [] }
      await fs.writeFile(dataFile, JSON.stringify(empty, null, 2), 'utf8')
      return empty
    }
    throw err
  }
}

async function write(data: CalendarData): Promise<void> {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf8')
}

export async function getData(): Promise<CalendarData> {
  const data = await read()
  return { events: data.events, layers: data.layers }
}

export async function getEvents(): Promise<CalendarEvent[]> {
  const data = await getData()
  return data.events
}

export async function getLayers(): Promise<CalendarLayer[]> {
  return (await read()).layers
}

export async function getEvent(id: string): Promise<CalendarEvent | undefined> {
  const data = await read()
  return data.events.find(e => e.id === id)
}

export function validateEvent(data: any): CalendarEvent {
  if (!data || typeof data !== 'object') throw new Error('Invalid payload')
  const {
    id,
    title,
    start,
    end,
    layer,
    shared,
    invitees,
    permissions,
    owner,
    groupId,

  } = data
  if (typeof id !== 'string' || typeof start !== 'string') {
    throw new Error('id and start are required')
  }
  if (title !== undefined && typeof title !== 'string') {
    throw new Error('title must be string')
  }
  if (end !== undefined && typeof end !== 'string') {
    throw new Error('end must be string')
  }
  if (layer !== undefined && typeof layer !== 'string') {
    throw new Error('layer must be string')
  }
  if (shared !== undefined && typeof shared !== 'boolean') {
    throw new Error('shared must be boolean')
  }
  if (invitees !== undefined && !Array.isArray(invitees)) {
    throw new Error('invitees must be array')
  }
  if (permissions !== undefined && !Array.isArray(permissions)) {
    throw new Error('permissions must be array')
  }
  if (owner !== undefined && typeof owner !== 'string') {
    throw new Error('owner must be string')
  }
  if (groupId !== undefined && typeof groupId !== 'string') {
    throw new Error('groupId must be string')
  }
  return {
    id,
    title,
    start,
    end,
    layer,
    shared,
    invitees,
    permissions,
    owner,
    groupId,

  }
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
  if (data.layer !== undefined) {
    if (typeof data.layer !== 'string') throw new Error('layer must be string')
    result.layer = data.layer
  }
  if (data.shared !== undefined) {
    if (typeof data.shared !== 'boolean') throw new Error('shared must be boolean')
    result.shared = data.shared
  }
  if (data.invitees !== undefined) {
    if (!Array.isArray(data.invitees)) throw new Error('invitees must be array')
    result.invitees = data.invitees
  }
  if (data.permissions !== undefined) {
    if (!Array.isArray(data.permissions)) throw new Error('permissions must be array')
    result.permissions = data.permissions
  }
  if (data.owner !== undefined) {
    if (typeof data.owner !== 'string') throw new Error('owner must be string')
    result.owner = data.owner
  }
  if (data.groupId !== undefined) {
    throw new Error('groupId cannot be updated')

  }
  if (data.id !== undefined) {
    throw new Error('id cannot be updated')
  }
  if (Object.keys(result).length === 0) throw new Error('No valid fields')
  return result
}

export async function addEvent(event: CalendarEvent): Promise<void> {
  const data = await read()
  data.events.push(event)
  await write(data)
}

export async function updateEvent(
  id: string,
  patch: Partial<CalendarEvent>,
): Promise<void> {
  const data = await read()
  const idx = data.events.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Not found')
  data.events[idx] = { ...data.events[idx], ...patch }
  await write(data)
}
