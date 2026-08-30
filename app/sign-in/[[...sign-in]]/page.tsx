import { AppHeader } from '@/components/AppHeader';
import { AuthForm } from '@/components/AuthForm';

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <main className="page"><AppHeader /><section className="shell form-wrap"><div className="eyebrow">Welcome back</div><h1 className="display">Return to your space.</h1><p className="form-intro">Sign in to continue noticing the small things.</p><AuthForm mode="sign-in" next={next} /><p className="legal-note">New here? <a className="source-link" href="/sign-up">Create an account ↗</a></p></section></main>;
}
