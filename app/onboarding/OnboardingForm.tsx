'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createChild } from '@/lib/actions';

export function OnboardingForm({ demoMode = false, initialDisplayName = '' }: { demoMode?: boolean; initialDisplayName?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function submit(formData: FormData) {
    startTransition(async () => {
      setError('');
      const result = await createChild(formData);
      if ('childId' in result && result.childId) router.push(`/child/${result.childId}/checklist`);
      else if ('error' in result) setError(`${result.error}${'correlationId' in result ? ` Reference: ${result.correlationId}` : ''}`);
    });
  }

  return (
    <form className="form-card" action={submit}>
      {demoMode ? <div className="field"><label htmlFor="email">Your email</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></div> : null}
      <div className="field"><label htmlFor="displayName">Your first name</label><input id="displayName" name="displayName" type="text" autoComplete="given-name" defaultValue={initialDisplayName} placeholder="Shown on shared observations" maxLength={80} required /></div>
      <div className="field"><label htmlFor="name">Your child’s first name</label><input id="name" name="name" type="text" autoComplete="off" placeholder="A first name is enough" required /></div>
      <div className="field"><label htmlFor="dob">Date of birth</label><input id="dob" name="dob" type="date" required /></div>
      <p className="muted">We use your child’s name and age to show neutral, CDC-reviewed guideposts. You can simply think of these as “your child” moments.</p>
      <div className="field"><label htmlFor="gestationalWeeks">Gestational weeks <span className="muted">(optional)</span></label><input id="gestationalWeeks" name="gestationalWeeks" type="number" min="20" max="45" placeholder="40" /></div>
      <div className="field"><label htmlFor="heightCm">Current length / height <span className="muted">(optional, cm)</span></label><input id="heightCm" name="heightCm" type="number" min="30" max="140" step="0.1" placeholder="Add later if useful" /></div>
      <div className="field"><label htmlFor="weightKg">Current weight <span className="muted">(optional, kg)</span></label><input id="weightKg" name="weightKg" type="number" min="1" max="45" step="0.1" placeholder="Add later if useful" /></div>
      {error ? <p role="alert" style={{ color: '#a33d35' }}>{error}</p> : null}
      <div className="form-foot"><span className="muted" style={{ fontSize: '.76rem' }}>{demoMode ? 'Demo mode — private on this device.' : 'Signed in with Supabase. Private by default.'}</span><button className="button button-primary" type="submit" disabled={isPending}>{isPending ? 'Making space…' : 'Continue'}</button></div>
    </form>
  );
}
