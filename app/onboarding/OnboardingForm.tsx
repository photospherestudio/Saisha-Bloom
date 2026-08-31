'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createChild } from '@/lib/actions';

export function OnboardingForm({ demoMode = false }: { demoMode?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function submit(formData: FormData) {
    startTransition(async () => {
      setError('');
      const result = await createChild(formData);
      if (result.childId) router.push(`/child/${result.childId}/checklist`);
      else if (result.error) setError(result.error);
    });
  }

  return (
    <form className="form-card" action={submit}>
      {demoMode ? <div className="field"><label htmlFor="email">Your email</label><input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></div> : null}
      <div className="field"><label htmlFor="name">Child’s first name</label><input id="name" name="name" type="text" autoComplete="off" placeholder="A first name is enough" required /></div>
      <div className="field"><label htmlFor="dob">Date of birth</label><input id="dob" name="dob" type="date" required /></div>
      <div className="field"><label htmlFor="gender">Gender</label><select id="gender" name="gender" defaultValue="" required><option value="" disabled>Choose one</option><option value="girl">Girl (she / her)</option><option value="boy">Boy (he / him)</option></select></div>
      <div className="field"><label htmlFor="gestationalWeeks">Gestational weeks <span className="muted">(optional)</span></label><input id="gestationalWeeks" name="gestationalWeeks" type="number" min="20" max="45" placeholder="40" /></div>
      <div className="field"><label htmlFor="heightCm">Current length / height <span className="muted">(optional, cm)</span></label><input id="heightCm" name="heightCm" type="number" min="30" max="140" step="0.1" placeholder="Add later if useful" /></div>
      <div className="field"><label htmlFor="weightKg">Current weight <span className="muted">(optional, kg)</span></label><input id="weightKg" name="weightKg" type="number" min="1" max="45" step="0.1" placeholder="Add later if useful" /></div>
      {error ? <p role="alert" style={{ color: '#a33d35' }}>{error}</p> : null}
      <div className="form-foot"><span className="muted" style={{ fontSize: '.76rem' }}>{demoMode ? 'Demo mode — private on this device.' : 'Signed in with Supabase. Private by default.'}</span><button className="button button-primary" type="submit" disabled={isPending}>{isPending ? 'Making space…' : 'Continue'}</button></div>
    </form>
  );
}
