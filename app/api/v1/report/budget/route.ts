import { NextResponse } from 'next/server'
import { getRequestContext } from '../../../../../lib/context'

export async function GET(req: Request) {
  const ctx = getRequestContext(req)
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
