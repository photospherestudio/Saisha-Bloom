import { AppHeader } from '@/components/AppHeader';
import { getCurrentAuthUser, hasSupabaseConfig } from '@/lib/auth';
import { OnboardingForm } from './OnboardingForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabaseReady = hasSupabaseConfig();
  const signedIn = supabaseReady ? Boolean(await getCurrentAuthUser()) : false;
  if (supabaseReady && !signedIn) redirect('/sign-in?next=/onboarding');
  return (
    <main className="page">
      <AppHeader />
      <section className="shell form-wrap">
        <div className="eyebrow">A small beginning</div>
        <h1 className="display">Let’s make this yours.</h1>
        <p className="form-intro">Create a private profile with only what we need: a first name and date of birth. You can add corrected age details if your child arrived early.</p>
        <OnboardingForm demoMode={!supabaseReady} />
        <p className="legal-note">This is not a substitute for standardized developmental screening. Always share concerns with your child’s doctor.</p>
      </section>
    </main>
  );
}
