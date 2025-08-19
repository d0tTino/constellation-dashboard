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

vi.mock('../lib/ws-server', async () => {
  const actual = await vi.importActual<any>('../lib/ws-server')
  return { ...actual, sendWsMessage: vi.fn() }
})

async function loadModules() {
  vi.resetModules()
  const schedule = await import('../app/api/schedule/route')
  const task = await import('../app/api/task/[id]/route')
  return { schedule, task }
}

describe('task delete API', () => {
  const file = path.join(os.tmpdir(), 'events.delete.test.json')

  afterEach(async () => {
    await fs.unlink(file).catch(() => {})
    delete process.env.SCHEDULE_DATA_FILE
    vi.clearAllMocks()
  })

  it('deletes event and broadcasts message', async () => {
    process.env.SCHEDULE_DATA_FILE = file
    await fs.writeFile(file, JSON.stringify({ events: [], layers: [] }))

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1' },
      accessToken: 'tok',
    })

    const {
      schedule: { POST },
      task: { DELETE, GET },
    } = await loadModules()

    const event = { id: 'd1', start: '2024-01-01', shared: false }
    const postReq = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: { 'Content-Type': 'application/json', cookie: 'context=personal' },
    })
    await POST(postReq)

    const delReq = new Request('http://test', {
      method: 'DELETE',
      headers: { cookie: 'context=personal' },
    })
    const delRes = await DELETE(delReq, { params: { id: event.id } })
    expect(await delRes.json()).toEqual({ success: true })

    const getRes = await GET(
      new Request('http://test', { headers: { cookie: 'context=personal' } }),
      { params: { id: event.id } },
    )
    expect(getRes.status).toBe(404)

    const { sendWsMessage } = await import('../lib/ws-server')
    expect(sendWsMessage).toHaveBeenCalledWith(
      { type: 'calendar.event.deleted', id: event.id },
      'tok',
    )
  })
})

