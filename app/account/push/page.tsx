import { redirect } from 'next/navigation';
import { getCurrentAppUser } from '@/lib/auth';
import { PushPermissionButton } from '@/components/PushPermissionButton';

export const dynamic = 'force-dynamic';

export default async function PushSettingsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect('/sign-in');
  return <main className="page-shell"><div className="panel"><p className="eyebrow">Account</p><h1>Push check-ins</h1><p className="muted">Optional notifications use generic wording and never include child names, notes, photos, or milestone states.</p><PushPermissionButton /></div></main>;
}
