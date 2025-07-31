import "./globals.css";
import { SocketProvider } from "./socket-context";
import { ReactNode, useState } from 'react';
import { SWRProvider } from '../lib/swr';
import Link from 'next/link';
import { SessionProvider, signIn, signOut, useSession } from 'next-auth/react';

export const metadata = {
  title: 'Constellation Dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <Shell>{children}</Shell>
    </html>
  );
}

function Shell({ children }: { children: ReactNode }) {
  'use client';

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <SWRProvider>
      <SessionProvider>
        <ShellContent theme={theme} toggleTheme={toggleTheme}>
          {children}
        </ShellContent>
      </SessionProvider>
    </SWRProvider>
  );
}

function ShellContent({
  children,
  theme,
  toggleTheme,
}: {
  children: ReactNode;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}) {
  const { data: session } = useSession();

  return (
    <SocketProvider>
      <body className={theme}>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/">Home</Link>
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
