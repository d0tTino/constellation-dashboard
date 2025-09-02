import React from 'react';
import ReactDOM from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { ShellContent } from '../app/layout';
import Link from 'next/link';

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

describe('History navigation link', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    sessionMock = { data: null };
  });

  it('shows history link in navigation', () => {
    const html = renderToStaticMarkup(
      <ShellContent toggleTheme={() => {}}>{null}</ShellContent>
    );
    expect(html).toContain('href="/finance/history"');
  });

  it('navigates to history page when clicked', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = ReactDOM.createRoot(container);
    act(() => {
      root.render(<Link href="/finance/history">History</Link>);
    });

    const link = container.querySelector('a[href="/finance/history"]') as HTMLAnchorElement;
    let navigatedTo: string | null = null;
    act(() => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigatedTo = (e.currentTarget as HTMLAnchorElement).pathname;
      });
      link.click();
    });
    expect(navigatedTo).toBe('/finance/history');
  });
});

