import React from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SocketProvider, useSocket, useCalendarEvents, useFinanceUpdates } from '../app/socket-context';
import { act } from 'react-dom/test-utils';

function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe('SocketProvider', () => {
  const originalEnv = process.env.NEXT_PUBLIC_WS_URL;

  beforeEach(() => {
    document.body.innerHTML = '';
    delete process.env.NEXT_PUBLIC_WS_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_WS_URL;
    } else {
      process.env.NEXT_PUBLIC_WS_URL = originalEnv;
    }
  });

  it('provides a WebSocket instance after initialization', async () => {
    const wsInstance = { close: vi.fn() } as unknown as WebSocket;
    const wsMock = vi.fn(() => wsInstance);
    vi.stubGlobal('WebSocket', wsMock);

    let socket: WebSocket | null = null;
    function GetSocket() {
      socket = useSocket();
      return null;
    }

    render(
      <SocketProvider>
        <GetSocket />
      </SocketProvider>
    );

    await act(async () => {});

    expect(wsMock).toHaveBeenCalledWith('ws://localhost:3001');
    expect(socket).toBe(wsInstance);
  });

  it('reconnects with exponential backoff when the socket closes', async () => {
    vi.useFakeTimers();
    const wsInstances: any[] = [];

    class MockWebSocket {
      onopen: ((ev: any) => void) | null = null;
      onclose: ((ev: any) => void) | null = null;
      onerror: ((ev: any) => void) | null = null;
      onmessage: ((ev: any) => void) | null = null;
      close = vi.fn();
      constructor() {
        wsInstances.push(this);
      }
    }

    const wsMock = vi.fn(() => new MockWebSocket() as unknown as WebSocket);
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    vi.stubGlobal('WebSocket', wsMock);

    render(
      <SocketProvider>
        <div />
      </SocketProvider>
    );

    await act(async () => {});

    const first = wsInstances[0];
    first.onclose?.({});

    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

    await act(async () => {
      vi.runOnlyPendingTimers();
    });

    const second = wsInstances[1];
    second.onclose?.({});

    expect(setTimeoutSpy).toHaveBeenLastCalledWith(expect.any(Function), 2000);

    vi.useRealTimers();
  });

  it('updates context fields when messages are received', async () => {
    const wsInstance: any = {
      close: vi.fn(),
      onopen: null,
      onclose: null,
      onerror: null,
      onmessage: null,
    };

    const wsMock = vi.fn(() => wsInstance as unknown as WebSocket);
    vi.stubGlobal('WebSocket', wsMock);

    let calendarEvent: any = null;
    let financeUpdate: any = null;
    function GetUpdates() {
      calendarEvent = useCalendarEvents();
      financeUpdate = useFinanceUpdates();
      return null;
    }

    render(
      <SocketProvider>
        <GetUpdates />
      </SocketProvider>
    );

    await act(async () => {});

    const calendarData = { type: 'calendar.event.created', value: 1 };
    await act(async () => {
      wsInstance.onmessage?.({ data: JSON.stringify(calendarData) });
    });
    expect(calendarEvent).toEqual(calendarData);

    const financeData = { type: 'finance.decision.result', value: 2 };
    await act(async () => {
      wsInstance.onmessage?.({ data: JSON.stringify(financeData) });
    });
    expect(financeUpdate).toEqual(financeData);
  });
});
