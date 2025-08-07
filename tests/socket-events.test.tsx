import React from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';

import { SocketProvider } from '../app/socket-context';
import ScheduleCalendar from '../app/components/ScheduleCalendar';
import FinancePage from '../app/finance/page';

vi.mock('@fullcalendar/react', () => ({ __esModule: true, default: () => React.createElement('div') }));
vi.mock('@fullcalendar/daygrid', () => ({ __esModule: true, default: {} }));
vi.mock('@fullcalendar/timegrid', () => ({ __esModule: true, default: {} }));
vi.mock('@fullcalendar/interaction', () => ({ __esModule: true, default: {}, EventDropArg: class {} }));

let swrMock: any;
vi.mock('swr', () => ({ __esModule: true, default: (...args: any[]) => swrMock(...args) }));

function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe('socket event propagation', () => {
  let onmessage: ((ev: any) => void) | null;
  const originalEnv = process.env.NEXT_PUBLIC_WS_URL;

  beforeEach(() => {
    document.body.innerHTML = '';
    onmessage = null;
    delete process.env.NEXT_PUBLIC_WS_URL;
    const wsInstance: any = {
      close: vi.fn(),
      set onmessage(fn) {
        onmessage = fn;
      },
      get onmessage() {
        return onmessage;
      },
    };
    vi.stubGlobal('WebSocket', vi.fn(() => wsInstance));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_WS_URL;
    } else {
      process.env.NEXT_PUBLIC_WS_URL = originalEnv;
    }
  });

  it('refreshes calendar when an event is created', async () => {
    const mutate = vi.fn();
    swrMock = vi.fn();
    render(
      <SocketProvider>
        <ScheduleCalendar events={[]} layers={[]} visibleLayers={[]} mutate={mutate} />
      </SocketProvider>
    );
    await act(async () => {});
    await act(async () => {
      onmessage?.({ data: JSON.stringify({ type: 'calendar.event.created' }) });
    });
    expect(mutate).toHaveBeenCalled();
  });

  it('refreshes finance data on updates', async () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({ data: [{ category: 'Rent', amount: 1000, costOfDeviation: 0 }], mutate }));
    render(
      <SocketProvider>
        <FinancePage />
      </SocketProvider>
    );
    await act(async () => {});
    await act(async () => {
      onmessage?.({ data: JSON.stringify({ type: 'finance.decision.result' }) });
    });
    await act(async () => {});
    expect(mutate).toHaveBeenCalledTimes(1);
    await act(async () => {
      onmessage?.({ data: JSON.stringify({ type: 'finance.explain.result' }) });
    });
    await act(async () => {});
    expect(mutate).toHaveBeenCalledTimes(2);
  });
});
