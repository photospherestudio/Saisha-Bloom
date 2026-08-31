import { AppHeader } from '@/components/AppHeader';
import { AuthForm } from '@/components/AuthForm';

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <main className="page"><AppHeader /><section className="shell form-wrap"><div className="eyebrow">A small beginning</div><h1 className="display">Make this yours.</h1><p className="form-intro">Create a private account, choose how you’d like to be credited, then make a child profile with only what you need.</p><AuthForm mode="sign-up" next={next} /><p className="legal-note">Already have an account? <a className="source-link" href="/sign-in">Sign in ↗</a></p></section></main>;
}
