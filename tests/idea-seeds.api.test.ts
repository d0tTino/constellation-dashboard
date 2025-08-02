import { describe, it, expect, vi } from 'vitest'

async function loadModule() {
  vi.resetModules()
  return await import('../app/api/ume/idea-seeds/route')
}

describe('idea seeds API', () => {
  it('handles CRUD operations', async () => {
    const { GET, POST, PUT, DELETE } = await loadModule()

    let res = await GET()
    let seeds = await res.json()
    expect(seeds).toEqual([])

    const seed = { id: '1', text: 'test' }
    const postReq = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify(seed),
      headers: { 'Content-Type': 'application/json' },
    })
    const postRes = await POST(postReq)
    expect(postRes.status).toBe(201)

    res = await GET()
    seeds = await res.json()
    expect(seeds).toHaveLength(1)
    expect(seeds[0]).toMatchObject(seed)

    const updated = { id: '1', text: 'updated' }
    const putReq = new Request('http://test', {
      method: 'PUT',
      body: JSON.stringify(updated),
      headers: { 'Content-Type': 'application/json' },
    })
    const putRes = await PUT(putReq)
    expect(putRes.status).toBe(200)

    res = await GET()
    seeds = await res.json()
    expect(seeds[0]).toMatchObject(updated)

    const delReq = new Request('http://test', {
      method: 'DELETE',
      body: JSON.stringify({ id: '1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const delRes = await DELETE(delReq)
    expect(await delRes.json()).toEqual({ success: true })

    res = await GET()
    seeds = await res.json()
    expect(seeds).toEqual([])
  })
})
