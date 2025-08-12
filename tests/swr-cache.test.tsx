import React from 'react'
import ReactDOM from 'react-dom/client'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import useSWR from 'swr'
import { SWRProvider } from '../lib/swr'
import { act } from 'react-dom/test-utils'

function render(ui: React.ReactElement) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = ReactDOM.createRoot(container)
  act(() => {
    root.render(ui)
  })
  return { container, root }
}

describe('SWR local cache', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('stores responses in and reads from localStorage', async () => {
    const key = '/api/ume/idea-seeds'
    const result = [{ id: '1', text: 'server' }]
    const fetchSpy = vi.fn(() => Promise.resolve(result))

    function Comp() {
      const { data } = useSWR(key, fetchSpy)
      return <div>{data ? data[0].text : ''}</div>
    }

    render(
      <SWRProvider>
        <Comp />
      </SWRProvider>
    )
    await act(async () => {})
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new Event('beforeunload'))
    expect(localStorage.getItem('swr-cache')).toContain('server')

    const fetchSpy2 = vi.fn(() => Promise.resolve(result))
    function Comp2() {
      const { data } = useSWR(key, fetchSpy2)
      return <div>{data ? data[0].text : ''}</div>
    }

    const { container: container2 } = render(
      <SWRProvider>
        <Comp2 />
      </SWRProvider>
    )
    await act(async () => {})
    expect(container2.textContent).toBe('server')
    expect(fetchSpy2).toHaveBeenCalledTimes(0)
  })

  it('bubbles non-OK responses as errors', async () => {
    const key = '/api/error'
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response('fail', { status: 500, statusText: 'Internal Server Error' })
      )
    )
    vi.spyOn(globalThis, 'fetch').mockImplementation(fetchMock as any)

    function Comp() {
      const { error } = useSWR(key)
      return <div>{error ? error.message : ''}</div>
    }

    const { container } = render(
      <SWRProvider>
        <Comp />
      </SWRProvider>
    )

    await act(async () => {})
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('Internal Server Error')
  })
})
