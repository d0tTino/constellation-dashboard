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

describe('calendar websocket notifications', () => {
  const file = path.join(os.tmpdir(), 'events.ws.test.json')
  const originalEnv = process.env.NEXT_PUBLIC_WS_URL

  afterEach(async () => {
    await fs.unlink(file).catch(() => {})
    delete process.env.SCHEDULE_DATA_FILE
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_WS_URL
    } else {
      process.env.NEXT_PUBLIC_WS_URL = originalEnv
    }
    vi.clearAllMocks()
  })

  it('sends messages on create and update', async () => {
    process.env.NEXT_PUBLIC_WS_URL = 'ws://test'
    process.env.SCHEDULE_DATA_FILE = file
    await fs.writeFile(file, JSON.stringify({ events: [], layers: [] }))

    vi.mocked(getServerSession).mockResolvedValue({ user: { id: '1' } })

    const send = vi.fn()
    const wsInstance: any = { send, readyState: 1, OPEN: 1 }
    const wsMock = vi.fn(() => wsInstance)
    vi.stubGlobal('WebSocket', wsMock)

    const {
      schedule: { POST },
      task: { PATCH },
    } = await loadModules()

    const event = { id: '1', start: '2024-01-01', shared: false }
    const postReq = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify(event),
      headers: { 'Content-Type': 'application/json', cookie: 'context=personal' },
    })
    await POST(postReq)
    expect(send).toHaveBeenCalledTimes(1)
    expect(JSON.parse(send.mock.calls[0][0])).toMatchObject({
      type: 'calendar.event.created',
      event,
    })

    const patchReq = new Request('http://test', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
      headers: { 'Content-Type': 'application/json', cookie: 'context=personal' },
    })
    await PATCH(patchReq, { params: { id: event.id } })
    expect(send).toHaveBeenCalledTimes(2)
    expect(JSON.parse(send.mock.calls[1][0])).toMatchObject({
      type: 'calendar.event.updated',
      event: { ...event, title: 'Updated' },
    })
  })
})

