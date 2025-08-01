const tasks = [
  { id: '1', name: 'Sample Task One', status: 'pending' },
  { id: '2', name: 'Sample Task Two', status: 'completed' },
]

import { events } from '../../schedule/data'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const task = tasks.find(t => t.id === params.id) ?? {
    id: params.id,
    name: `Mock Task ${params.id}`,
    status: 'pending',
  }
  return Response.json(task)
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const data = await req.json()
  const idx = events.findIndex(e => e.id === params.id)
  if (idx === -1) {
    return new Response('Not found', { status: 404 })
  }
  events[idx] = { ...events[idx], ...data }
  return Response.json({ success: true })
}
