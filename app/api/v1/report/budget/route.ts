import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { getContextAndGroupId } from '../../../../../lib/context-utils'

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
    { category: 'Rent', amount: 1000 },
    { category: 'Food', amount: 300 },
    { category: 'Utilities', amount: 150 },
  ]
  const group = [
    { category: 'Office Rent', amount: 2000 },
    { category: 'Team Meals', amount: 800 },
    { category: 'Shared Utilities', amount: 400 },
  ]
  return NextResponse.json(ctx === 'group' ? group : personal)
}
