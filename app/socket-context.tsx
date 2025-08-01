'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const SocketContext = createContext<WebSocket | null>(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ws = new WebSocket('ws://localhost:3001');
    setSocket(ws);
    return () => ws.close();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

