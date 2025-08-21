import {
  getEvent,
  updateEvent,
  validateEventPatch,
  removeEvent,
} from '../../schedule/store'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getContextAndGroupId } from '../../../../lib/context-utils'
import { sendWsMessage } from '../../../../lib/ws-server'
import { validateGroupPermissions } from '../../../../lib/permissions'

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
  const { context: ctx, groupId: requested } = getContextAndGroupId(req)
  const permError = validateGroupPermissions(session, ctx, requested, event as any)
  if (permError) {
    return permError
  }
  return Response.json({ ...event, groupId: (event as any).groupId ?? null })
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
  const { context: ctx, groupId: requested } = getContextAndGroupId(req)
  const permError = validateGroupPermissions(session, ctx, requested, existing as any)
  if (permError) {
    return permError
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

export async function DELETE(
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
  const { context: ctx, groupId: requested } = getContextAndGroupId(req)
  const permError = validateGroupPermissions(session, ctx, requested, existing as any)
  if (permError) {
    return permError
  }
  await removeEvent(params.id)
  sendWsMessage(
    { type: 'calendar.event.deleted', id: params.id },
    (session as any).accessToken,
  )
  return Response.json({ success: true })
}
