import React from 'react'
import ReactDOM from 'react-dom/client'
import { act } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ContextSwitcher from '../app/components/ContextSwitcher'

let sessionMock: any
vi.mock('next-auth/react', () => ({
  useSession: () => sessionMock,
}))

function render(ui: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = ReactDOM.createRoot(container)
  act(() => {
    root.render(ui)
  })
  return { container, root }
}

describe('ContextSwitcher', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.cookie = 'context=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    vi.unstubAllGlobals()
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    sessionMock = { data: { user: { id: '1', groups: ['team-a', 'team-b'] } } }
  })

  it('uses initial context from cookie', async () => {
    document.cookie = 'context=team-b'
    render(<ContextSwitcher />)
    await act(async () => {})
    const select = document.querySelector('select') as HTMLSelectElement
    expect(select.value).toBe('team-b')
  })

  it('populates group options from API', async () => {
    sessionMock = { data: { user: { id: '1' } } }
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ groups: ['team-a', 'team-b'] }), { status: 200 })
      )
    )
    global.fetch = fetchMock as any
    render(<ContextSwitcher />)
    await act(async () => {})
    const options = Array.from(document.querySelectorAll('option')).map(
      o => (o as HTMLOptionElement).value
    )
    expect(options).toContain('team-a')
    expect(options).toContain('team-b')
    expect(fetchMock).toHaveBeenCalledWith('/api/groups')
  })

  it('renders an associated label', async () => {
    render(<ContextSwitcher />)
    await act(async () => {})
    const label = document.querySelector('label')
    const select = document.querySelector('select') as HTMLSelectElement
    expect(label).toBeTruthy()
    expect(label?.getAttribute('for')).toBe(select.id)
    expect(label?.textContent).toContain('Context')
  })

  it('updates cookie on selection change', async () => {
    document.cookie = 'context=team-a'
    render(<ContextSwitcher />)
    await act(async () => {})
    const select = document.querySelector('select') as HTMLSelectElement
    act(() => {
      select.value = 'team-b'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(document.cookie).toContain('context=team-b')
    expect(select.value).toBe('team-b')
  })
})
