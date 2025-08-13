import { getEvent, updateEvent, validateEventPatch } from '../../schedule/store'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getRequestContext } from '../../../../lib/context'
import { sendWsMessage } from '../../../../lib/ws-server'

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const event = await getEvent(params.id)
  if (!event) {
    return new Response('Not found', { status: 404 })
  }
  const ctx = getRequestContext(req)
  const groupId = (event as any).groupId
  if (ctx === 'group') {
    const cookie = req.headers.get('cookie') || ''
    const match = cookie.match(/(?:^|; )context=([^;]+)/)
    const requested = match ? decodeURIComponent(match[1]) : ''
    const groups = session.user?.groups ?? []
    if (!event.shared || !groupId || groupId !== requested || !groups.includes(groupId)) {
      return new Response('Forbidden', { status: 403 })
    }
  } else if (event.shared) {
    return new Response('Forbidden', { status: 403 })
  }
  return Response.json({ ...event, groupId: groupId ?? null })
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const existing = await getEvent(params.id)
  if (!existing) {
    return new Response('Not found', { status: 404 })
  }
  const ctx = getRequestContext(req)
  const groupId = (existing as any).groupId
  if (ctx === 'group') {
    const cookie = req.headers.get('cookie') || ''
    const match = cookie.match(/(?:^|; )context=([^;]+)/)
    const requested = match ? decodeURIComponent(match[1]) : ''
    const groups = session.user?.groups ?? []
    if (!existing.shared || !groupId || groupId !== requested || !groups.includes(groupId)) {
      return new Response('Forbidden', { status: 403 })
    }
  } else if (existing.shared) {
    return new Response('Forbidden', { status: 403 })
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  try {
    const patch = validateEventPatch(body)
    await updateEvent(params.id, patch)
    const updated = { ...existing, ...patch }
    sendWsMessage(
      { type: 'calendar.event.updated', event: updated },
      (session as any).accessToken,
    )
    return Response.json({ success: true })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 })
  }
}
