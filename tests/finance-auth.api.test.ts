import { describe, it, expect, vi, afterEach } from 'vitest'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', async () => {
  const actual = await vi.importActual<any>('next-auth')
  return {
    ...actual,
    getServerSession: vi.fn(),
  }
})

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

describe('finance report auth', () => {
  const routes: [string, any][] = [
    ['../app/api/v1/report/budget/route', undefined],
    ['../app/api/v1/report/budget/history/route', undefined],
    ['../app/api/v1/report/budget/history/[id]/route', { params: { id: 'g1' } }],
  ]

  it.each(routes)('returns 401 when unauthenticated for %s', async (path, params) => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const mod: any = await import(path)
    const res = await mod.GET(
      new Request('http://test', { headers: { cookie: 'context=personal' } }),
      params,
    )
    expect(res.status).toBe(401)
  })

  it.each(routes)('returns 403 for unauthorized group access on %s', async (path, params) => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: '1', groups: [] } })
    const mod: any = await import(path)
    const res = await mod.GET(
      new Request('http://test', { headers: { cookie: 'context=team-a' } }),
      params,
    )
    expect(res.status).toBe(403)
  })
})
