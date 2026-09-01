'use server';

import { createHash, randomBytes, randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { db } from './db';
import { getCurrentAppUser, hasSupabaseConfig } from './auth';
import { createAdminClient, hasSupabaseAdminConfig } from './supabase/admin';
import { createClient as createServerSupabaseClient } from './supabase/server';
import { requireChildAccess, requireChildOwner } from './queries';
import { sendResendEmail, siteUrl } from './reminders';
import { consumeAuthAttempt } from './rate-limit';
import { logServerError, newCorrelationId } from './http';
import type { MilestoneStatus } from './types';

const IMAGE_BUCKET = process.env.SUPABASE_IMAGE_BUCKET ?? 'milestone-memories';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

function inviteHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function revalidateChild(childId: string) {
  revalidatePath('/dashboard');
  revalidatePath(`/child/${childId}/checklist`);
  revalidatePath(`/child/${childId}/timeline`);
  revalidatePath(`/child/${childId}/feed`);
}

function safeDestination(value: string) {
  return value.startsWith('/') && !value.startsWith('//') ? value : '/onboarding';
}

function actionError(message: string, correlationId = newCorrelationId()) {
  return { ok: false as const, error: message, correlationId };
}

function actionFailure(message: string, error: unknown) {
  const correlationId = newCorrelationId();
  logServerError(correlationId, error);
  return actionError(message, correlationId);
}

export async function authenticate(input: { mode: 'sign-in' | 'sign-up'; email: string; password: string; displayName: string; destination: string }) {
  const correlationId = newCorrelationId();
  try {
    const allowed = await consumeAuthAttempt(input.mode === 'sign-in' ? 'login' : 'signup', 5, 60 * 1000);
    if (!allowed) return { ok: false as const, error: 'Too many authentication attempts. Try again later.', correlationId };
    const supabase = await createServerSupabaseClient();
    const destination = safeDestination(input.destination);
    const result = input.mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email: input.email, password: input.password })
      : await supabase.auth.signUp({ email: input.email, password: input.password, options: { emailRedirectTo: `${siteUrl()}/auth/confirm?next=${encodeURIComponent(destination)}`, data: { display_name: input.displayName } } });
    if (result.error) {
      logServerError(correlationId, result.error);
      return { ok: false as const, error: input.mode === 'sign-in' ? 'Sign in failed. Check your email and password.' : 'Sign up failed. Check your details and try again.', correlationId };
    }
    return { ok: true as const, hasSession: Boolean(result.data.session), correlationId };
  } catch (error) {
    logServerError(correlationId, error);
    return { ok: false as const, error: 'Authentication is temporarily unavailable. Try again later.', correlationId };
  }
}

export async function createChild(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const displayName = String(formData.get('displayName') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const dob = String(formData.get('dob') ?? '');
  // Gender is retained only as a legacy nullable field; copy is name-first and neutral.
  const gender = null;
  const gestationalWeeksValue = String(formData.get('gestationalWeeks') ?? '').trim();
  const gestationalWeeks = gestationalWeeksValue ? Number(gestationalWeeksValue) : null;
  const heightCmValue = String(formData.get('heightCm') ?? '').trim();
  const heightCm = heightCmValue ? Number(heightCmValue) : null;
  const weightKgValue = String(formData.get('weightKg') ?? '').trim();
  const weightKg = weightKgValue ? Number(weightKgValue) : null;

  if (!email && !hasSupabaseConfig()) return actionError('Add a valid email.');
  if (!displayName) return actionError('Add your first name so shared observations feel personal.');
  if (displayName.length > 80) return actionError('Keep your first name under 80 characters.');
  if (!name) return actionError('Add your child’s first name.');
  if (!dob || Number.isNaN(new Date(dob).getTime())) return actionError('Add a date of birth.');
  if (gestationalWeeks !== null && (!Number.isInteger(gestationalWeeks) || gestationalWeeks < 20 || gestationalWeeks > 45)) return actionError('Gestational weeks must be between 20 and 45.');
  if (heightCm !== null && (!Number.isFinite(heightCm) || heightCm < 30 || heightCm > 140)) return actionError('Height must be between 30 and 140 cm.');
  if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg < 1 || weightKg > 45)) return actionError('Weight must be between 1 and 45 kg.');

  try {
    const user = await getCurrentAppUser(email);
    if (!user) return actionError('Sign in first, or configure a database-backed demo account.');
    if (user.displayName !== displayName) await db.user.update({ where: { id: user.id }, data: { displayName } });
    const child = await db.child.create({ data: { userId: user.id, name, dob: new Date(dob), gender, gestationalWeeks, heightCm, weightKg } });
    revalidatePath('/dashboard');
    return { childId: child.id };
  } catch (error) {
    return actionFailure('Your profile could not be saved. Check the database connection and try again.', error);
  }
}

export async function saveMilestoneResponse(input: { childId: string; milestoneId: string; status: MilestoneStatus; note?: string }) {
  if (!['yes', 'almost', 'not_yet'].includes(input.status)) return actionError('Choose Yes, Almost, or Not Yet.');
  const note = input.note?.trim() || null;
  if (note && note.length > 2_000) return actionError('Keep observations under 2,000 characters.');
  try {
    const { user } = await requireChildAccess(input.childId, 'write');
    const milestone = await db.milestone.findUnique({ where: { id: input.milestoneId }, select: { id: true } });
    if (!milestone) return actionError('Milestone not found.');
    const response = await db.milestoneResponse.create({ data: { childId: input.childId, milestoneId: input.milestoneId, userId: user.id, status: input.status, note } });
    revalidateChild(input.childId);
    return { ok: true as const, responseId: response.id };
  } catch (error) {
    return actionFailure('Child profile not found.', error);
  }
}

export async function createCaregiverInvite(input: { childId: string; email: string }) {
  const email = input.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return actionError('Add a valid caregiver email.');
  try {
    const { child, user } = await requireChildOwner(input.childId);
    if (email === user.email) return actionError('You already own this profile.');
    await db.childInvite.updateMany({ where: { childId: child.id, email, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invite = await db.childInvite.create({ data: { childId: child.id, email, tokenHash: inviteHash(token), invitedBy: user.id, expiresAt } });
    const existingUser = await db.user.findUnique({ where: { email }, select: { id: true } });
    const url = `${siteUrl()}/invite?token=${encodeURIComponent(token)}`;
    let delivery: 'supabase' | 'resend';
    if (!existingUser && hasSupabaseAdminConfig()) {
      const { error } = await createAdminClient().auth.admin.inviteUserByEmail(email, { redirectTo: url });
      if (!error) delivery = 'supabase';
      else {
        const sent = await sendResendEmail({ to: email, subject: `You are invited to ${child.name}'s Saisha Bloom profile`, html: `<p>You have been invited to help notice ${child.name}'s growing story.</p><p><a href="${url}">Accept invitation</a></p>`, idempotencyKey: `child-invite-${invite.id}` });
        if (!sent.ok) {
          await db.childInvite.update({ where: { id: invite.id }, data: { revokedAt: new Date() } });
          return actionError('Invitation could not be delivered. Configure Resend and try again.');
        }
        delivery = 'resend';
      }
    } else {
      const sent = await sendResendEmail({ to: email, subject: `You are invited to ${child.name}'s Saisha Bloom profile`, html: `<p>You have been invited to help notice ${child.name}'s growing story.</p><p><a href="${url}">Accept invitation</a></p>`, idempotencyKey: `child-invite-${invite.id}` });
      if (!sent.ok) {
        await db.childInvite.update({ where: { id: invite.id }, data: { revokedAt: new Date() } });
        return actionError('Invitation could not be delivered. Configure Resend and try again.');
      }
      delivery = 'resend';
    }
    revalidateChild(child.id);
    return { ok: true as const, delivery, expiresAt: expiresAt.toISOString() };
  } catch (error) {
    return actionFailure('Only the profile owner can invite a caregiver.', error);
  }
}

export async function acceptCaregiverInvite(token: string) {
  if (!token) return actionError('Invitation token is required.');
  try {
    const user = await getCurrentAppUser();
    if (!user) return actionError('Sign in with the invited email first.');
    const invite = await db.childInvite.findUnique({ where: { tokenHash: inviteHash(token) }, include: { child: { select: { userId: true } } } });
    if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt <= new Date()) return actionError('This invitation is no longer valid.');
    if (invite.email !== user.email) return actionError('Sign in with the email that received this invitation.');
    await db.$transaction([
      db.childInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
      ...(invite.child.userId === user.id ? [] : [db.childMember.upsert({ where: { childId_userId: { childId: invite.childId, userId: user.id } }, update: { role: 'editor', invitedBy: invite.invitedBy }, create: { childId: invite.childId, userId: user.id, role: 'editor', invitedBy: invite.invitedBy } })]),
    ]);
    revalidateChild(invite.childId);
    return { ok: true as const, childId: invite.childId };
  } catch (error) {
    return actionFailure('Invitation could not be accepted.', error);
  }
}

export async function revokeCaregiverAccess(input: { childId: string; email: string }) {
  try {
    const { child } = await requireChildOwner(input.childId);
    const email = input.email.trim().toLowerCase();
    const caregiver = await db.user.findUnique({ where: { email }, select: { id: true } });
    await db.$transaction([
      ...(caregiver ? [db.childMember.deleteMany({ where: { childId: child.id, userId: caregiver.id } })] : []),
      db.childInvite.updateMany({ where: { childId: child.id, email, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    revalidateChild(child.id);
    return { ok: true as const };
  } catch (error) {
    return actionFailure('Only the profile owner can remove a caregiver.', error);
  }
}

export async function createObservationUploadTargets(input: { childId: string; responseId: string; files: { mimeType: string; sizeBytes: number }[] }) {
  if (!input.files.length || input.files.length > 3) return actionError('Choose one to three images.');
  if (input.files.some((file) => !IMAGE_TYPES.has(file.mimeType) || file.sizeBytes <= 0 || file.sizeBytes > MAX_IMAGE_BYTES)) return actionError('Images must be JPEG, PNG, WebP, or HEIC and no larger than 10 MB.');
  try {
    await requireChildAccess(input.childId, 'write');
    const response = await db.milestoneResponse.findFirst({ where: { id: input.responseId, childId: input.childId }, select: { id: true } });
    if (!response || !hasSupabaseAdminConfig()) return actionError('Image uploads are not configured.');
    const admin = createAdminClient();
    const uploads = await Promise.all(input.files.map(async (file) => {
      const extension = file.mimeType === 'image/png' ? 'png' : file.mimeType === 'image/webp' ? 'webp' : file.mimeType === 'image/heic' ? 'heic' : 'jpg';
      const objectPath = `children/${input.childId}/responses/${input.responseId}/${randomUUID()}.${extension}`;
      const { data, error } = await admin.storage.from(IMAGE_BUCKET).createSignedUploadUrl(objectPath);
      if (error || !data) throw new Error('Could not prepare image upload.');
      return { objectPath, signedUrl: data.signedUrl, token: data.token, mimeType: file.mimeType, sizeBytes: file.sizeBytes };
    }));
    return { ok: true as const, uploads };
  } catch (error) {
    return actionFailure('Could not prepare image upload.', error);
  }
}

export async function registerObservationMedia(input: { childId: string; responseId: string; uploads: { objectPath: string; mimeType: string; sizeBytes: number }[] }) {
  if (!input.uploads.length || input.uploads.length > 3) return actionError('Choose one to three images.');
  const prefix = `children/${input.childId}/responses/${input.responseId}/`;
  if (input.uploads.some((item) => !item.objectPath.startsWith(prefix) || !IMAGE_TYPES.has(item.mimeType) || item.sizeBytes <= 0 || item.sizeBytes > MAX_IMAGE_BYTES)) return actionError('Invalid image upload.');
  try {
    await requireChildAccess(input.childId, 'write');
    const response = await db.milestoneResponse.findFirst({ where: { id: input.responseId, childId: input.childId }, select: { id: true } });
    if (!response) return actionError('Observation not found.');
    await db.milestoneResponseMedia.createMany({ data: input.uploads.map((item) => ({ responseId: response.id, ...item })), skipDuplicates: true });
    revalidateChild(input.childId);
    return { ok: true as const };
  } catch (error) {
    return actionFailure('Images could not be saved.', error);
  }
}

export async function setReminderPreference(input: { childId: string; enabled: boolean }) {
  try {
    const { user } = await requireChildAccess(input.childId);
    await db.reminderPreference.upsert({ where: { userId_childId: { userId: user.id, childId: input.childId } }, update: { enabled: input.enabled }, create: { userId: user.id, childId: input.childId, enabled: input.enabled } });
    revalidatePath('/dashboard');
    return { ok: true as const, enabled: input.enabled };
  } catch (error) {
    return actionFailure('Child profile not found.', error);
  }
}

export async function resendConfirmation(input: { email: string; destination?: string } | string, destination?: string) {
  const request = typeof input === 'string' ? { email: input, destination } : input;
  const correlationId = newCorrelationId();
  try {
    if (!(await consumeAuthAttempt('resend_confirmation', 5, 60 * 1000))) return { ok: false as const, error: 'Too many requests. Try again later.', message: 'Too many requests. Try again later.', correlationId };
    const supabase = await createServerSupabaseClient();
    await supabase.auth.resend({ type: 'signup', email: request.email.trim().toLowerCase(), options: { emailRedirectTo: `${siteUrl()}/auth/confirm?next=${encodeURIComponent(safeDestination(request.destination ?? '/onboarding'))}` } });
    return { ok: true as const, message: 'If that email is eligible, a confirmation message is on its way.' };
  } catch (error) { logServerError(correlationId, error); return { ok: true as const, message: 'If that email is eligible, a confirmation message is on its way.' }; }
}

export async function requestPasswordRecovery(input: { email: string } | string) {
  const email = typeof input === 'string' ? input : input.email;
  const correlationId = newCorrelationId();
  try {
    if (!(await consumeAuthAttempt('recovery', 5, 60 * 1000))) return { ok: false as const, error: 'Too many requests. Try again later.', message: 'Too many requests. Try again later.', correlationId };
    const supabase = await createServerSupabaseClient();
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${siteUrl()}/auth/confirm?next=${encodeURIComponent('/account/update-password')}` });
  } catch (error) { logServerError(correlationId, error); }
  return { ok: true as const, message: 'If an account exists for that email, a reset link is on its way.' };
}

export async function updatePassword(input: { password: string; currentPassword?: string } | string) {
  const request = typeof input === 'string' ? { password: input } : input;
  if (request.password.length < 8) return actionError('Use a password of at least 8 characters.');
  try {
    const supabase = await createServerSupabaseClient();
    const options = request.currentPassword ? ({ password: request.password, current_password: request.currentPassword } as never) : { password: request.password };
    const { error } = await supabase.auth.updateUser(options);
    if (error) return actionError('Password could not be updated.');
    return { ok: true as const };
  } catch (error) { return actionFailure('Password could not be updated.', error); }
}
