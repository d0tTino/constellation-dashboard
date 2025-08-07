import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { getRequestContext } from '../../../../../lib/context'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  const ctx = getRequestContext(req)
  if (ctx === 'group') {
    const cookie = req.headers.get('cookie') || ''
    const match = cookie.match(/(?:^|; )context=([^;]+)/)
    const requested = match ? decodeURIComponent(match[1]) : ''
    const groups = session.user?.groups ?? []
    if (!groups.includes(requested)) {
      return new Response('Forbidden', { status: 403 })
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
