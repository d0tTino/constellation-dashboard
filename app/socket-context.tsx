'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

const SocketContext = createContext<WebSocket | null>(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = process.env.NEXT_PUBLIC_WS_URL;
    if (!url) {
      console.error('WebSocket URL is not defined');
      return;
    }

    let ws: WebSocket;
    let reconnectAttempts = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      ws = new WebSocket(url);
      setSocket(ws);

      ws.onopen = () => {
        reconnectAttempts = 0;
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
      };

      ws.onclose = (event) => {
        console.error('WebSocket closed:', event);
        const delay = Math.min(10000, 1000 * 2 ** reconnectAttempts);
        reconnectAttempts += 1;
        timeout = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      if (timeout) clearTimeout(timeout);
      ws.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

