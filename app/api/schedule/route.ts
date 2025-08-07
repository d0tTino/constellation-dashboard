import { getData, addEvent, validateEvent } from './store'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { getRequestContext } from '../../../lib/context'
import { sendWsMessage } from '../../../lib/ws-server'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const ctx = getRequestContext(req)
  const data = await getData()
  const events = data.events.filter(e =>
    ctx === 'group' ? e.shared : !e.shared,
  )
  return Response.json({ events, layers: data.layers })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const ctx = getRequestContext(req)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  try {
    const event = validateEvent(body)
    if (ctx === 'personal' && event.shared) {
      return new Response('Forbidden', { status: 403 })
    }
    if (ctx === 'group' && !event.shared) {
      return new Response('Forbidden', { status: 403 })
    }
    await addEvent(event)
    sendWsMessage({ type: 'calendar.event.created', event })
    return Response.json({ success: true })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 })
  }
}
