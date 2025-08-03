import { getEvent, updateEvent, validateEventPatch } from '../../schedule/store'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const event = await getEvent(params.id)
  if (!event) {
    return new Response('Not found', { status: 404 })
  }
  return Response.json(event)
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
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
    if (e.message === 'Not found') {
      return new Response('Not found', { status: 404 })
    }
    return Response.json({ error: e.message }, { status: 400 })
  }
}
