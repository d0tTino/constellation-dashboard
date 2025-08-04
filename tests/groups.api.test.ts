import { describe, it, expect, vi } from 'vitest'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', async () => {
  const actual = await vi.importActual<any>('next-auth')
  return {
    ...actual,
    getServerSession: vi.fn(),
  }
})

describe('groups API route', () => {
  it('returns groups from session', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: '1', groups: ['Team A'] } })
    const { GET } = await import('../app/api/groups/route')
    const res = await GET()
    const data = await res.json()
    expect(data).toEqual({ groups: ['Team A'] })
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const { GET } = await import('../app/api/groups/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })
})
