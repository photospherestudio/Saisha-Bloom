'use server';

import { createHash, randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { db } from './db';
import { getCurrentAppUser, hasSupabaseConfig } from './auth';
import { createAdminClient, hasSupabaseAdminConfig } from './supabase/admin';
import { createClient as createServerSupabaseClient } from './supabase/server';
import { requireChildOwner } from './queries';
import { logServerError } from './http';
import { sendResendEmail } from './reminders';
import { shouldSendDeletionFailureAlert } from './account-deletion-alert';

const BUCKET = process.env.SUPABASE_IMAGE_BUCKET ?? 'milestone-memories';
const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

function result(error?: string) { return error ? { ok: false as const, error } : { ok: true as const }; }

async function removePaths(paths: string[]) {
  if (!paths.length) return;
  if (!hasSupabaseAdminConfig()) throw new Error('Supabase service credentials are not configured.');
  const admin = createAdminClient();
  for (let index = 0; index < paths.length; index += 1000) { const { error } = await admin.storage.from(BUCKET).remove(paths.slice(index, index + 1000)); if (error) throw error; }
}

export async function updateChild(input: { childId: string; name: string; dob: string; gestationalWeeks?: number | null }) {
  const name = input.name.trim();
  const dob = new Date(input.dob);
  if (!name || name.length > 80 || Number.isNaN(dob.getTime()) || dob > new Date()) return result('Add a valid child name and date of birth.');
  if (input.gestationalWeeks != null && (!Number.isInteger(input.gestationalWeeks) || input.gestationalWeeks < 20 || input.gestationalWeeks > 45)) return result('Gestational weeks must be between 20 and 45.');
  try { await requireChildOwner(input.childId); await db.child.update({ where: { id: input.childId }, data: { name, dob, gestationalWeeks: input.gestationalWeeks ?? null, gender: null } }); revalidatePath('/account'); revalidatePath('/dashboard'); return result(); } catch { return result('Only the profile owner can edit this child.'); }
}

export async function deleteChild(childId: string) {
  try { await requireChildOwner(childId); const media = await db.milestoneResponseMedia.findMany({ where: { response: { childId } }, select: { objectPath: true } }); await removePaths(media.map((item) => item.objectPath)); await db.child.delete({ where: { id: childId } }); revalidatePath('/account'); revalidatePath('/dashboard'); return result(); } catch (error) { logServerError(randomUUID(), error); return result('Child deletion could not be completed.'); }
}

async function processAccountDeletion(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true, supabaseUserId: true, deletionRequestedAt: true } });
  if (!user || !user.deletionRequestedAt) return true;
  try {
    if (!hasSupabaseAdminConfig()) throw new Error('Supabase service credentials are not configured.');
    const owned = await db.child.findMany({ where: { userId }, select: { id: true } });
    const authored = await db.milestoneResponse.findMany({ where: { userId, child: { userId: { not: userId } } }, select: { id: true, media: { select: { objectPath: true } } } });
    const ownedMedia = await db.milestoneResponseMedia.findMany({ where: { response: { child: { userId } } }, select: { objectPath: true } });
    await removePaths([...ownedMedia.map((item) => item.objectPath), ...authored.flatMap((item) => item.media.map((media) => media.objectPath))]);
    await db.$transaction(async (tx) => {
      await tx.child.deleteMany({ where: { userId } });
      if (authored.length) {
        await tx.milestoneResponseMedia.deleteMany({ where: { responseId: { in: authored.map((item) => item.id) } } });
        await tx.milestoneResponse.updateMany({ where: { id: { in: authored.map((item) => item.id) } }, data: { userId: null, note: null, anonymizedAt: new Date(), anonymizationBatchId: randomUUID(), retentionExpiresAt: new Date(Date.now() + DAYS_30), retainedAt: null } });
      }
    });
    if (user.supabaseUserId) { const { error } = await createAdminClient().auth.admin.deleteUser(user.supabaseUserId); if (error) throw error; }
    await db.user.delete({ where: { id: userId } });
    return true;
  } catch (error) {
    const ref = createHash('sha256').update(String(error)).digest('hex').slice(0, 24);
    const failedUser = await db.user.update({ where: { id: userId }, data: { deletionErrorRef: ref, deletionAttempts: { increment: 1 } }, select: { deletionAttempts: true, deletionAlertSentAt: true } }).catch(() => null);
    if (failedUser && !failedUser.deletionAlertSentAt && shouldSendDeletionFailureAlert(failedUser.deletionAttempts)) {
      const alert = await sendResendEmail({ to: process.env.PRIVACY_CONTACT_EMAIL ?? 'admin.nemesis@gmail.com', subject: 'Saisha Bloom account deletion needs review', html: `<p>An account deletion has failed ${failedUser.deletionAttempts} times and needs manual review.</p><p>Reference: ${ref}</p>`, idempotencyKey: `account-deletion-alert-${createHash('sha256').update(userId).digest('hex').slice(0, 20)}` });
      if (alert.ok) await db.user.updateMany({ where: { id: userId, deletionAlertSentAt: null }, data: { deletionAlertSentAt: new Date() } }).catch(() => undefined);
    }
    logServerError(ref, error);
    return false;
  }
}

export async function requestAccountDeletion(input: { password: string; confirmation: string }) {
  if (!/^DELETE(?: MY ACCOUNT)?$/i.test(input.confirmation.trim())) return result('Type DELETE MY ACCOUNT to confirm permanent account deletion.');
  if (!hasSupabaseConfig()) return result('Account deletion requires hosted authentication.');
  const user = await getCurrentAppUser();
  if (!user) return result('Sign in first.');
  const supabase = await createServerSupabaseClient();
  const reauth = await supabase.auth.signInWithPassword({ email: user.email, password: input.password });
  if (reauth.error) return result('Current password could not be confirmed.');
  await db.user.update({ where: { id: user.id }, data: { deletionRequestedAt: new Date(), deletionErrorRef: null } });
  const completed = await processAccountDeletion(user.id);
  return completed ? result() : result('Deletion is queued for secure retry.');
}

export async function retryPendingAccountDeletions() {
  const users = await db.user.findMany({ where: { deletionRequestedAt: { not: null } }, select: { id: true } });
  let completed = 0;
  for (const user of users) if (await processAccountDeletion(user.id)) completed += 1;
  return completed;
}

export async function expireAnonymousEntries(now = new Date()) {
  const entries = await db.milestoneResponse.findMany({ where: { userId: null, retainedAt: null, retentionExpiresAt: { lt: now } }, select: { id: true, media: { select: { objectPath: true } } } });
  for (const entry of entries) { await removePaths(entry.media.map((media) => media.objectPath)); await db.milestoneResponse.deleteMany({ where: { id: entry.id, userId: null } }); }
  return entries.length;
}

export async function resolveAnonymousEntry(input: { responseId: string; decision: 'retain' | 'delete' }) {
  try {
    const response = await db.milestoneResponse.findUnique({ where: { id: input.responseId }, include: { child: { select: { userId: true } }, media: { select: { objectPath: true } } } });
    const user = await getCurrentAppUser();
    if (!response || !user || response.child.userId !== user.id || response.userId !== null) return result('Anonymous entry not found.');
    if (input.decision === 'retain') await db.milestoneResponse.update({ where: { id: response.id }, data: { retainedAt: new Date(), retentionExpiresAt: null } });
    else { await removePaths(response.media.map((item) => item.objectPath)); await db.milestoneResponse.delete({ where: { id: response.id } }); }
    revalidatePath(`/child/${response.childId}/timeline`);
    return result();
  } catch { return result('Anonymous entry could not be updated.'); }
}

type FormOrObject = FormData | Record<string, unknown>;
function field(input: FormOrObject, key: string) { return input instanceof FormData ? String(input.get(key) ?? '') : String(input[key] ?? ''); }

export async function deleteAccount(input: FormOrObject) {
  return requestAccountDeletion({ password: field(input, 'password'), confirmation: field(input, 'confirmation') || field(input, 'confirm') });
}

export async function deleteOwnedChild(input: FormOrObject | string) {
  if (typeof input !== 'string') { const confirmation = field(input, 'confirmation') || field(input, 'confirm'); if (!/^DELETE(?: CHILD)?$/i.test(confirmation.trim())) return result('Type DELETE CHILD to confirm permanent child deletion.'); }
  return deleteChild(typeof input === 'string' ? input : field(input, 'childId') || field(input, 'id'));
}

export async function updateOwnedChild(input: FormOrObject) {
  return updateChild({ childId: field(input, 'childId') || field(input, 'id'), name: field(input, 'name'), dob: field(input, 'dob'), gestationalWeeks: field(input, 'gestationalWeeks') ? Number(field(input, 'gestationalWeeks')) : null });
}

export async function updateAccountSettings(input: FormOrObject) {
  const user = await getCurrentAppUser();
  if (!user) return result('Sign in first.');
  const displayName = field(input, 'displayName').trim();
  const timezone = field(input, 'timezone').trim();
  if (displayName.length > 80) return result('Keep your name under 80 characters.');
  if (timezone) { try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(); } catch { return result('Choose a valid timezone.'); } }
  await db.user.update({ where: { id: user.id }, data: { displayName: displayName || null, timezone: timezone || null } });
  revalidatePath('/account');
  return result();
}

import { resendConfirmation as resendConfirmationAction, requestPasswordRecovery as requestPasswordRecoveryAction, updatePassword as updatePasswordAction } from './actions';

export async function resendConfirmation(input: FormOrObject | string, destination?: string) {
  if (typeof input === 'string') return resendConfirmationAction(input, destination);
  return resendConfirmationAction({ email: field(input, 'email'), destination: field(input, 'destination') || undefined });
}
export async function requestPasswordRecovery(input: FormOrObject | string) {
  return requestPasswordRecoveryAction(typeof input === 'string' ? input : { email: field(input, 'email') });
}
export async function updatePassword(input: FormOrObject | string) {
  return updatePasswordAction(typeof input === 'string' ? input : { password: field(input, 'password'), currentPassword: field(input, 'currentPassword') || undefined });
}
