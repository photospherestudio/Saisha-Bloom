'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate } from '@/lib/actions';

export function AuthForm({ mode, next, initialError = '' }: { mode: 'sign-in' | 'sign-up'; next?: string; initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState('');
  const [isPending, setIsPending] = useState(false);
  const destination = next?.startsWith('/') && !next.startsWith('//') ? next : '/onboarding';

  async function submit(formData: FormData) {
    setIsPending(true);
    setError('');
    setMessage('');
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const displayName = String(formData.get('displayName') ?? '').trim();
    const destination = next?.startsWith('/') && !next.startsWith('//') ? next : '/onboarding';
    const result = await authenticate({ mode, email, password, displayName, destination });

    if (result.error) {
      setError(`${result.error} Reference: ${result.correlationId}`);
      setIsPending(false);
      return;
    }

    if (mode === 'sign-up' && !result.hasSession) {
      setMessage('Check your email to confirm your account. We’ll bring you back to set up your child profile.');
      setIsPending(false);
      return;
    }

    router.push(destination);
    router.refresh();
  }

  return (
    <form className="form-card" action={submit}>
      {mode === 'sign-up' ? <div className="field"><label htmlFor="displayName">Your first name</label><input id="displayName" name="displayName" type="text" autoComplete="given-name" placeholder="How should we credit your observations?" maxLength={80} required /></div> : null}
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={6} required /></div>
      {error ? <p role="alert" style={{ color: '#a33d35' }}>{error}</p> : null}
      {message ? <p role="status" className="muted">{message}</p> : null}
      <div className="form-foot"><span className="muted" style={{ fontSize: '.76rem' }}>Your account stays private by default.</span><button className="button button-primary" type="submit" disabled={isPending}>{isPending ? 'One moment…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</button></div>
    </form>
  );
}
