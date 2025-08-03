'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface SocketContextValue {
  socket: WebSocket | null;
  calendarEvent: any;
  financeUpdate: any;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  calendarEvent: null,
  financeUpdate: null,
});

export function useSocket() {
  return useContext(SocketContext).socket;
}

export function useCalendarEvents() {
  return useContext(SocketContext).calendarEvent;
}

export function useFinanceUpdates() {
  return useContext(SocketContext).financeUpdate;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [calendarEvent, setCalendarEvent] = useState<any>(null);
  const [financeUpdate, setFinanceUpdate] = useState<any>(null);

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

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'calendar.event.created':
              setCalendarEvent(data);
              break;
            case 'finance.decision.result':
            case 'finance.explain.result':
              setFinanceUpdate(data);
              break;
            default:
              break;
          }
        } catch (err) {
          console.error('Error parsing WebSocket message', err);
        }
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
    <SocketContext.Provider value={{ socket, calendarEvent, financeUpdate }}>
      {children}
    </SocketContext.Provider>
  );
}

