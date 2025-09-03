import React from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';

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
  useTaskStatus: () => null,
  useSocketStatus: () => ({ connectionState: 'open', lastError: null, retry: () => {} }),
}));
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'user1' } } })
}));
vi.mock('../lib/hooks/useUserColors', () => ({
  __esModule: true,
  default: () => ({})
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

describe.skip('CalendarPage', () => {
  beforeEach(() => {
    calendarProps = {};
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
    socketMock = { send: vi.fn() };
    document.cookie = 'context=personal';
    document.cookie = 'groupId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('renders NL field with label and placeholder', () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({ data: { events: [], layers: [] }, mutate }));
    const { container } = render(<CalendarPage />);

    const label = container.querySelector('label[for="nl"]');
    expect(label?.textContent).toBe('Describe your event');

    const input = container.querySelector('input[name="nl"]') as HTMLInputElement;
    expect(input.placeholder).toBe('Lunch with Mark tomorrow at noon');
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

  it('updates layer field when selecting from dropdown', () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({
      data: {
        events: [],
        layers: [
          { id: 'a', name: 'A', color: '#f00' },
          { id: 'b', name: 'B', color: '#0f0' },
        ],
      },
      mutate,
    }));

    const { container } = render(<CalendarPage />);

    const layerSelect = container.querySelector('select[name="layer"]') as HTMLSelectElement;
    expect(layerSelect.value).toBe('a');

    act(() => {
      layerSelect.value = 'b';
      layerSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(layerSelect.value).toBe('b');
  });

  it('sends NL command with personal context', async () => {
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

    expect(socketMock.send).toHaveBeenCalled();
    const payload = JSON.parse(socketMock.send.mock.calls[0][0]);
    expect(payload).toMatchObject({
      type: 'calendar.nl.request',
      text: 'hello',
      context: 'personal',
      user: 'user1',
    });
    expect(payload.groupId).toBeUndefined();
  });

  it('sends NL command with group context', async () => {
    document.cookie = 'context=group';
    document.cookie = 'groupId=team-a';
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({ data: { events: [], layers: [] }, mutate }));

    const { container } = render(<CalendarPage />);

    const input = container.querySelector('input[name="nl"]') as HTMLInputElement;
    const form = container.querySelector('form') as HTMLFormElement;

    act(() => {
      input.value = 'hi';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    expect(socketMock.send).toHaveBeenCalled();
    const payload = JSON.parse(socketMock.send.mock.calls[0][0]);
    expect(payload).toEqual({
      type: 'calendar.nl.request',
      text: 'hi',
      context: 'group',
      groupId: 'team-a',
      user: 'user1',
    });
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

  it('creates events with id, shared flag, and selected layer', async () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({
      data: {
        events: [],
        layers: [
          { id: 'a', name: 'A', color: '#f00' },
          { id: 'b', name: 'B', color: '#0f0' },
        ],
      },
      mutate,
    }));

    const fetchMock = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    // @ts-ignore
    global.fetch = fetchMock;
    // @ts-ignore
    global.crypto = { randomUUID: () => 'uuid-1' };

    const { container } = render(<CalendarPage />);

    const title = container.querySelector('input[name="title"]') as HTMLInputElement;
    const start = container.querySelector('input[name="start"]') as HTMLInputElement;
    const layerSelect = container.querySelector('select[name="layer"]') as HTMLSelectElement;
    const shared = container.querySelector('input[name="shared"]') as HTMLInputElement;
    const form = title.closest('form') as HTMLFormElement;

    act(() => {
      title.value = 'event';
      title.dispatchEvent(new Event('input', { bubbles: true }));
      start.value = '2023-01-01';
      start.dispatchEvent(new Event('input', { bubbles: true }));
      layerSelect.value = 'b';
      layerSelect.dispatchEvent(new Event('change', { bubbles: true }));
      shared.checked = true;
      shared.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(layerSelect.value).toBe('b');

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    expect(fetchMock).toHaveBeenCalled();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.id).toBe('uuid-1');
    expect(body.shared).toBe(true);
    expect(body.layer).toBe('b');
    expect(body.owner).toBe('user1');
  });

  it('creates events with invitees and permissions', async () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({
      data: {
        events: [],
        layers: [
          { id: 'a', name: 'A', color: '#f00' },
          { id: 'b', name: 'B', color: '#0f0' },
        ],
      },
      mutate,
    }));

    const fetchMock = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })));
    // @ts-ignore
    global.fetch = fetchMock;
    // @ts-ignore
    global.crypto = { randomUUID: () => 'uuid-2' };

    const { container } = render(<CalendarPage />);

    const invitees = container.querySelector('input[name="invitees"]') as HTMLInputElement;
    const permissions = container.querySelector('input[name="permissions"]') as HTMLInputElement;
    const form = invitees.closest('form') as HTMLFormElement;

    act(() => {
      invitees.value = 'Alice, Bob';
      invitees.dispatchEvent(new Event('input', { bubbles: true }));
      permissions.value = 'view, edit';
      permissions.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.invitees).toEqual(['Alice', 'Bob']);
    expect(body.permissions).toEqual(['view', 'edit']);
  });

  it('renders shared events with distinctive styling', () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({
      data: { events: [{ id: '1', title: 's', start: '2023-01-01', shared: true }], layers: [] },
      mutate,
    }));

    render(<CalendarPage />);

    const el = document.createElement('div');
    const event = calendarProps.events[0];
    calendarProps.eventDidMount({
      event: { extendedProps: event, backgroundColor: event.backgroundColor },
      el,
      view: { type: 'timeGridWeek' },
    });

    expect(el.classList.contains('border-dashed')).toBe(true);
    expect(el.firstChild?.textContent).toBe('👥');
  });

  it('renders owner initials on events', () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({
      data: { events: [{ id: '1', title: 't', start: '2023-01-01', owner: 'user1' }], layers: [] }, mutate },
    ));

    render(<CalendarPage />);

    const arg = {
      event: { title: 't', extendedProps: { owner: 'user1' } },
      view: { type: 'timeGridWeek' },
    } as any;
    const result = calendarProps.eventContent(arg);
    const container = document.createElement('div');
    act(() => {
      ReactDOM.createRoot(container).render(result as any);
    });
    expect(container.textContent).toContain('US');
  });

  it('reverts calendar when PATCH fails', async () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({
      data: { events: [{ id: '1', title: 'a', start: '2023-01-01' }], layers: [] },
      mutate,
    }));

    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ success: false, error: 'Bad' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    // @ts-ignore
    global.fetch = fetchMock;

    const { container } = render(<CalendarPage />);

    const revert = vi.fn();
    await act(async () => {
      await calendarProps.eventDrop({
        event: { id: '1', startStr: '2023-01-02', endStr: '2023-01-02' },
        revert,
      });
    });

    expect(revert).toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toBe('Bad');
  });

  it('revalidates when context cookie changes', async () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({ data: { events: [], layers: [] }, mutate }));
    vi.useFakeTimers();
    render(<CalendarPage />);

    expect(swrMock).toHaveBeenNthCalledWith(
      1,
      ['/api/schedule', 'personal'],
      expect.any(Function),
      expect.objectContaining({ refreshInterval: 30000 }),
    );

    document.cookie = 'context=group';
    document.cookie = 'groupId=team-a';
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mutate).toHaveBeenCalled();
    expect(swrMock).toHaveBeenNthCalledWith(
      2,
      ['/api/schedule', 'group'],
      expect.any(Function),
      expect.objectContaining({ refreshInterval: 30000 }),
    );
    vi.useRealTimers();
  });
});

describe('CalendarPage API errors', () => {
  beforeEach(() => {
    calendarProps = {};
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
    socketMock = { send: vi.fn() };
    document.cookie = 'context=personal';
    document.cookie =
      'groupId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('displays error message when event creation fails with 403', async () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({
      data: { events: [], layers: [{ id: 'a', name: 'A', color: '#f00' }] },
      mutate,
    }));

    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response('Forbidden', { status: 403 })),
    );
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

