'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/';

  useEffect(() => {
    if (session) {
      router.replace(callbackUrl);
    }
  }, [session, router, callbackUrl]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    await signIn('credentials', {
      username,
      password,
      redirect: true,
      callbackUrl,
    });
  }

  return (
    <div>
      <h1>Login</h1>
      <button type="button" onClick={() => signIn('github', { callbackUrl })}>
        Sign in with GitHub
      </button>
      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input name="username" type="text" />
        </label>
        <label>
          Password
          <input name="password" type="password" />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}

