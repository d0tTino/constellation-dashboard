const baseUrl = process.env.CASCADENCE_API_BASE_URL
const token = process.env.CASCADENCE_API_TOKEN

export async function GET() {
  const res = await fetch(`${baseUrl}/schedule`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}

export async function POST(req: Request) {
  const body = await req.json()
  const res = await fetch(`${baseUrl}/schedule`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}
