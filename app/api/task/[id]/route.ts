const baseUrl = process.env.CASCADENCE_API_BASE_URL
const token = process.env.CASCADENCE_API_TOKEN

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const res = await fetch(`${baseUrl}/task/${params.id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json()
  const res = await fetch(`${baseUrl}/task/${params.id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}
