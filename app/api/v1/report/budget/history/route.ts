import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { getContextAndGroupId } from '../../../../../../lib/context-utils'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const { context: ctx, groupId } = getContextAndGroupId(req)
  if (ctx === 'group') {
    const groups = session.groups ?? []
    if (!groupId || !groups.includes(groupId)) {
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
