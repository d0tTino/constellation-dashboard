import { describe, it, expect, vi, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { getServerSession } from 'next-auth'

vi.mock('next-auth', async () => {
  const actual = await vi.importActual<any>('next-auth')
  return {
    ...actual,
    getServerSession: vi.fn(),
  }
})

async function loadModules() {
  vi.resetModules()
  const schedule = await import('../app/api/schedule/route')
  const task = await import('../app/api/task/[id]/route')
  return { schedule, task }
}

describe('schedule group permissions', () => {
  const file = path.join(os.tmpdir(), 'events.group-perm.test.json')

  afterEach(async () => {
    await fs.unlink(file).catch(() => {})
    delete process.env.SCHEDULE_DATA_FILE
    vi.clearAllMocks()
  })

  it('GET /api/schedule returns 403 for unauthorized groups and succeeds for authorized', async () => {
    process.env.SCHEDULE_DATA_FILE = file
    await fs.writeFile(
      file,
      JSON.stringify({
        events: [{ id: '1', start: '2024-01-01', shared: true, groupId: 'team-a' }],
        layers: [],
      }),
    )

    const {
      schedule: { GET },
    } = await loadModules()

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', groups: ['team-a'] },
    })
    const badRes = await GET(
      new Request('http://test', {
        headers: { cookie: 'context=group; groupId=team-b' },
      }),
    )
    expect(badRes.status).toBe(403)

    const okRes = await GET(
      new Request('http://test', {
        headers: { cookie: 'context=group; groupId=team-a' },
      }),
    )
    expect(okRes.status).toBe(200)
    const data = await okRes.json()
    expect(data.events).toHaveLength(1)
  })

  it('POST /api/schedule enforces group membership', async () => {
    process.env.SCHEDULE_DATA_FILE = file
    await fs.writeFile(file, JSON.stringify({ events: [], layers: [] }))

    const {
      schedule: { POST, GET },
    } = await loadModules()

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', groups: ['team-a'] },
    })
    const badReq = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({
        id: '1',
        start: '2024-02-01',
        shared: true,
        groupId: 'team-b',
      }),
      headers: {
        'Content-Type': 'application/json',
        cookie: 'context=group; groupId=team-b',
      },
    })
    const badRes = await POST(badReq)
    expect(badRes.status).toBe(403)

    const okReq = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({
        id: '2',
        start: '2024-03-01',
        shared: true,
        groupId: 'team-a',
      }),
      headers: {
        'Content-Type': 'application/json',
        cookie: 'context=group; groupId=team-a',
      },
    })
    const okRes = await POST(okReq)
    expect(okRes.status).toBe(200)
    expect(await okRes.json()).toEqual({ success: true })

    const verify = await GET(
      new Request('http://test', {
        headers: { cookie: 'context=group; groupId=team-a' },
      }),
    )
    const data = await verify.json()
    expect(data.events.find((e: any) => e.id === '2')).toBeTruthy()
  })

  it('PATCH /api/task/:id enforces group membership', async () => {
    process.env.SCHEDULE_DATA_FILE = file
    await fs.writeFile(
      file,
      JSON.stringify({
        events: [{ id: '3', start: '2024-04-01', shared: true, groupId: 'team-a' }],
        layers: [],
      }),
    )

    const {
      task: { PATCH },
      schedule: { GET },
    } = await loadModules()

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', groups: ['team-b'] },
    })
    const badReq = new Request('http://test', {
      method: 'PATCH',
      body: JSON.stringify({ start: '2024-05-01' }),
      headers: {
        'Content-Type': 'application/json',
        cookie: 'context=team-a',
      },
    })
    const badRes = await PATCH(badReq, { params: { id: '3' } })
    expect(badRes.status).toBe(403)

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', groups: ['team-a'] },
    })
    const okReq = new Request('http://test', {
      method: 'PATCH',
      body: JSON.stringify({ start: '2024-05-01' }),
      headers: {
        'Content-Type': 'application/json',
        cookie: 'context=team-a',
      },
    })
    const okRes = await PATCH(okReq, { params: { id: '3' } })
    expect(okRes.status).toBe(200)
    expect(await okRes.json()).toEqual({ success: true })

    const verify = await GET(
      new Request('http://test', {
        headers: { cookie: 'context=group; groupId=team-a' },
      }),
    )
    const data = await verify.json()
    expect(data.events.find((e: any) => e.id === '3').start).toBe('2024-05-01')
  })
})

