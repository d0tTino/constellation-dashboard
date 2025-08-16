import React from 'react';
import ReactDOM from 'react-dom/client';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react';

let ws: any;
let emit: (value: number) => void;

(globalThis as any).React = React;

vi.mock('../app/socket-context', () => ({
  __esModule: true,
  useSocket: () => ws,
  useTaskStatus: () => null,
  useSocketStatus: () => ({ connectionState: 'open', lastError: null, retry: () => {} }),
}));

vi.mock('recharts', () => {
  const React = require('react');
  let lastData: any[] = [];
  return {
    __esModule: true,
    LineChart: (props: any) => {
      lastData = props.data;
      return React.createElement('div');
    },
    Line: () => React.createElement('div'),
    XAxis: () => React.createElement('div'),
    YAxis: () => React.createElement('div'),
    CartesianGrid: () => React.createElement('div'),
    Tooltip: () => React.createElement('div'),
    __getLastData: () => lastData,
  };
});

import InvestPage from '../app/invest/page';
import * as Recharts from 'recharts';

function render(ui: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);
  act(() => {
    root.render(ui);
  });
  return { container, root };
}

describe('InvestPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    let listeners: ((ev: any) => void)[] = [];
    ws = {
      addEventListener: vi.fn((event: string, cb: any) => {
        if (event === 'message') listeners.push(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: any) => {
        if (event === 'message') listeners = listeners.filter(fn => fn !== cb);
      }),
    };
    emit = (value: number) => {
      const ev = { data: JSON.stringify({ value }) };
      listeners.forEach(fn => fn(ev));
    };
  });

  it('updates chart data as WebSocket messages arrive', async () => {
    render(<InvestPage />);
    expect((Recharts as any).__getLastData()).toEqual([]);
    await act(async () => {
      emit(10);
    });
    expect((Recharts as any).__getLastData().map((d: any) => d.value)).toEqual([10]);
    await act(async () => {
      emit(20);
    });
    expect((Recharts as any).__getLastData().map((d: any) => d.value)).toEqual([10, 20]);
  });
});

