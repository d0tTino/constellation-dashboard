import { describe, it, expect, vi } from 'vitest'

async function loadIdeaSeedModules() {
  vi.resetModules()
  const listHandlers = await import('../app/api/ume/idea-seeds/route')
  const itemHandlers = await import('../app/api/ume/idea-seeds/[id]/route')
  return { listHandlers, itemHandlers }
}

describe('ume idea seeds API', () => {
  it('performs CRUD operations', async () => {
    const { listHandlers: { GET, POST }, itemHandlers: { PUT, DELETE } } = await loadIdeaSeedModules()

    // initial list should be empty
    let res = await GET()
    let seeds = await res.json()
    expect(seeds).toHaveLength(0)

    // create a seed
    const createReq = new Request('http://test', {
      method: 'POST',
      body: JSON.stringify({ text: 'First idea' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const createRes = await POST(createReq)
    const created = await createRes.json()
    expect(created).toMatchObject({ text: 'First idea' })
    const id = created.id

    // ensure seed was added
    res = await GET()
    seeds = await res.json()
    expect(seeds).toHaveLength(1)
    expect(seeds[0]).toMatchObject({ id, text: 'First idea' })

    // update the seed
    const updateReq = new Request('http://test', {
      method: 'PUT',
      body: JSON.stringify({ text: 'Updated idea' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const updateRes = await PUT(updateReq, { params: { id } })
    expect(await updateRes.json()).toEqual({ success: true })

    res = await GET()
    seeds = await res.json()
    expect(seeds[0]).toMatchObject({ id, text: 'Updated idea' })

    // delete the seed
    const deleteRes = await DELETE(new Request('http://test'), { params: { id } })
    expect(await deleteRes.json()).toEqual({ success: true })

    res = await GET()
    seeds = await res.json()
    expect(seeds).toHaveLength(0)
  })
})
