import 'server-only';
import webpush from 'web-push';
import { db } from './db';
import { genericPushPayload } from './push-payload';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY;
const vapidConfigured = Boolean(publicKey && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
if (vapidConfigured) webpush.setVapidDetails(process.env.VAPID_SUBJECT!, publicKey!, process.env.VAPID_PRIVATE_KEY!);

export async function sendGenericPush(userId: string, event: 'checkpoint' | 'caregiver') {
  if (!vapidConfigured) return { sent: 0, expired: 0 };
  const subscriptions = await db.pushSubscription.findMany({ where: { userId } });
  let sent = 0; let expired = 0;
  const payload = JSON.stringify(genericPushPayload(event));
  for (const subscription of subscriptions) {
    try { await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload); sent += 1; }
    catch (error) { const status = (error as { statusCode?: number }).statusCode; if (status === 404 || status === 410) { await db.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => undefined); expired += 1; } }
  }
  return { sent, expired };
}

export async function sendCaregiverObservationPush(childId: string, authorId: string) {
  const child = await db.child.findUnique({ where: { id: childId }, select: { userId: true, members: { select: { userId: true } } } });
  if (!child) return { sent: 0, expired: 0 };
  const activeUsers = [child.userId, ...child.members.map(({ userId }) => userId)].filter((userId) => userId !== authorId);
  const preferences = await db.reminderPreference.findMany({ where: { childId, caregiverActivityEnabled: true, userId: { in: activeUsers } }, select: { userId: true } });
  const results = await Promise.all(preferences.map(({ userId }) => sendGenericPush(userId, 'caregiver')));
  return results.reduce((total, result) => ({ sent: total.sent + result.sent, expired: total.expired + result.expired }), { sent: 0, expired: 0 });
}
