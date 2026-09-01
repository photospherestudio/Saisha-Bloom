'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from '@/lib/account-actions';

export function UpdatePasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function submit(formData: FormData) {
    const password = String(formData.get('password') ?? '');
    const confirmation = String(formData.get('confirmation') ?? '');
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }
    startTransition(async () => {
      setError('');
      const result = await updatePassword(password);
      if (!result.ok) {
        setError(`${result.error}${'correlationId' in result ? ` Reference: ${result.correlationId}` : ''}`);
        return;
      }
      router.replace('/account');
      router.refresh();
    });
  }

  return <form className="form-card" action={submit}>
    <div className="field"><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></div>
    <div className="field"><label htmlFor="confirmation">Confirm new password</label><input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></div>
    {error ? <p role="alert" style={{ color: '#a33d35' }}>{error}</p> : null}
    <div className="form-foot"><span className="muted" style={{ fontSize: '.76rem' }}>Use at least 8 characters.</span><button className="button button-primary" type="submit" disabled={isPending}>{isPending ? 'Saving…' : 'Set new password'}</button></div>
  </form>;
}

