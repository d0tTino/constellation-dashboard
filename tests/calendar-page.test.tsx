import React from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react-dom/test-utils';

// mocks
let swrMock: any;
let calendarProps: any;
let socketMock: any;
vi.mock('swr', () => ({
  __esModule: true,
  default: (...args: any[]) => swrMock(...args)
}));
vi.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: (props: any) => {
    calendarProps = props;
    return React.createElement('div');
  }
}));
vi.mock('../app/socket-context', () => ({
  __esModule: true,
  useSocket: () => socketMock,
  useCalendarEvents: () => null,
  useFinanceUpdates: () => null,
}));
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'user1' } } })
}));

import CalendarPage from '../app/calendar/page';

function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe('CalendarPage', () => {
  beforeEach(() => {
    calendarProps = {};
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
    socketMock = { send: vi.fn() };
    document.cookie = 'context=personal';
  });

  it('configures multiple calendar views', () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({ data: { events: [], layers: [] }, mutate }));
    render(<CalendarPage />);
    expect(calendarProps.initialView).toBe('dayGridMonth');
    expect(calendarProps.headerToolbar.right).toBe('dayGridMonth,timeGridWeek,timeGridDay');
  });

  it('filters events by layer', () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({
      data: {
        events: [
          { id: '1', title: 'a', layer: 'a' },
          { id: '2', title: 'b', layer: 'b' },
        ],
        layers: [
          { id: 'a', name: 'A', color: '#f00' },
          { id: 'b', name: 'B', color: '#0f0' },
        ],
      },
      mutate,
    }));
    render(<CalendarPage />);

    const checkbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement;

    act(() => {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(calendarProps.events).toEqual([
      expect.objectContaining({ id: '2' }),
    ]);
  });

  it('sends NL command', async () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({ data: { events: [], layers: [] }, mutate }));

    const { container } = render(<CalendarPage />);

    const input = container.querySelector('input[name="nl"]') as HTMLInputElement;
    const form = container.querySelector('form') as HTMLFormElement;

    act(() => {
      input.value = 'hello';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    expect(socketMock.send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'calendar.nl.request', text: 'hello', context: 'personal', user: 'user1' })
    );
  });

  it('surfaces API errors', async () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({ data: { events: [], layers: [{ id: 'a', name: 'A', color: '#f00' }] }, mutate }));

    const fetchMock = vi.fn(() => Promise.resolve(new Response('Forbidden', { status: 403 })));
    // @ts-ignore
    global.fetch = fetchMock;

    const { container } = render(<CalendarPage />);

    const title = container.querySelector('input[name="title"]') as HTMLInputElement;
    const form = title.closest('form') as HTMLFormElement;

    act(() => {
      title.value = 'event';
      title.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toBe('Forbidden');
  });
});
