import "./globals.css";
import { SocketProvider } from "./socket-context";
import { ReactNode, useState, useEffect } from 'react';
import { SWRProvider } from '../lib/swr';
import Link from 'next/link';
import { SessionProvider, signIn, signOut, useSession } from 'next-auth/react';

export const metadata = {
  title: 'Constellation Dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}

function Shell({ children }: { children: ReactNode }) {
  'use client';

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    const stored = window.localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.className = theme;
    window.localStorage.setItem('theme', theme);
  }, [theme]);

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
    <>
      <nav className="flex gap-4 p-4 bg-gray-200">
        <Link href="/">Home</Link>
        {session ? (
          <button type="button" onClick={() => signOut()}>Sign out</button>
        ) : (
          <button type="button" onClick={() => signIn()}>Sign in</button>
        )}
        <button type="button" onClick={toggleTheme}>Toggle Theme</button>
      </nav>
      {children}
    </>
  );
}
