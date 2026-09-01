import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { AccountSettings } from '@/components/AccountSettings';
import { getCurrentAppUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect('/sign-in?next=/account');
  const children = await db.child.findMany({ where: { userId: user.id }, select: { id: true, name: true, dob: true, gestationalWeeks: true }, orderBy: { createdAt: 'asc' } });
  return <main className="page"><AppHeader backHref="/dashboard" /><section className="shell"><div className="page-heading"><div><div className="eyebrow">Account</div><h1 className="display">Your private space.</h1></div></div><AccountSettings user={{ email: user.email, displayName: user.displayName ?? '', timezone: user.timezone }} children={children.map((child) => ({ ...child, dob: child.dob.toISOString() }))} /></section></main>;
}
