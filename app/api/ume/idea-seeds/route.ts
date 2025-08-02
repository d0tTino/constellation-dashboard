import { ideaSeeds, IdeaSeed } from './data'

export async function GET() {
  return Response.json(ideaSeeds)
}

export async function POST(req: Request) {
  const data = await req.json()
  const newSeed: IdeaSeed = {
    id: data.id ?? Date.now().toString(),
    text: data.text ?? '',
  }
  ideaSeeds.push(newSeed)
  return Response.json(newSeed, { status: 201 })
}

export async function PUT(req: Request) {
  const data = await req.json()
  const seed = ideaSeeds.find(s => s.id === data.id)
  if (!seed) {
    return new Response('Not found', { status: 404 })
  }
  seed.text = data.text ?? seed.text
  return Response.json(seed)
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  const idx = ideaSeeds.findIndex(s => s.id === id)
  if (idx === -1) {
    return new Response('Not found', { status: 404 })
  }
  ideaSeeds.splice(idx, 1)
  return Response.json({ success: true })
}
