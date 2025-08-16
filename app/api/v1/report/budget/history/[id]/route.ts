import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../auth/[...nextauth]/route'
import { getContextAndGroupId } from '../../../../../../../lib/context-utils'

type Action = { id: string; description: string }

const personal: Record<string, Action[]> = {
  '1': [
    { id: '1a', description: 'Reduce dining out expenses' },
    { id: '1b', description: 'Cancel unused subscriptions' },
  ],
  '2': [
    { id: '2a', description: 'Negotiate rent reduction' },
    { id: '2b', description: 'Switch to lower-cost utilities provider' },
  ],
}

const group: Record<string, Action[]> = {
  g1: [
    { id: 'g1a', description: 'Consolidate group purchases' },
    { id: 'g1b', description: 'Review shared service contracts' },
  ],
  g2: [
    { id: 'g2a', description: 'Implement energy-saving initiatives' },
    { id: 'g2b', description: 'Optimize office supply orders' },
  ],
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
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
  const actions = ctx === 'group' ? group[params.id] : personal[params.id]
  return NextResponse.json(actions ?? [])
}
