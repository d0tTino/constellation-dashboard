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
  });

  it('lists past analyses', () => {
    swrMock = vi.fn(() => ({ data: [{ id: '1', date: '2024-01-01', totalCost: 123 }], mutate: vi.fn() }));
    const { container } = render(<FinanceHistoryPage />);
    expect(container.textContent).toContain('2024-01-01');
    expect(container.textContent).toContain('Total Cost: $123');
  });

  it('shows actions for a selected history item and returns back', () => {
    swrMock = vi.fn((key: string) => {
      if (key === '/api/v1/report/budget/history') {
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
});
