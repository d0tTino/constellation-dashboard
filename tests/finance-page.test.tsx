import React from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react-dom/test-utils';

let swrMock: any;
let send: any;
let financeUpdate: any;
vi.mock('swr', () => ({ __esModule: true, default: (...args: any[]) => swrMock(...args) }));
vi.mock('../app/socket-context', () => ({
  __esModule: true,
  useFinanceUpdates: () => financeUpdate,
  useTaskStatus: () => null,
  useSocket: () => ({ send }),
  useSocketStatus: () => ({ connectionState: 'open', lastError: null, retry: () => {} }),
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
    financeUpdate = null;
    document.cookie = 'groupId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'context=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('labels options, highlights best choice, and shows modal content', () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({
      data: [
        { category: 'Rent', amount: 960, costOfDeviation: 0 },
        { category: 'Food', amount: 910, costOfDeviation: 0 },
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
    expect(cards[0].textContent).toContain('Best');
    expect(cards[0].textContent).toContain('⭐');
    expect(cards[0].textContent).toContain('Cost of deviation: $0');
    const costInfoBest = cards[0].querySelector('p:nth-of-type(2)') as HTMLParagraphElement;
    expect(costInfoBest.textContent).toBe('Cost of deviation: $0');
    const costInfo = cards[1].querySelector('p:nth-of-type(2)') as HTMLParagraphElement;
    expect(costInfo.textContent).toBe('Cost of deviation: $50');
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

  it('renders updated payment schedule and explanation after events', () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({
      data: [
        { category: 'Rent', amount: 1000, costOfDeviation: 0 },
      ],
      mutate,
    }));
    const { root } = render(<FinancePage />);
    const viewBtn = document.querySelector('button.text-blue-500') as HTMLButtonElement;
    act(() => { viewBtn.click(); });

    expect(document.body.textContent).toContain('Payment schedule coming soon.');
    expect(document.body.textContent).toContain('AI explanation coming soon.');

    financeUpdate = {
      type: 'finance.decision.result',
      category: 'Rent',
      paymentSchedule: ['Installment 1'],
    };
    act(() => {
      root.render(<FinancePage />);
    });
    expect(document.body.textContent).toContain('Installment 1');

    financeUpdate = {
      type: 'finance.explain.result',
      category: 'Rent',
      explanation: 'Because it saves money',
    };
    act(() => {
      root.render(<FinancePage />);
    });
    expect(document.body.textContent).toContain('Because it saves money');
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

  it('displays an error message when the fetch fails', () => {
    const mutate = vi.fn();
    swrMock = vi.fn(() => ({ error: new Error('Bad request'), mutate }));
    const { container } = render(<FinancePage />);
    expect(container.textContent).toContain('Failed to load budget options.');
  });

  it('loads new data when the context cookie changes', () => {
    document.cookie = 'context=personal; path=/';
    const mutate = vi.fn();
    swrMock = vi.fn((key: string) => {
      const matchCtx = key.match(/context=([^&]+)/);
      const ctx = matchCtx ? matchCtx[1] : 'personal';
      const matchGroup = key.match(/groupId=([^&]+)/);
      const gid = matchGroup ? matchGroup[1] : undefined;
      return {
        data:
          ctx === 'group' && gid === 'team-a'
            ? [{ category: 'Office Rent', amount: 2000, costOfDeviation: 1000 }]
            : [{ category: 'Rent', amount: 1000, costOfDeviation: 0 }],
        mutate,
      };
    });
    const { container } = render(<FinancePage />);
    expect(container.textContent).toContain('Rent');
    document.cookie = 'context=group; path=/';
    document.cookie = 'groupId=team-a; path=/';

    act(() => {
      window.dispatchEvent(new Event('context-changed'));
    });
    expect(container.textContent).toContain('Office Rent');
  });
});

