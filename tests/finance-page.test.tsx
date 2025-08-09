import React from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react-dom/test-utils';

let swrMock: any;
let send: any;
vi.mock('swr', () => ({ __esModule: true, default: (...args: any[]) => swrMock(...args) }));
vi.mock('../app/socket-context', () => ({
  __esModule: true,
  useFinanceUpdates: () => null,
  useTaskStatus: () => null,
  useSocket: () => ({ send }),
}));

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
    send = vi.fn();
  });

  it('labels options, highlights best choice, and shows modal content', () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({
      data: [
        { category: 'Rent', amount: 1000, costOfDeviation: 0 },
        { category: 'Food', amount: 500, costOfDeviation: 100 },
      ],
      mutate,
    }));
    const { container } = render(<FinancePage />);
    const cards = Array.from(container.querySelectorAll('.border.p-4.rounded.shadow')) as HTMLDivElement[];
    expect(cards[0].textContent).toContain('Option A - Rent');
    expect(cards[1].textContent).toContain('Option B - Food');
    expect(cards[0].className).toContain('border-green-500');
    expect(cards[0].className).toContain('bg-green-50');
    expect(cards[1].className).not.toContain('border-green-500');
    const viewBtn = cards[0].querySelector('button') as HTMLButtonElement;
    act(() => { viewBtn.click(); });
    expect(send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'finance.decision.request', category: 'Rent' }),
    );
    expect(send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'finance.explain.request', category: 'Rent' }),
    );
    expect(document.body.textContent).toContain('Payment schedule coming soon.');
    expect(document.body.textContent).toContain('AI explanation coming soon.');
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

