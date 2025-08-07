import { describe, it, expect, vi } from 'vitest'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', async () => {
  const actual = await vi.importActual<any>('next-auth')
  return {
    ...actual,
    getServerSession: vi.fn(),
  }
})

describe('budget history detail API route', () => {
  it('returns actions scoped to context', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', groups: ['group'] },
    })
    const { GET } = await import('../app/api/v1/report/budget/history/[id]/route')

    const resPersonal = await GET(new Request('http://test'), {
      params: { id: '1' },
    })
    const dataPersonal = await resPersonal.json()
    expect(dataPersonal).toEqual([
      { id: '1a', description: 'Reduce dining out expenses' },
      { id: '1b', description: 'Cancel unused subscriptions' },
    ])

    const resGroup = await GET(
      new Request('http://test', { headers: { cookie: 'context=group' } }),
      { params: { id: 'g1' } },
    )
    const dataGroup = await resGroup.json()
    expect(dataGroup).toEqual([
      { id: 'g1a', description: 'Consolidate group purchases' },
      { id: 'g1b', description: 'Review shared service contracts' },
    ])
  })
})
