import { describe, it, expect, vi } from 'vitest'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', async () => {
  const actual = await vi.importActual<any>('next-auth')
  return {
    ...actual,
    getServerSession: vi.fn(),
  }
})

describe('budget history API route', () => {
  it('returns history scoped to context', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', groups: ['group'] },
    })
    const { GET } = await import('../app/api/v1/report/budget/history/route')
    const resPersonal = await GET(
      new Request('http://test', { headers: { cookie: 'context=personal' } }),
    )
    const dataPersonal = await resPersonal.json()
    expect(dataPersonal).toEqual([
      { id: '1', date: '2024-01-01', totalCost: 1200 },
      { id: '2', date: '2024-02-01', totalCost: 1300 },
    ])

    const resGroup = await GET(
      new Request('http://test', { headers: { cookie: 'context=group' } }),
    )
    const dataGroup = await resGroup.json()
    expect(dataGroup).toEqual([
      { id: 'g1', date: '2024-01-01', totalCost: 5000 },
      { id: 'g2', date: '2024-02-01', totalCost: 5200 },
    ])
  })
})
