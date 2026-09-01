'use server';

import webpush from 'web-push';
import { revalidatePath } from 'next/cache';
import { db } from './db';
import { requireChildAccess } from './queries';
import { getCurrentAppUser } from './auth';

const vapidConfigured = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
if (vapidConfigured) webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);

type SubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function subscribePush(input: SubscriptionInput) {
  if (!vapidConfigured || !input.endpoint.startsWith('https://') || !input.keys?.p256dh || !input.keys?.auth) return { ok: false as const, error: 'Push notifications are not configured.' };
  try {
    const user = await getCurrentAppUser();
    if (!user) return { ok: false as const, error: 'Sign in first.' };
    const existing = await db.pushSubscription.findUnique({ where: { endpoint: input.endpoint } });
    if (existing) await db.pushSubscription.update({ where: { id: existing.id }, data: { userId: user.id, p256dh: input.keys.p256dh, auth: input.keys.auth } });
    else await db.pushSubscription.create({ data: { userId: user.id, endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth } });
    return { ok: true as const, publicKey: process.env.VAPID_PUBLIC_KEY };
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

export async function sendGenericPush(userId: string, event: 'checkpoint' | 'caregiver') {
  if (!vapidConfigured) return { sent: 0, expired: 0 };
  const subscriptions = await db.pushSubscription.findMany({ where: { userId } });
  let sent = 0; let expired = 0;
  const payload = JSON.stringify({ title: 'Saisha Bloom', body: event === 'checkpoint' ? 'A gentle Saisha Bloom check-in is ready.' : 'A caregiver added a new Saisha Bloom observation.', url: '/dashboard' });
  for (const subscription of subscriptions) {
    try { await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload); sent += 1; }
    catch (error) { const status = (error as { statusCode?: number }).statusCode; if (status === 404 || status === 410) { await db.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined); expired += 1; } }
  }
  return { sent, expired };
}
