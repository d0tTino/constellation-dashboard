import { describe, it, expect, vi } from 'vitest'

// Helper to reload a module so that its internal state is reset between tests
async function loadScheduleModule() {
  vi.resetModules()
  return await import('../app/api/schedule/route')
}

describe('schedule API routes', () => {
  it('handles GET and POST', async () => {
    const { GET, POST } = await loadScheduleModule()
    let res = await GET()
    let events = await res.json()
    expect(events).toHaveLength(1)

    const newEvent = { id: '2', title: 'Test', start: '2024-01-01' }
    const req = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify(newEvent),
      headers: { 'Content-Type': 'application/json' },
    })
    let postRes = await POST(req)
    expect(await postRes.json()).toEqual({ success: true })

    res = await GET()
    events = await res.json()
    expect(events).toHaveLength(2)
    expect(events.find((e: any) => e.id === newEvent.id)).toMatchObject(newEvent)
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
