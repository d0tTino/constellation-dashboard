import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, beforeEach } from 'vitest';
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
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('provides a WebSocket instance after initialization', async () => {
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
    expect(socket).toBeInstanceOf(WebSocket);
  });
});
