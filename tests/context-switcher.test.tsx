import React from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react-dom/test-utils';

vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { user: {} } }) }));

import ContextSwitcher from '../app/components/ContextSwitcher';

function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe('ContextSwitcher', () => {
  let cookieValue = 'context=personal';
  beforeEach(() => {
    cookieValue = 'context=personal';
    vi.stubGlobal('React', React);
    Object.defineProperty(document, 'cookie', {
      get: () => cookieValue,
      set: (v: string) => {
        cookieValue = v;
      },
      configurable: true,
    });
    document.body.innerHTML = '';
  });

  it('updates cookie on context change', () => {
    const { container } = render(<ContextSwitcher />);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('personal');
    act(() => {
      select.value = 'group';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(cookieValue).toBe('context=group; path=/');
  });
});

