import { db } from './db';
import { childAge, reminderCheckpointForAge } from './age';
import { sendGenericPush } from './push-delivery';

type ResendEmail = { to: string; subject: string; html: string; idempotencyKey: string };

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export async function sendResendEmail(input: ResendEmail): Promise<{ ok: true; id?: string } | { ok: false }> {
  if (!process.env.RESEND_API_KEY || !process.env.REMINDER_FROM_EMAIL) return { ok: false };
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': input.idempotencyKey },
      body: JSON.stringify({ from: process.env.REMINDER_FROM_EMAIL, to: [input.to], subject: input.subject, html: input.html }),
    });
    if (!response.ok) return { ok: false };
    const data = await response.json() as { id?: string };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false };
  }
}

export async function runDailyReminders(now = new Date()) {
  const preferences = await db.reminderPreference.findMany({
    where: { OR: [{ emailCheckpointEnabled: true }, { pushCheckpointEnabled: true }, { enabled: true }] },
    include: { user: { select: { id: true, email: true } }, child: { select: { id: true, name: true, dob: true, gestationalWeeks: true } } },
  });
  const result = { considered: preferences.length, sent: 0, pushSent: 0, skipped: 0, failed: 0, expiredPush: 0 };

  for (const preference of preferences) {
    const age = childAge(preference.child.dob, preference.child.gestationalWeeks, now);
    const checkpoint = reminderCheckpointForAge(age.activeAgeInMonths);
    if (!checkpoint) {
      result.skipped += 1;
      continue;
    }
    const channels: Array<'email' | 'push'> = [];
    if (preference.emailCheckpointEnabled || preference.enabled) channels.push('email');
    if (preference.pushCheckpointEnabled) channels.push('push');
    for (const channel of channels) {
      let delivery: { id: string };
      try { delivery = await db.reminderDelivery.create({ data: { userId: preference.user.id, childId: preference.child.id, checkpoint, channel } }); }
      catch (error) { if ((error as { code?: string }).code === 'P2002') { result.skipped += 1; continue; } throw error; }
      if (channel === 'push') {
        const pushed = await sendGenericPush(preference.user.id, 'checkpoint');
        await db.reminderDelivery.update({ where: { id: delivery.id }, data: { status: pushed.sent ? 'sent' : 'failed', sentAt: pushed.sent ? now : null, error: pushed.sent ? null : 'No active push subscription.' } });
        result.pushSent += pushed.sent;
        result.expiredPush += pushed.expired;
        if (!pushed.sent) result.failed += 1;
      } else {
        const message = `${preference.child.name} is around ${checkpoint} months. Take a gentle look at the new guideposts whenever it feels right.`;
        const sent = await sendResendEmail({ to: preference.user.email, subject: `${preference.child.name}'s ${checkpoint}-month guideposts`, html: `<p>${message}</p><p><a href="${siteUrl()}/child/${preference.child.id}/feed">Explore this week's ideas</a></p><p>Milestones are guideposts, not deadlines. Share any concerns with your child's care team.</p>`, idempotencyKey: `reminder-${delivery.id}` });
        if (sent.ok) { await db.reminderDelivery.update({ where: { id: delivery.id }, data: { status: 'sent', providerId: sent.id, sentAt: now } }); result.sent += 1; }
        else { await db.reminderDelivery.update({ where: { id: delivery.id }, data: { status: 'failed', error: 'Resend delivery failed.' } }); result.failed += 1; }
      }
    }
  }
  return result;
}
