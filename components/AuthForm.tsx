'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AuthForm({ mode, next }: { mode: 'sign-in' | 'sign-up'; next?: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, setIsPending] = useState(false);
  const destination = next?.startsWith('/') && !next.startsWith('//') ? next : '/onboarding';

  async function submit(formData: FormData) {
    setIsPending(true);
    setError('');
    setMessage('');
    const supabase = createClient();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setError(result.error.message);
      setIsPending(false);
      return;
    }

    if (mode === 'sign-up' && !result.data.session) {
      setMessage('Check your email to confirm your account, then sign in.');
      setIsPending(false);
      return;
    }

    router.push(destination);
    router.refresh();
  }

  return (
    <form className="form-card" action={submit}>
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={6} required /></div>
      {error ? <p role="alert" style={{ color: '#a33d35' }}>{error}</p> : null}
      {message ? <p role="status" className="muted">{message}</p> : null}
      <div className="form-foot"><span className="muted" style={{ fontSize: '.76rem' }}>Your account stays private by default.</span><button className="button button-primary" type="submit" disabled={isPending}>{isPending ? 'One moment…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button></div>
    </form>
  );
}
