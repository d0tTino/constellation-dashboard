import React from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react-dom/test-utils';

// mocks
let swrMock: any;
let calendarProps: any;
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
  });

  it('creates an event via the form', async () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({ data: [], mutate }));
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) }));
    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(<CalendarPage />);

    const title = container.querySelector('input[name="title"]') as HTMLInputElement;
    const start = container.querySelector('input[name="start"]') as HTMLInputElement;
    const end = container.querySelector('input[name="end"]') as HTMLInputElement;
    const form = container.querySelector('form') as HTMLFormElement;

    act(() => {
      title.value = 'test';
      title.dispatchEvent(new Event('input', { bubbles: true }));
      start.value = '2024-01-01';
      start.dispatchEvent(new Event('input', { bubbles: true }));
      end.value = '2024-01-02';
      end.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/schedule', expect.objectContaining({ method: 'POST' }));
    expect(mutate).toHaveBeenCalled();
  });

  it('updates an event on drop', async () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({ data: [{ id: '1', title: 'a' }], mutate }));
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    render(<CalendarPage />);

    await act(async () => {
      await calendarProps.eventDrop({
        event: { id: '1', startStr: '2024-01-03', endStr: '2024-01-04' }
      });
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/task/1', expect.anything());
    expect(mutate).toHaveBeenCalled();
  });
});
