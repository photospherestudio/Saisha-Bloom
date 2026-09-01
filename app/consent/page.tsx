import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { ConsentForm } from '@/components/ConsentForm';
import { getConsentStatus } from '@/lib/consent-actions';
import { POLICY_VERSION } from '@/lib/policy-content';

export const dynamic = 'force-dynamic';

export default async function ConsentPage() {
  const status = await getConsentStatus();
  if (!status) redirect('/sign-in?next=/consent');
  return <main className="page"><AppHeader backHref="/account" /><section className="shell form-wrap"><div className="eyebrow">Privacy choices</div><h1 className="display">Keep consent clear.</h1><p className="form-intro">Version {POLICY_VERSION}. Read the <Link className="source-link" href="/terms">Terms of use</Link> and <Link className="source-link" href="/privacy">Privacy notice</Link>, then save your acknowledgments. Each child profile owner also confirms their guardian role.</p><ConsentForm acceptedTerms={status.acceptedTerms} acceptedPrivacy={status.acceptedPrivacy} children={status.children.map((child) => ({ id: child.id, name: child.name, attested: child.attested }))} /><p className="legal-note">Beta self-attestation is recorded now. A counsel-selected verification provider may replace it later; raw identity documents are never stored here.</p></section></main>;
}
