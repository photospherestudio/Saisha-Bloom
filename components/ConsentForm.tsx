'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { acceptCurrentPolicies, attestChildGuardian } from '@/lib/consent-actions';

type Child = { id: string; name: string; attested: boolean };

export function ConsentForm({ acceptedTerms, acceptedPrivacy, children }: { acceptedTerms: boolean; acceptedPrivacy: boolean; children: Child[] }) {
  const [isPending, startTransition] = useTransition();
  const [terms, setTerms] = useState(acceptedTerms);
  const [privacy, setPrivacy] = useState(acceptedPrivacy);
  const [attested, setAttested] = useState(() => new Set(children.filter((child) => child.attested).map((child) => child.id)));
  const [message, setMessage] = useState('');
  const router = useRouter();

  function savePolicies() {
    startTransition(async () => {
      const result = await acceptCurrentPolicies({ terms, privacy });
      if (result.ok) { setMessage('Your acknowledgments were saved.'); if (!children.length) { router.push('/dashboard'); router.refresh(); } } else setMessage(result.error);
    });
  }

  function attest(childId: string) {
    startTransition(async () => {
      const result = await attestChildGuardian({ childId, attested: true });
      if (result.ok) { const next = new Set(attested).add(childId); setAttested(next); if (terms && privacy && next.size === children.length) { router.push('/dashboard'); router.refresh(); } }
      setMessage(result.ok ? 'Guardian attestation saved.' : result.error);
    });
  }

  return <section className="form-card">
    <fieldset className="field"><legend>Policy acknowledgments</legend><label><input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} /> I have read and accept the Terms of use.</label><label><input type="checkbox" checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} /> I have read the Privacy notice.</label></fieldset>
    <button className="button button-primary" type="button" disabled={isPending} onClick={savePolicies}>Save acknowledgments</button>
    {children.length ? <div className="family-members" style={{ marginTop: 24 }}><strong>Child profile guardian attestations</strong>{children.map((child) => <div className="family-member" key={child.id}><span>{child.name}</span>{attested.has(child.id) ? <span className="muted">Saved</span> : <button className="button button-secondary" type="button" disabled={isPending} onClick={() => attest(child.id)}>I am this child’s parent or legal guardian</button>}</div>)}</div> : null}
    {message ? <p className="form-status" role="status">{message}</p> : null}
  </section>;
}
