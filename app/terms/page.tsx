import { AppHeader } from '@/components/AppHeader';
import { policyContent, POLICY_VERSION } from '@/lib/policy-content';

export default function TermsPage() {
  return <main className="page"><AppHeader /><section className="shell form-wrap"><div className="eyebrow">Version {POLICY_VERSION}</div><h1 className="display">{policyContent.terms.title}</h1><p className="form-intro">{policyContent.terms.summary}</p>{policyContent.terms.sections.map(([heading, body]) => <section className="utility-card" key={heading}><h2>{heading}</h2><p>{body}</p></section>)}<p className="legal-note">This beta copy requires counsel approval before broad production positioning.</p></section></main>;
}

