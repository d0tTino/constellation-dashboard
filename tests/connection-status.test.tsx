import React from 'react'
import ReactDOM from 'react-dom/client'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from 'react-dom/test-utils'
import ConnectionStatus, { getConnectionStatusMessage } from '../app/components/ConnectionStatus'

let socketStatusMock: any
vi.mock('../app/socket-context', () => ({
  useSocketStatus: () => socketStatusMock,
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

describe('ConnectionStatus', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  })

  it('displays connecting message', () => {
    socketStatusMock = { connectionState: 'connecting', lastError: null, retry: vi.fn() }
    const { container } = render(<ConnectionStatus />)
    expect(container.textContent).toBe(
      getConnectionStatusMessage('connecting')
    )
  })

  it('marks status message as polite live region', () => {
    socketStatusMock = { connectionState: 'error', lastError: null, retry: vi.fn() }
    const { container } = render(<ConnectionStatus />)
    const div = container.querySelector('div') as HTMLDivElement
    expect(div.getAttribute('aria-live')).toBe('polite')
  })

  it('displays error message and retries on click', () => {
    const retry = vi.fn()
    const lastError = { code: '500', message: 'fail' }
    socketStatusMock = { connectionState: 'error', lastError, retry }
    const { container } = render(<ConnectionStatus />)
    const div = container.querySelector('div') as HTMLDivElement
    expect(div.textContent).toBe(
      getConnectionStatusMessage('error', lastError)
    )
    act(() => {
      div.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(retry).toHaveBeenCalled()
  })
})
