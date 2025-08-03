import { getEvents, addEvent, validateEvent } from './store'

export async function GET() {
  const events = await getEvents()
  return Response.json(events)
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  try {
    const event = validateEvent(body)
    await addEvent(event)
    return Response.json({ success: true })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 400 })
  }
}
