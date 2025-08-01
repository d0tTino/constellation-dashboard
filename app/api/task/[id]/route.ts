const tasks = [
  { id: '1', name: 'Sample Task One', status: 'pending' },
  { id: '2', name: 'Sample Task Two', status: 'completed' },
]

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
