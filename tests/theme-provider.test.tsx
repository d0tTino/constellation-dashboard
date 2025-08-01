import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, useTheme } from '../app/theme-context';
import { act } from 'react-dom/test-utils';

function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.body.innerHTML = '';
  });

  it('reads theme from localStorage', async () => {
    localStorage.setItem('theme', 'pastel');
    render(
      <ThemeProvider>
        <div>test</div>
      </ThemeProvider>
    );
    await act(async () => {});
    expect(document.documentElement.dataset.theme).toBe('pastel');
  });

  it('writes theme changes to localStorage and html attribute', async () => {
    function SetTheme() {
      const { setTheme } = useTheme();
      useEffect(() => {
        setTheme('pastel');
      }, [setTheme]);
      return null;
    }
    render(
      <ThemeProvider>
        <SetTheme />
      </ThemeProvider>
    );
    await act(async () => {});
    expect(localStorage.getItem('theme')).toBe('pastel');
    expect(document.documentElement.dataset.theme).toBe('pastel');
  });

  it('persists theme across provider remounts', async () => {
    function SetTheme() {
      const { setTheme } = useTheme();
      useEffect(() => {
        setTheme('pastel');
      }, [setTheme]);
      return null;
    }
    const first = render(
      <ThemeProvider>
        <SetTheme />
      </ThemeProvider>
    );
    await act(async () => {});
    first.root.unmount();

    render(
      <ThemeProvider>
        <div>test</div>
      </ThemeProvider>
    );
    await act(async () => {});
    expect(document.documentElement.dataset.theme).toBe('pastel');
  });
});
