export async function GET() {
  return Response.json({
    nodes: [
      { id: '1', label: 'Node 1' },
      { id: '2', label: 'Node 2' },
      { id: '3', label: 'Node 3' },
    ],
    edges: [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
    ],
  })
}
