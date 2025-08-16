import React from 'react';
import ReactDOM from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';

import LoginPage from '../app/login/page';
import { ShellContent } from '../app/layout';

let sessionMock: any;

(globalThis as any).React = React;

vi.mock('next-auth/react', () => {
  const React = require('react');
  return {
    SessionProvider: ({ children }: any) => React.createElement('div', null, children),
    useSession: () => sessionMock,
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('../lib/swr', () => {
  const React = require('react');
  return {
    SWRProvider: ({ children }: any) => React.createElement('div', null, children),
  };
});

vi.mock('../app/socket-context', () => {
  const React = require('react');
  return {
    SocketProvider: ({ children }: any) => React.createElement('div', null, children),
    useSocket: () => null,
    useTaskStatus: () => null,
    useSocketStatus: () => ({ connectionState: 'open', lastError: null, retry: () => {} }),
  };
});

vi.mock('../app/theme-context', () => {
  const React = require('react');
  return {
    ThemeProvider: ({ children }: any) => React.createElement('div', null, children),
    useTheme: () => ({ theme: 'cyber', setTheme: vi.fn() }),
  };
});

vi.mock('../app/components/ContextSwitcher', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div'),
  };
});

function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe('Login flow', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    sessionMock = { data: null };
  });

  it('renders login page', async () => {
    render(<LoginPage />);
    await act(async () => {});
    const btn = document.querySelector('button');
    expect(btn?.textContent).toContain('GitHub');
  });

  it('shows login link in navigation', () => {
    const html = renderToStaticMarkup(
      <ShellContent toggleTheme={() => {}}>{null}</ShellContent>
    );
    expect(html).toContain('href="/login"');
  });
});

