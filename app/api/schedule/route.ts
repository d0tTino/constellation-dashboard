import { getData, addEvent, validateEvent } from './store'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { getRequestContext } from '../../../lib/context'
import { sendWsMessage } from '../../../lib/ws-server'

function getGroupId(req: Request): string | undefined {
  const url = new URL(req.url)
  const param = url.searchParams.get('groupId')
  const cookie = req.headers.get('cookie') || ''
  const matchGroup = cookie.match(/(?:^|; )groupId=([^;]+)/)
  const fromGroup = matchGroup ? decodeURIComponent(matchGroup[1]) : undefined
  const matchCtx = cookie.match(/(?:^|; )context=([^;]+)/)
  const ctxVal = matchCtx ? decodeURIComponent(matchCtx[1]) : undefined
  const fromContext =
    ctxVal && ctxVal !== 'personal' && ctxVal !== 'group' ? ctxVal : undefined
  return param ?? fromGroup ?? fromContext
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const ctx = getRequestContext(req)
  const groupId = getGroupId(req)
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
  const ctx = getRequestContext(req)
  const groupId = getGroupId(req)
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
