import { SignUp } from '@clerk/nextjs';
import { AppHeader } from '@/components/AppHeader';
import { auth } from '@clerk/nextjs/server';
import { hasClerkConfig } from '@/lib/auth';
import { OnboardingForm } from './OnboardingForm';

export default async function OnboardingPage() {
  const clerkReady = hasClerkConfig();
  const signedIn = clerkReady ? Boolean((await auth()).userId) : false;
  return (
    <main className="page">
      <AppHeader />
      <section className="shell form-wrap">
        <div className="eyebrow">A small beginning</div>
        <h1 className="display">Let’s make this yours.</h1>
        <p className="form-intro">Create a private profile with only what we need: a first name and date of birth. You can add corrected age details if your child arrived early.</p>
        {clerkReady && !signedIn ? <SignUp fallbackRedirectUrl="/onboarding" signInUrl="/sign-in" /> : <OnboardingForm demoMode={!clerkReady} />}
        <p className="legal-note">This is not a substitute for standardized developmental screening. Always share concerns with your child’s doctor.</p>
      </section>
    </main>
  );
}
