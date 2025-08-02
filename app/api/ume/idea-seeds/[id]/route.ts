import { ideaSeeds } from '../data'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json()
  const seed = ideaSeeds.find(s => s.id === params.id)
  if (!seed) {
    return new Response('Not found', { status: 404 })
  }
  seed.text = data.text ?? seed.text
  return Response.json({ success: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const idx = ideaSeeds.findIndex(s => s.id === params.id)
  if (idx === -1) {
    return new Response('Not found', { status: 404 })
  }
  ideaSeeds.splice(idx, 1)
  return Response.json({ success: true })
}
