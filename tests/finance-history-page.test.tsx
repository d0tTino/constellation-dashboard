import React from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react-dom/test-utils';

let swrMock: any;
vi.mock('swr', () => ({ __esModule: true, default: (...args: any[]) => swrMock(...args) }));
vi.mock('../app/socket-context', () => ({
  __esModule: true,
  useFinanceUpdates: () => null,
  useTaskStatus: () => null,
  useSocketStatus: () => ({ connectionState: 'open', lastError: null, retry: () => {} }),
}));

import FinanceHistoryPage from '../app/finance/history';

function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe('FinanceHistoryPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.cookie = 'groupId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'context=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('lists past analyses', () => {
    swrMock = vi.fn(() => ({ data: [{ id: '1', date: '2024-01-01', totalCost: 123 }], mutate: vi.fn() }));
    const { container } = render(<FinanceHistoryPage />);
    expect(container.textContent).toContain('2024-01-01');
    expect(container.textContent).toContain('Total Cost: $123');
  });

  it('shows actions for a selected history item and returns back', () => {
    swrMock = vi.fn((key: string | null) => {
      if (!key) return {};
      if (key.startsWith('/api/v1/report/budget/history?')) {
        return { data: [{ id: '1', date: '2024-01-01', totalCost: 123 }], mutate: vi.fn() };
      }
      if (key === '/api/v1/report/budget/history/1') {
        return { data: [{ id: 'a1', description: 'Cut coffee spend' }] };
      }
      return {};
    });
    const { container } = render(<FinanceHistoryPage />);
    const btn = container.querySelector('button') as HTMLButtonElement;
    act(() => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(swrMock.mock.calls.some(c => c[0] === '/api/v1/report/budget/history/1')).toBe(true);
    expect(container.textContent).toContain('2024-01-01');
    expect(container.textContent).toContain('Cut coffee spend');
    const back = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Back') as HTMLButtonElement;
    act(() => {
      back.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('Total Cost: $123');
  });

  it('loads new history when the context cookie changes', () => {
    document.cookie = 'context=personal; path=/';
    const mutate = vi.fn();
    swrMock = vi.fn((key: string | null) => {
      if (!key) return { mutate };
      const matchCtx = key.match(/context=([^&]+)/);
      const ctx = matchCtx ? matchCtx[1] : 'personal';
      const matchGroup = key.match(/groupId=([^&]+)/);
      const gid = matchGroup ? matchGroup[1] : undefined;
      return {
        data:
          ctx === 'group' && gid === 'team-a'
            ? [{ id: '2', date: '2024-02-01', totalCost: 456 }]
            : [{ id: '1', date: '2024-01-01', totalCost: 123 }],
        mutate,
      };
    });
    const { container } = render(<FinanceHistoryPage />);
    expect(container.textContent).toContain('2024-01-01');
    document.cookie = 'context=group; path=/';
    document.cookie = 'groupId=team-a; path=/';
    act(() => {
      window.dispatchEvent(new Event('context-changed'));
    });
    expect(container.textContent).toContain('2024-02-01');
    expect(mutate).toHaveBeenCalled();
  });
});
