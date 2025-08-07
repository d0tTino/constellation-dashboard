import React from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SocketProvider, useSocket } from '../app/socket-context';
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
});
