import { getData, addEvent, validateEvent } from './store'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { getContextAndGroupId } from '../../../lib/context-utils'
import { sendWsMessage } from '../../../lib/ws-server'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { context: ctx, groupId } = getContextAndGroupId(req)
  if (ctx === 'group') {
    if (!groupId) {
      return new Response('groupId required', { status: 400 })
    }
    const groups = session.user?.groups ?? []
    if (!groups.includes(groupId)) {
      return new Response('Forbidden', { status: 403 })
    }
  }
  const data = await getData()
  const events = data.events.filter(e =>
    ctx === 'group' ? e.shared && e.groupId === groupId : !e.shared,
  )
  return Response.json({ events, layers: data.layers })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { context: ctx, groupId } = getContextAndGroupId(req)
  if (ctx === 'group') {
    if (!groupId) {
      return Response.json({ error: 'groupId required' }, { status: 400 })
    }
    const groups = session.user?.groups ?? []
    if (!groups.includes(groupId)) {
      return new Response('Forbidden', { status: 403 })
    }
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  try {
    const baseEvent = validateEvent(body)
    if (ctx === 'personal' && baseEvent.shared) {
      return new Response('Forbidden', { status: 403 })
    }
    if (ctx === 'group' && !baseEvent.shared) {
      return new Response('Forbidden', { status: 403 })
    }
    const event =
      ctx === 'group' ? { ...baseEvent, groupId: groupId! } : baseEvent
    await addEvent(event)
    sendWsMessage({ type: 'calendar.event.created', event }, (session as any).accessToken)
    return Response.json({ success: true })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 })
  }
}
