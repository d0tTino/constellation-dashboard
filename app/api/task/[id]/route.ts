import { getEvent, updateEvent, validateEventPatch } from '../../schedule/store'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getRequestContext } from '../../../../lib/context'

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
  if (ctx === 'personal' && event.shared) {
    return new Response('Forbidden', { status: 403 })
  }
  if (ctx === 'group' && !event.shared) {
    return new Response('Forbidden', { status: 403 })
  }
  return Response.json(event)
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const ctx = getRequestContext(req)
  const existing = await getEvent(params.id)
  if (!existing) {
    return new Response('Not found', { status: 404 })
  }
  if (ctx === 'personal' && existing.shared) {
    return new Response('Forbidden', { status: 403 })
  }
  if (ctx === 'group' && !existing.shared) {
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
    return Response.json({ success: true })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 })
  }
}
