import { ideaSeeds, IdeaSeed } from './data'

export async function GET() {
  return Response.json(ideaSeeds)
}

export async function POST(req: Request) {
  const data = await req.json()
  const newSeed: IdeaSeed = {
    id: Date.now().toString(),
    text: data.text ?? ''
  }
  ideaSeeds.push(newSeed)
  return Response.json(newSeed, { status: 201 })
}
