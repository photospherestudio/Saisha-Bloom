'use client';

import { useState, useTransition } from 'react';
import { requestPasswordRecovery } from '@/lib/account-actions';

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await requestPasswordRecovery(String(formData.get('email') ?? ''));
      setMessage(result.message);
    });
  }

  return <form className="form-card" action={submit}>
    <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
    {message ? <p className="form-status" role="status">{message}</p> : null}
    <div className="form-foot"><span className="muted" style={{ fontSize: '.76rem' }}>For privacy, this message is the same for every request.</span><button className="button button-primary" type="submit" disabled={isPending}>{isPending ? 'Sending…' : 'Email reset link'}</button></div>
  </form>;
}

