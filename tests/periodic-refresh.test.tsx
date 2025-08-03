import React from 'react'
import ReactDOM from 'react-dom/client'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

describe('SWR periodic refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('revalidates on a fixed interval', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve('data'))
    function Comp() {
      useSWR('/api/ume/idea-seeds', fetchSpy)
      return null
    }
    render(
      <SWRProvider>
        <Comp />
      </SWRProvider>
    )
    await act(async () => {})
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    await act(async () => {
      vi.advanceTimersByTime(31000)
    })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})
