import { AppHeader } from '@/components/AppHeader';
import { AuthForm } from '@/components/AuthForm';

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const initialError = error === 'confirmation' ? 'That confirmation link has expired or was already used. Request a new one, then try again.' : '';
  return <main className="page"><AppHeader /><section className="shell form-wrap"><div className="eyebrow">Welcome back</div><h1 className="display">Return to your space.</h1><p className="form-intro">Sign in to continue noticing the small things.</p><AuthForm mode="sign-in" next={next} initialError={initialError} /><p className="legal-note">New here? <a className="source-link" href="/sign-up">Create an account ↗</a></p></section></main>;
}
