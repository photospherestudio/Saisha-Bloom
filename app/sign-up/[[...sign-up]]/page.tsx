import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return <SignUp fallbackRedirectUrl="/onboarding" signInUrl="/sign-in" />;
}
