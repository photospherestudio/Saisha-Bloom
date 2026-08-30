'use server';

import { revalidatePath } from 'next/cache';
import { db } from './db';
import { getCurrentAppUser, hasClerkConfig } from './auth';
import type { MilestoneStatus } from './types';

export async function createChild(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const dob = String(formData.get('dob') ?? '');
  const genderValue = String(formData.get('gender') ?? '').trim();
  const gender = genderValue === 'boy' || genderValue === 'girl' ? genderValue : null;
  const gestationalWeeksValue = String(formData.get('gestationalWeeks') ?? '').trim();
  const gestationalWeeks = gestationalWeeksValue ? Number(gestationalWeeksValue) : null;
  const heightCmValue = String(formData.get('heightCm') ?? '').trim();
  const heightCm = heightCmValue ? Number(heightCmValue) : null;
  const weightKgValue = String(formData.get('weightKg') ?? '').trim();
  const weightKg = weightKgValue ? Number(weightKgValue) : null;

  if (!email && !hasClerkConfig()) return { error: 'Add a valid email.' };
  if (!name) return { error: 'Add your child’s first name.' };
  if (!dob || Number.isNaN(new Date(dob).getTime())) return { error: 'Add a date of birth.' };
  if (!gender) return { error: 'Choose Girl or Boy so we can use the right pronouns.' };
  if (gestationalWeeks !== null && (!Number.isInteger(gestationalWeeks) || gestationalWeeks < 20 || gestationalWeeks > 45)) return { error: 'Gestational weeks must be between 20 and 45.' };
  if (heightCm !== null && (!Number.isFinite(heightCm) || heightCm < 30 || heightCm > 140)) return { error: 'Height must be between 30 and 140 cm.' };
  if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg < 1 || weightKg > 45)) return { error: 'Weight must be between 1 and 45 kg.' };

  try {
    const user = await getCurrentAppUser(email);
    if (!user) return { error: 'Sign in first, or configure a database-backed demo account.' };
    const child = await db.child.create({
      data: {
        userId: user.id,
        name,
        dob: new Date(dob),
        gender,
        gestationalWeeks,
        heightCm,
        weightKg,
      },
    });
    revalidatePath('/dashboard');
    return { childId: child.id };
  } catch {
    return { error: 'Your profile could not be saved. Check the database connection and try again.' };
  }
}

export async function saveMilestoneResponse(input: {
  childId: string;
  milestoneId: string;
  status: MilestoneStatus;
}) {
  if (!['yes', 'almost', 'not_yet'].includes(input.status)) return { error: 'Choose Yes, Almost, or Not Yet.' };
  try {
    const user = await getCurrentAppUser();
    if (!user) return { error: 'Sign in before saving progress.' };
    const child = await db.child.findFirst({ where: { id: input.childId, userId: user.id } });
    if (!child) return { error: 'Child profile not found.' };

    await db.milestoneResponse.create({ data: { childId: input.childId, milestoneId: input.milestoneId, status: input.status } });
    revalidatePath(`/child/${input.childId}/checklist`);
    revalidatePath(`/child/${input.childId}/timeline`);
    return { ok: true };
  } catch {
    return { error: 'Progress could not be saved. Check your database connection.' };
  }
}
