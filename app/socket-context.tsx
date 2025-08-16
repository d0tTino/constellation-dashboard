'use client';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import {
  TaskStatusEvent,
  useTaskStatus as useTaskStatusSubscription,
} from '../lib/taskCascadence';

interface SocketContextValue {
  socket: WebSocket | null;
  calendarEvent: any;
  financeUpdate: any;
  taskStatus: TaskStatusEvent | null;
  connectionState: 'connecting' | 'open' | 'error';
  lastError: { code: number; message: string } | null;
  retry: () => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  calendarEvent: null,
  financeUpdate: null,
  taskStatus: null,
  connectionState: 'connecting',
  lastError: null,
  retry: () => {},
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

export function useTaskStatus() {
  return useContext(SocketContext).taskStatus;
}

export function useSocketStatus() {
  const { connectionState, lastError, retry } = useContext(SocketContext);
  return { connectionState, lastError, retry };
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [calendarEvent, setCalendarEvent] = useState<any>(null);
  const [financeUpdate, setFinanceUpdate] = useState<any>(null);
  const [connectionState, setConnectionState] = useState<'connecting' | 'open' | 'error'>('connecting');
  const [lastError, setLastError] = useState<{ code: number; message: string } | null>(null);
  const taskStatus = useTaskStatusSubscription();
  const { data: session } = useSession();
  const accessToken = (session as any)?.accessToken as string | undefined;
  const connectRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (typeof window === 'undefined' || !accessToken) return;
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001';

    let ws: WebSocket;
    let reconnectAttempts = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      setConnectionState('connecting');
      setLastError(null);
      const url = `${baseUrl}?token=${encodeURIComponent(accessToken)}`;
      ws = new WebSocket(url);
      setSocket(ws);

      ws.onopen = () => {
        reconnectAttempts = 0;
        setConnectionState('open');
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setConnectionState('error');
        setLastError({ code: 0, message: 'WebSocket error' });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'calendar.event.created':
              setCalendarEvent(data);
              break;
            case 'calendar.event.updated':
              setCalendarEvent(data);
              break;
            case 'calendar.event.deleted':
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
        if ([401, 4001, 4401].includes(event.code)) {
          signIn();
          return;
        }
        setConnectionState('error');
        setLastError({ code: event.code, message: event.reason });
        const delay = Math.min(10000, 1000 * 2 ** reconnectAttempts);
        reconnectAttempts += 1;
        timeout = setTimeout(connect, delay);
      };
    };

    connectRef.current = () => {
      if (timeout) clearTimeout(timeout);
      reconnectAttempts = 0;
      connect();
    };

    connect();

    return () => {
      if (timeout) clearTimeout(timeout);
      ws.close();
    };
  }, [accessToken]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        calendarEvent,
        financeUpdate,
        taskStatus,
        connectionState,
        lastError,
        retry: connectRef.current,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

