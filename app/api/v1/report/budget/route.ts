import { NextResponse } from 'next/server'

export async function GET() {
  const data = [
    { category: 'Rent', amount: 1000 },
    { category: 'Food', amount: 300 },
    { category: 'Utilities', amount: 150 },
  ]
  return NextResponse.json(data)
}
