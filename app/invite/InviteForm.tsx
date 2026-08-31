'use client';

import { FormEvent, useState } from 'react';
import { acceptCaregiverInvite } from '@/lib/actions';

export default function InviteForm({ initialToken }: { initialToken: string }) {
  const [token, setToken] = useState(initialToken);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function accept(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const data = await acceptCaregiverInvite(token);
      if (!data.ok) throw new Error('error' in data ? data.error : 'Invite could not be accepted.');
      setMessage('Invite accepted. Open your dashboard to see shared child profile.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Invite could not be accepted.'); }
    finally { setPending(false); }
  }

  return <section className="shell form-wrap"><div className="eyebrow">A shared beginning</div><h1 className="display">Join their circle.</h1><p className="form-intro">Accept invite to add your observations to one child’s private Saisha Bloom space.</p><form className="form-card" onSubmit={accept}><div className="field"><label htmlFor="invite-token">Invite code</label><input id="invite-token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste invite code" required /></div><button className="button button-primary" type="submit" disabled={pending}>{pending ? 'Joining…' : 'Accept invite'}</button>{message ? <p className="form-status" aria-live="polite">{message}</p> : null}</form></section>;
}
