'use client';
import { createContext, useContext, useEffect, useRef } from 'react';

const SocketContext = createContext<WebSocket | null>(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    socketRef.current = new WebSocket('ws://localhost:3001');
    return () => socketRef.current?.close();
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}

