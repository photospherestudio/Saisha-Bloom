import { cookies } from 'next/headers';
import { db } from './db';
import { createClient } from '@/lib/supabase/server';

export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function getCurrentAuthUser() {
  if (!hasSupabaseConfig()) return null;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
}

export async function getCurrentAppUser(email?: string) {
  if (hasSupabaseConfig()) {
    const authUser = await getCurrentAuthUser();
    const authEmail = authUser?.email?.toLowerCase();
    if (!authEmail) return null;
    return db.user.upsert({ where: { email: authEmail }, update: {}, create: { email: authEmail } });
  }

  const cookieStore = await cookies();
  const demoId = cookieStore.get('milestones-user-id')?.value;

  if (demoId) {
    const user = await db.user.findUnique({ where: { id: demoId } });
    if (user) return user;
  }

  if (!email) return null;
  const user = await db.user.upsert({ where: { email }, update: {}, create: { email } });
  cookieStore.set('milestones-user-id', user.id, { httpOnly: true, sameSite: 'lax', path: '/' });
  return user;
}
