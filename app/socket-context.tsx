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
    const url = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001';
    const ws = new WebSocket(url);
    setSocket(ws);
    return () => ws.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

