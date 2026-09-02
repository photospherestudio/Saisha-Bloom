'use server';

import { revalidatePath } from 'next/cache';
import { db } from './db';
import { requireChildAccess } from './queries';
import { getCurrentAppUser } from './auth';

const vapidConfigured = Boolean((process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY) && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);

type SubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function subscribePush(input: SubscriptionInput) {
  if (!vapidConfigured || !input.endpoint.startsWith('https://') || !input.keys?.p256dh || !input.keys?.auth) return { ok: false as const, error: 'Push notifications are not configured.' };
  try {
    const user = await getCurrentAppUser();
    if (!user) return { ok: false as const, error: 'Sign in first.' };
    const existing = await db.pushSubscription.findUnique({ where: { endpoint: input.endpoint } });
    if (existing) await db.pushSubscription.update({ where: { id: existing.id }, data: { userId: user.id, p256dh: input.keys.p256dh, auth: input.keys.auth } });
    else await db.pushSubscription.create({ data: { userId: user.id, endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth } });
    return { ok: true as const };
  } catch { return { ok: false as const, error: 'Push subscription could not be saved.' }; }
}

export async function unsubscribePush(endpoint: string) {
  try { const user = await getCurrentAppUser(); if (user) await db.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } }); return { ok: true as const }; } catch { return { ok: false as const, error: 'Push subscription could not be removed.' }; }
}

export async function setReminderChannels(input: { childId: string; emailCheckpointEnabled: boolean; pushCheckpointEnabled: boolean; caregiverActivityEnabled: boolean }) {
  try {
    const { user } = await requireChildAccess(input.childId, 'write');
    await db.reminderPreference.upsert({ where: { userId_childId: { userId: user.id, childId: input.childId } }, update: { enabled: input.emailCheckpointEnabled, emailCheckpointEnabled: input.emailCheckpointEnabled, pushCheckpointEnabled: input.pushCheckpointEnabled, caregiverActivityEnabled: input.caregiverActivityEnabled, emailConsentAt: input.emailCheckpointEnabled ? new Date() : null, pushConsentAt: input.pushCheckpointEnabled ? new Date() : null }, create: { userId: user.id, childId: input.childId, enabled: input.emailCheckpointEnabled, emailCheckpointEnabled: input.emailCheckpointEnabled, pushCheckpointEnabled: input.pushCheckpointEnabled, caregiverActivityEnabled: input.caregiverActivityEnabled, emailConsentAt: input.emailCheckpointEnabled ? new Date() : null, pushConsentAt: input.pushCheckpointEnabled ? new Date() : null } });
    revalidatePath('/dashboard');
    return { ok: true as const };
  } catch { return { ok: false as const, error: 'Reminder preferences could not be saved.' }; }
}
