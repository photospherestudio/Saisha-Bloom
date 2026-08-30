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
    const supabaseUserId = authUser?.id;
    if (!authEmail || !supabaseUserId) return null;
    const byAuthId = await db.user.findUnique({ where: { supabaseUserId } });
    if (byAuthId) {
      if (byAuthId.email !== authEmail) return db.user.update({ where: { id: byAuthId.id }, data: { email: authEmail } });
      return byAuthId;
    }
    const byEmail = await db.user.findUnique({ where: { email: authEmail } });
    if (byEmail) {
      if (byEmail.supabaseUserId && byEmail.supabaseUserId !== supabaseUserId) return null;
      return db.user.update({ where: { id: byEmail.id }, data: { supabaseUserId } });
    }
    return db.user.create({ data: { email: authEmail, supabaseUserId } });
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
