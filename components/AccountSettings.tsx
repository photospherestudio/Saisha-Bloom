'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteAccount, deleteOwnedChild, updateAccountSettings, updateOwnedChild } from '@/lib/account-actions';

type Child = { id: string; name: string; dob: string; gestationalWeeks: number | null };

export function AccountSettings({ user, children }: { user: { email: string; displayName: string; timezone: string | null }; children: Child[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [timezone, setTimezone] = useState(user.timezone ?? 'UTC');

  useEffect(() => {
    if (!user.timezone) setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  }, [user.timezone]);

  function saveAccount(formData: FormData) {
    startTransition(async () => {
      const result = await updateAccountSettings({ displayName: String(formData.get('displayName') ?? ''), timezone });
      setMessage(result.ok ? 'Account settings saved.' : result.error);
    });
  }

  function saveChild(formData: FormData) {
    startTransition(async () => {
      const result = await updateOwnedChild({ childId: String(formData.get('childId')), name: String(formData.get('name') ?? ''), dob: String(formData.get('dob') ?? ''), gestationalWeeks: String(formData.get('gestationalWeeks') ?? '') });
      setMessage(result.ok ? 'Child profile saved.' : result.error);
    });
  }

  function removeChild(childId: string) {
    const confirmation = window.prompt('This permanently removes the child profile. Export first if needed. Type DELETE to continue.');
    if (confirmation === null) return;
    startTransition(async () => {
      const result = await deleteOwnedChild({ childId, confirmation });
      setMessage(result.ok ? 'Child profile deleted.' : result.error);
    });
  }

  function removeAccount() {
    const confirmation = window.prompt('This permanently deletes all profiles you own. Type DELETE MY ACCOUNT to continue.');
    if (confirmation === null) return;
    const password = window.prompt('Enter your current password to confirm.');
    if (password === null) return;
    startTransition(async () => {
      const result = await deleteAccount({ password, confirmation });
      setMessage(result.ok ? 'Your account was deleted.' : result.error);
      if (result.ok) window.location.assign('/');
    });
  }

  return <div className="utility-grid">
    <section className="utility-card">
      <div className="eyebrow">Account details</div><h2>Keep this current.</h2>
      <form className="form-card" action={saveAccount}>
        <div className="field"><label htmlFor="displayName">Your first name</label><input id="displayName" name="displayName" defaultValue={user.displayName} maxLength={80} autoComplete="given-name" required /></div>
        <div className="field"><label htmlFor="timezone">Timezone</label><input id="timezone" name="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} autoComplete="off" required /><span className="muted">Used for your weekly progress boundaries.</span></div>
        <p className="muted">Signed in as {user.email}. <Link className="source-link" href="/account/update-password">Change password</Link></p>
        <button className="button button-primary" type="submit" disabled={isPending}>Save account</button>
      </form>
    </section>
    <section className="utility-card">
      <div className="eyebrow">Privacy and records</div><h2>Your choices.</h2>
      <p className="muted"><Link className="source-link" href="/consent">Review acknowledgments and guardian attestations</Link></p><p className="muted"><Link className="source-link" href="/account/push">Manage optional push check-ins</Link></p>
      <form method="post" action="/api/account/export"><div className="field"><label htmlFor="export-password">Current password</label><input id="export-password" name="password" type="password" autoComplete="current-password" required /></div><button className="button button-secondary" type="submit">Download my export</button></form>
      <button className="button button-quiet" type="button" disabled={isPending} onClick={removeAccount}>Delete my account</button>
    </section>
    <section className="utility-card" style={{ gridColumn: '1 / -1' }}>
      <div className="eyebrow">Child profiles you own</div><h2>Edit or permanently delete.</h2>
      <p className="muted">Export before deletion. Permanent deletion cannot be undone.</p>
      {children.map((child) => <form className="inline-form" action={saveChild} key={child.id} style={{ alignItems: 'end', marginTop: 16 }}>
        <input type="hidden" name="childId" value={child.id} />
        <div className="field"><label htmlFor={`name-${child.id}`}>First name</label><input id={`name-${child.id}`} name="name" defaultValue={child.name} maxLength={120} required /></div>
        <div className="field"><label htmlFor={`dob-${child.id}`}>Date of birth</label><input id={`dob-${child.id}`} name="dob" type="date" defaultValue={child.dob.slice(0, 10)} required /></div>
        <div className="field"><label htmlFor={`gestation-${child.id}`}>Gestational weeks</label><input id={`gestation-${child.id}`} name="gestationalWeeks" type="number" min="20" max="45" defaultValue={child.gestationalWeeks ?? ''} /></div>
        <button className="button button-secondary" type="submit" disabled={isPending}>Save</button><button className="button button-quiet" type="button" disabled={isPending} onClick={() => removeChild(child.id)}>Delete</button>
      </form>)}
      {!children.length ? <p className="muted">You do not own any child profiles. Editors can manage their own account but cannot change shared profiles.</p> : null}
    </section>
    {message ? <p className="form-status" role="status">{message}</p> : null}
  </div>;
}
