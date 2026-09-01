import { AppHeader } from '@/components/AppHeader';
import { policyContent, POLICY_VERSION, privacyContact } from '@/lib/policy-content';

export default function PrivacyPage() {
  return <main className="page"><AppHeader /><section className="shell form-wrap"><div className="eyebrow">Version {POLICY_VERSION}</div><h1 className="display">{policyContent.privacy.title}</h1><p className="form-intro">{policyContent.privacy.summary}</p>{policyContent.privacy.sections.map(([heading, body]) => <section className="utility-card" key={heading}><h2>{heading}</h2><p>{body}</p></section>)}<p className="legal-note">Privacy contact: {privacyContact()}</p><p className="legal-note">This beta copy supports product controls; it does not claim GDPR, DPDP, COPPA, or other legal compliance.</p></section></main>;
}

