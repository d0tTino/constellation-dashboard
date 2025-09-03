'use client';
import React from 'react';
import { useSocketStatus } from '../socket-context';

export function getConnectionStatusMessage(
  connectionState: string,
  lastError?: { code: string | number; message: string } | null
) {
  return connectionState === 'connecting'
    ? 'Connecting...'
    : `Connection error${
        lastError ? ` (${lastError.code}: ${lastError.message})` : ''
      }`;
}

export default function ConnectionStatus() {
  const { connectionState, lastError, retry } = useSocketStatus();

  if (connectionState === 'open') return null;

  const message = getConnectionStatusMessage(connectionState, lastError);

  return (
    <div
      style={{ cursor: 'pointer', color: 'red' }}
      onClick={() => retry()}
      role="button"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
