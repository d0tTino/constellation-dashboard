import React from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react-dom/test-utils';

let swrMock: any;
vi.mock('swr', () => ({ __esModule: true, default: (...args: any[]) => swrMock(...args) }));
vi.mock('../app/socket-context', () => ({ __esModule: true, useFinanceUpdates: () => null }));

import FinancePage from '../app/finance/page';

function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe('FinancePage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders ranked options and shows details modal', () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({ data: [{ category: 'Rent', amount: 1000, costOfDeviation: 0 }], mutate }));
    const { container } = render(<FinancePage />);
    const viewBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'View Details') as HTMLButtonElement;
    act(() => { viewBtn.click(); });
    expect(document.body.textContent).toContain('Payment schedule coming soon.');
  });

  it('updates analysis parameters when inputs change', async () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({ data: [], mutate }));
    const { container } = render(<FinancePage />);
    const [budgetInput, payoffInput] = container.querySelectorAll('input');
    act(() => {
      (budgetInput as HTMLInputElement).value = '500';
      budgetInput.dispatchEvent(new Event('input', { bubbles: true }));
      (payoffInput as HTMLInputElement).value = '6';
      payoffInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect((budgetInput as HTMLInputElement).value).toBe('500');
    expect((payoffInput as HTMLInputElement).value).toBe('6');
    const analyzeBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Analyze') as HTMLButtonElement;
    act(() => { analyzeBtn.click(); });
    expect(mutate).toHaveBeenCalled();
  });
});

