import { NextResponse } from 'next/server'
import { getRequestContext } from '../../../../../../lib/context'

export async function GET(req: Request) {
  const ctx = getRequestContext(req)
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
