import { describe, it, expect, vi } from 'vitest'

// Helper to reload modules so that their shared state is reset between tests
async function loadScheduleModules() {
  vi.resetModules()
  const schedule = await import('../app/api/schedule/route')
  const task = await import('../app/api/task/[id]/route')
  return { schedule, task }
}

describe('schedule API routes', () => {
  it('handles GET and POST', async () => {
    process.env.CASCADENCE_API_BASE_URL = 'http://cascadence.test'
    process.env.CASCADENCE_API_TOKEN = 'token'

    const mockEvents = [
      { id: '1', title: 'Sample Event', start: '2024-01-01' },
    ]

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, init) => {
        const url = input.toString()
        const base = process.env.CASCADENCE_API_BASE_URL
        const method = (init?.method ?? 'GET').toUpperCase()
        if (url === `${base}/schedule`) {
          if (method === 'GET') {
            return new Response(JSON.stringify(mockEvents), { status: 200 })
          }
          if (method === 'POST') {
            const body = JSON.parse(init!.body as string)
            mockEvents.push(body)
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
            })
          }
        }
        throw new Error('Unexpected call')
      })

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
    expect(events.find((e: any) => e.id === newEvent.id)).toMatchObject(
      newEvent,
    )

    fetchMock.mockRestore()
  })

  it('handles PATCH via task API', async () => {
    process.env.CASCADENCE_API_BASE_URL = 'http://cascadence.test'
    process.env.CASCADENCE_API_TOKEN = 'token'

    const mockEvents: any[] = []
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, init) => {
        const url = input.toString()
        const base = process.env.CASCADENCE_API_BASE_URL
        const method = (init?.method ?? 'GET').toUpperCase()
        if (url === `${base}/schedule`) {
          if (method === 'GET') {
            return new Response(JSON.stringify(mockEvents), { status: 200 })
          }
          if (method === 'POST') {
            const body = JSON.parse(init!.body as string)
            mockEvents.push(body)
            return new Response(JSON.stringify({ success: true }), {
              status: 200,
            })
          }
        }
        const taskMatch = url.match(new RegExp(`${base}/task/(.+)`))
        if (taskMatch && method === 'PATCH') {
          const id = taskMatch[1]
          const idx = mockEvents.findIndex(e => e.id === id)
          if (idx === -1) {
            return new Response('Not found', { status: 404 })
          }
          const body = JSON.parse(init!.body as string)
          mockEvents[idx] = { ...mockEvents[idx], ...body }
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
          })
        }
        throw new Error('Unexpected call')
      })

    const {
      schedule: { GET, POST },
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

    fetchMock.mockRestore()
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
