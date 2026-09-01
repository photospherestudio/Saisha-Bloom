import { cookies } from 'next/headers';
import { cache } from 'react';
import { db } from './db';
import { createClient } from '@/lib/supabase/server';

export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export const getCurrentAuthUser = cache(async function getCurrentAuthUser() {
  if (!hasSupabaseConfig()) return null;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error ? null : user;
});

export const getCurrentAppUser = cache(async function getCurrentAppUser(email?: string) {
  if (hasSupabaseConfig()) {
    const authUser = await getCurrentAuthUser();
    const authEmail = authUser?.email?.toLowerCase();
    const supabaseUserId = authUser?.id;
    const metadataName = typeof authUser?.user_metadata?.display_name === 'string' ? authUser.user_metadata.display_name.trim().slice(0, 80) : '';
    if (!authEmail || !supabaseUserId) return null;
    const byAuthId = await db.user.findUnique({ where: { supabaseUserId } });
    if (byAuthId) {
      if (byAuthId.deletionRequestedAt) return null;
      if (byAuthId.email !== authEmail || (metadataName && byAuthId.displayName !== metadataName)) return db.user.update({ where: { id: byAuthId.id }, data: { email: authEmail, ...(metadataName ? { displayName: metadataName } : {}) } });
      return byAuthId;
    }
    const byEmail = await db.user.findUnique({ where: { email: authEmail } });
    if (byEmail) {
      if (byEmail.deletionRequestedAt || (byEmail.supabaseUserId && byEmail.supabaseUserId !== supabaseUserId)) return null;
      return db.user.update({ where: { id: byEmail.id }, data: { supabaseUserId, ...(metadataName ? { displayName: metadataName } : {}) } });
    }
    return db.user.create({ data: { email: authEmail, supabaseUserId, displayName: metadataName || null } });
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
});
