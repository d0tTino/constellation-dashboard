import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { getRequestContext } from '../../../../../../lib/context'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const cookie = req.headers.get('cookie') || ''
  const match = cookie.match(/(?:^|; )context=([^;]+)/)
  const requested = match ? decodeURIComponent(match[1]) : 'personal'
  const ctx = getRequestContext(req)
  if (ctx === 'group') {
    const groups = session.user?.groups ?? []
    if (!groups.includes(requested)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  const personal = [
    { id: '1', date: '2024-01-01', totalCost: 1200 },
    { id: '2', date: '2024-02-01', totalCost: 1300 },
  ]
  const group = [
    { id: 'g1', date: '2024-01-01', totalCost: 5000 },
    { id: 'g2', date: '2024-02-01', totalCost: 5200 },
  ]
  return NextResponse.json(ctx === 'group' ? group : personal)
}
