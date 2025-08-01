let events = [
  { id: '1', title: 'Sample Event', start: new Date().toISOString().substring(0,10) }
]

export async function GET() {
  return Response.json(events)
}

export async function POST(req: Request) {
  const data = await req.json()
  const idx = events.findIndex(e => e.id === data.id)
  if (idx !== -1) {
    events[idx] = { ...events[idx], ...data }
  } else {
    events.push(data)
  }
  return Response.json({ success: true })
}
