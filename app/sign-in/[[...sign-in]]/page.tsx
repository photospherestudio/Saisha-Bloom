import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return <SignIn fallbackRedirectUrl="/onboarding" signUpUrl="/sign-up" />;
}
