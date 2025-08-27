import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}))

import { getToken } from 'next-auth/jwt'
import { middleware } from '../middleware'

function mockGetToken(value: any) {
  ;(getToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(value)
}

describe('middleware', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('redirects unauthenticated requests to /login', async () => {
    mockGetToken(null)
    const req = new NextRequest('http://localhost/dashboard')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/login')
  })

  it('allows access to public routes', async () => {
    mockGetToken(null)
    const req = new NextRequest('http://localhost/login')
    const res = await middleware(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })

  it('allows authenticated requests', async () => {
    mockGetToken({ sub: '1' })
    const req = new NextRequest('http://localhost/dashboard')
    const res = await middleware(req)
    expect(res.status).toBe(200)
  })
})
