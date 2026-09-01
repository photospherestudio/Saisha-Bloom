import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return <main className="page"><AppHeader /><section className="shell form-wrap"><div className="eyebrow">Password reset</div><h1 className="display">Get back to your space.</h1><p className="form-intro">Enter your email and we’ll send a secure reset link if an eligible account exists.</p><ForgotPasswordForm /><p className="legal-note"><Link className="source-link" href="/sign-in">Return to sign in ↗</Link></p></section></main>;
}

