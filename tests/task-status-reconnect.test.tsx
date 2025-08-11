import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Task status websocket reconnection', () => {
  const originalEnv = process.env.NEXT_PUBLIC_TASK_CASCADENCE_WS_URL

  beforeEach(() => {
    vi.resetModules()
    process.env.NEXT_PUBLIC_TASK_CASCADENCE_WS_URL = 'ws://example.com'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_TASK_CASCADENCE_WS_URL
    } else {
      process.env.NEXT_PUBLIC_TASK_CASCADENCE_WS_URL = originalEnv
    }
    vi.useRealTimers()
  })

  it('reconnects with exponential backoff when the socket closes', async () => {
    vi.useFakeTimers()
    const wsInstances: any[] = []

    class MockWebSocket {
      onopen: ((ev: any) => void) | null = null
      onclose: ((ev: any) => void) | null = null
      onmessage: ((ev: any) => void) | null = null
      close = vi.fn()
      constructor() {
        wsInstances.push(this)
      }
    }

    const wsMock = vi.fn(() => new MockWebSocket() as unknown as WebSocket)
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
    vi.stubGlobal('WebSocket', wsMock)

    const { subscribeToTaskStatus } = await import('../lib/taskCascadence')

    const unsubscribe = subscribeToTaskStatus(() => {})

    expect(wsMock).toHaveBeenCalledTimes(1)

    const first = wsInstances[0]
    first.onclose?.({})

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)

    await vi.runOnlyPendingTimersAsync()

    expect(wsMock).toHaveBeenCalledTimes(2)

    const second = wsInstances[1]
    second.onclose?.({})

    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 2000)

    unsubscribe()
  })
})

