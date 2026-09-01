import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { getCurrentAuthUser } from '@/lib/auth';
import { UpdatePasswordForm } from '@/components/UpdatePasswordForm';

export const dynamic = 'force-dynamic';

export default async function UpdatePasswordPage() {
  if (!await getCurrentAuthUser()) redirect('/forgot-password');
  return <main className="page"><AppHeader backHref="/account" /><section className="shell form-wrap"><div className="eyebrow">Password reset</div><h1 className="display">Choose a new password.</h1><p className="form-intro">This secure page is available after the email link is confirmed.</p><UpdatePasswordForm /></section></main>;
}

