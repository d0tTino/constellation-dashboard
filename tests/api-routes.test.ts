import { describe, it, expect, vi, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

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
  })

  it('handles GET and POST', async () => {
    process.env.SCHEDULE_DATA_FILE = file
    await fs.writeFile(
      file,
      JSON.stringify([{ id: '1', title: 'Sample Event', start: '2024-01-01' }]),
    )

    const {
      schedule: { GET, POST },
    } = await loadScheduleModules()
    let res = await GET()
    let events = await res.json()
    expect(events).toHaveLength(1)

    const newEvent = { id: '2', title: 'Test', start: '2024-01-01' }
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify(newEvent),
      headers: { 'Content-Type': 'application/json' },
    })
    const postRes = await POST(req)
    expect(await postRes.json()).toEqual({ success: true })

    res = await GET()
    events = await res.json()
    expect(events).toHaveLength(2)
    expect(events.find((e: any) => e.id === newEvent.id)).toMatchObject(newEvent)
  })

  it('handles PATCH via task API', async () => {
    process.env.SCHEDULE_DATA_FILE = file
    await fs.writeFile(file, '[]')

    const {
      schedule: { POST, GET },
      task: { PATCH },
    } = await loadScheduleModules()
    const newEvent = { id: '3', title: 'Patch Test', start: '2024-05-01' }
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify(newEvent),
      headers: { 'Content-Type': 'application/json' },
    })
    await POST(req)

    const patchReq = new Request('http://test', {
      method: 'PATCH',
      body: JSON.stringify({ start: '2024-06-01' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const patchRes = await PATCH(patchReq, { params: { id: newEvent.id } })
    expect(await patchRes.json()).toEqual({ success: true })

    const res = await GET()
    const events = await res.json()
    expect(events.find((e: any) => e.id === newEvent.id)).toMatchObject({
      start: '2024-06-01',
    })
  })
})

describe('budget report API route', () => {
  it('returns static budget data', async () => {
    const { GET } = await import('../app/api/v1/report/budget/route')
    const res = await GET()
    const data = await res.json()
    expect(data).toEqual([
      { category: 'Rent', amount: 1000 },
      { category: 'Food', amount: 300 },
      { category: 'Utilities', amount: 150 },
    ])
  })
})
