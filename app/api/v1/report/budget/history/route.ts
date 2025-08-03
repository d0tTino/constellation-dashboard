import { NextResponse } from 'next/server'

export async function GET() {
  const data = [
    { id: '1', date: '2024-01-01', totalCost: 1200 },
    { id: '2', date: '2024-02-01', totalCost: 1300 },
  ]
  return NextResponse.json(data)
}
