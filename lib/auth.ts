import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { db } from './db';

export function hasClerkConfig() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

async function getClerkAppUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (!email) return null;

  const existing = await db.user.findUnique({ where: { clerkId: userId } });
  if (existing) return db.user.update({ where: { id: existing.id }, data: { email } });

  const sameEmail = await db.user.findUnique({ where: { email } });
  if (sameEmail) return db.user.update({ where: { id: sameEmail.id }, data: { clerkId: userId } });

  return db.user.create({ data: { clerkId: userId, email } });
}

export async function getCurrentAppUser(email?: string) {
  if (hasClerkConfig()) return getClerkAppUser();

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
