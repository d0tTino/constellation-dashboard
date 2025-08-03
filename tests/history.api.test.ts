import { describe, it, expect } from 'vitest'

describe('budget history API route', () => {
  it('returns past analyses', async () => {
    const { GET } = await import('../app/api/v1/report/budget/history/route')
    const res = await GET()
    const data = await res.json()
    expect(data).toEqual([
      { id: '1', date: '2024-01-01', totalCost: 1200 },
      { id: '2', date: '2024-02-01', totalCost: 1300 },
    ])
  })
})
