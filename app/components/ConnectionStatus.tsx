'use client';
import React from 'react';
import { useSocketStatus } from '../socket-context';

export default function ConnectionStatus() {
  const { connectionState, lastError, retry } = useSocketStatus();

  if (connectionState === 'open') return null;

  const message =
    connectionState === 'connecting'
      ? 'Connecting...'
      : `Connection error${
          lastError ? ` (${lastError.code}: ${lastError.message})` : ''
        }`;

  return (
    <div
      style={{ cursor: 'pointer', color: 'red' }}
      onClick={() => retry()}
      role="button"
    >
      {message}
    </div>
  );
}
