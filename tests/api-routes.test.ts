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

// Helper to reload modules so that their shared state is reset between tests
async function loadScheduleModules() {
  vi.resetModules()
  const schedule = await import('../app/api/schedule/route')
  const task = await import('../app/api/task/[id]/route')
  return { schedule, task }
}

describe('schedule API routes', () => {
  const file = path.join(os.tmpdir(), 'events.test.json')

  afterEach(async () => {
    await fs.unlink(file).catch(() => {})
    delete process.env.SCHEDULE_DATA_FILE
    vi.clearAllMocks()
  })

  it('handles GET and POST', async () => {
    process.env.SCHEDULE_DATA_FILE = file
    await fs.writeFile(
      file,
      JSON.stringify({
        events: [{ id: '1', title: 'Sample Event', start: '2024-01-01', shared: false }],
        layers: [],
      }),
    )

    vi.mocked(getServerSession).mockResolvedValue({ user: { id: '1' } })

    const {
      schedule: { GET, POST },
    } = await loadScheduleModules()
    let res = await GET(new Request('http://test', { headers: { cookie: 'context=personal' } }))
    let data = await res.json()
    expect(data.events).toHaveLength(1)

    const newEvent = { id: '2', title: 'Test', start: '2024-01-01', shared: false }
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify(newEvent),
      headers: { 'Content-Type': 'application/json', cookie: 'context=personal' },
    })
    const postRes = await POST(req)
    expect(await postRes.json()).toEqual({ success: true })

    res = await GET(new Request('http://test', { headers: { cookie: 'context=personal' } }))
    data = await res.json()
    expect(data.events).toHaveLength(2)
    expect(data.events.find((e: any) => e.id === newEvent.id)).toMatchObject(newEvent)
  })

  it('handles PATCH via task API', async () => {
    process.env.SCHEDULE_DATA_FILE = file
    await fs.writeFile(file, JSON.stringify({ events: [], layers: [] }))

    vi.mocked(getServerSession).mockResolvedValue({ user: { id: '1' } })

    const {
      schedule: { POST, GET },
      task: { PATCH },
    } = await loadScheduleModules()
    const newEvent = { id: '3', title: 'Patch Test', start: '2024-05-01', shared: false }
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify(newEvent),
      headers: { 'Content-Type': 'application/json', cookie: 'context=personal' },
    })
    await POST(req)

    const patchReq = new Request('http://test', {
      method: 'PATCH',
      body: JSON.stringify({ start: '2024-06-01' }),
      headers: { 'Content-Type': 'application/json', cookie: 'context=personal' },
    })
    const patchRes = await PATCH(patchReq, { params: { id: newEvent.id } })
    expect(await patchRes.json()).toEqual({ success: true })

    const res = await GET(new Request('http://test', { headers: { cookie: 'context=personal' } }))
    const data = await res.json()
    expect(data.events.find((e: any) => e.id === newEvent.id)).toMatchObject({
      start: '2024-06-01',
    })
  })

  it('returns 401 when unauthenticated', async () => {
    process.env.SCHEDULE_DATA_FILE = file
    await fs.writeFile(file, JSON.stringify({ events: [], layers: [] }))

    vi.mocked(getServerSession).mockResolvedValue(null)

    const {
      schedule: { GET },
    } = await loadScheduleModules()
    const res = await GET(new Request('http://test', { headers: { cookie: 'context=personal' } }))
    expect(res.status).toBe(401)
  })

  it('enforces context isolation and permissions', async () => {
    process.env.SCHEDULE_DATA_FILE = file
    await fs.writeFile(
      file,
      JSON.stringify({
        events: [
          { id: '1', start: '2024-01-01', shared: false },
          { id: '2', start: '2024-01-02', shared: true },
        ],
        layers: [],
      }),
    )

    vi.mocked(getServerSession).mockResolvedValue({ user: { id: '1' } })
    const {
      schedule: { GET, POST },
    } = await loadScheduleModules()

    const resPersonal = await GET(
      new Request('http://test', { headers: { cookie: 'context=personal' } }),
    )
    const dataPersonal = await resPersonal.json()
    expect(dataPersonal.events).toHaveLength(1)

    const resGroup = await GET(
      new Request('http://test', { headers: { cookie: 'context=group' } }),
    )
    const dataGroup = await resGroup.json()
    expect(dataGroup.events).toHaveLength(1)

    const badReq = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({ id: '3', start: '2024-03-01', shared: true }),
      headers: { 'Content-Type': 'application/json', cookie: 'context=personal' },
    })
    const badRes = await POST(badReq)
    expect(badRes.status).toBe(403)
  })
})

describe('budget report API route', () => {
  it('returns personal and group budget data based on context', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', groups: ['team-a'] },
    })
    const { GET } = await import('../app/api/v1/report/budget/route')
    const resPersonal = await GET(
      new Request('http://test', { headers: { cookie: 'context=personal' } }),
    )
    const dataPersonal = await resPersonal.json()
    expect(dataPersonal).toEqual([
      { category: 'Rent', amount: 1000 },
      { category: 'Food', amount: 300 },
      { category: 'Utilities', amount: 150 },
    ])

    const resGroup = await GET(
      new Request('http://test', { headers: { cookie: 'context=team-a' } }),
    )
    const dataGroup = await resGroup.json()
    expect(dataGroup).toEqual([
      { category: 'Office Rent', amount: 2000 },
      { category: 'Team Meals', amount: 800 },
      { category: 'Shared Utilities', amount: 400 },
    ])
  })
})
