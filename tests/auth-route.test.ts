import { describe, it, expect, vi, beforeAll } from 'vitest'

vi.mock('next-auth', () => {
  return {
    __esModule: true,
    default: (options: any) => {
      return async (req: Request) => {
        const url = new URL(req.url)
        if (req.method === 'POST' && url.pathname.endsWith('/callback/credentials')) {
          const { username, password } = await req.json()
          const provider = options.providers.find((p: any) => p.id === 'credentials')
          const user = await provider.options.authorize({ username, password })
          if (!user) {
            return new Response('Unauthorized', { status: 401 })
          }
          const session = await options.callbacks.session({
            session: { user },
            token: { sub: user.id },
          })
          return new Response(JSON.stringify(session), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (req.method === 'GET' && url.pathname.endsWith('/callback/github')) {
          const provider = options.providers.find((p: any) => p.id === 'github')
          const user = { id: '2', name: 'GitHub User' }
          const session = await options.callbacks.session({
            session: { user },
            token: { sub: user.id, accessToken: 'gh-token-123' },
          })
          return new Response(JSON.stringify(session), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return new Response(null, { status: 404 })
      }
    },
  }
})

let POST: any
let GET: any

beforeAll(async () => {
  process.env.GITHUB_ID = 'id'
  process.env.GITHUB_SECRET = 'secret'
  const route = await import('../app/api/auth/[...nextauth]/route')
  POST = route.POST
  GET = route.GET
})

describe('auth route', () => {
  it('returns session with user id for valid credentials', async () => {
    const req = new Request('http://localhost/api/auth/callback/credentials', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'password' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const session = await res.json()
    expect(session.user.id).toBe('1')
  })

  it('returns 401 for invalid credentials', async () => {
    const req = new Request('http://localhost/api/auth/callback/credentials', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'wrong' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns session with user id and access token for GitHub OAuth', async () => {
    const req = new Request('http://localhost/api/auth/callback/github?code=abc', {
      method: 'GET',
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const session = await res.json()
    expect(session.user.id).toBe('2')
    expect(session.accessToken).toBe('gh-token-123')
  })
})

