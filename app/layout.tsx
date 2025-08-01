import "./globals.css";
import { SocketProvider } from "./socket-context";
import { ReactNode, useEffect } from 'react';

import { SWRProvider } from '../lib/swr';
import Link from 'next/link';
import { SessionProvider, signIn, signOut, useSession } from 'next-auth/react';
import { ThemeProvider, useTheme } from './theme-context';

export const metadata = {
  title: 'Constellation Dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <ThemeProvider>
        <Shell>{children}</Shell>
      </ThemeProvider>

    </html>
  );
}

function Shell({ children }: { children: ReactNode }) {
  'use client';

  const { theme, setTheme } = useTheme();
  const toggleTheme = () =>
    setTheme(theme === 'cyber' ? 'pastel' : 'cyber');

  return (
    <SWRProvider>
      <SessionProvider>
        <SocketProvider>
          <ShellContent toggleTheme={toggleTheme}>{children}</ShellContent>
        </SocketProvider>
      </SessionProvider>
    </SWRProvider>
  );
}

function ShellContent({
  children,
  toggleTheme,
}: {
  children: ReactNode;
  toggleTheme: () => void;
}) {
  const { data: session } = useSession();

  return (
    <SocketProvider>
      <body>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/">Home</Link>
          <Link href="/settings">Settings</Link>
          {session ? (
            <button type="button" onClick={() => signOut()}>Sign out</button>
          ) : (
            <button type="button" onClick={() => signIn()}>Sign in</button>
          )}
          <button type="button" onClick={toggleTheme}>Toggle Theme</button>
        </nav>
        {children}
      </body>
    </SocketProvider>

  );
}
