'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { db } from './db';
import { requireChildAccess } from './queries';
import { createAdminClient, hasSupabaseAdminConfig } from './supabase/admin';
import { logServerError, newCorrelationId } from './http';
import type { MilestoneStatus } from './types';
import { sendCaregiverObservationPush } from './push-delivery';

const BUCKET = process.env.SUPABASE_IMAGE_BUCKET ?? 'milestone-memories';
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
const STATUSES = new Set<MilestoneStatus>(['yes', 'almost', 'not_yet']);

type UploadFile = { mimeType: string; sizeBytes: number };
type PreparedFile = UploadFile & { objectPath: string; token: string };

function error(message: string) {
  return { ok: false as const, error: message, correlationId: newCorrelationId() };
}

function extension(type: string) {
  return type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : type === 'image/heic' ? 'heic' : 'jpg';
}

function resumableEndpoint() {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configured) return null;
  const url = new URL(configured);
  const host = url.hostname.endsWith('.supabase.co') ? `${url.hostname.split('.')[0]}.storage.supabase.co` : url.hostname;
  return `${url.protocol}//${host}/storage/v1/upload/resumable`;
}

async function removeObjects(paths: string[]) {
  if (!paths.length) return;
  if (!hasSupabaseAdminConfig()) throw new Error('Supabase service credentials are not configured.');
  const { error } = await createAdminClient().storage.from(BUCKET).remove(paths);
  if (error) throw error;
}

function validFiles(files: UploadFile[]) {
  return files.length <= 3 && files.every((file) => TYPES.has(file.mimeType) && Number.isInteger(file.sizeBytes) && file.sizeBytes > 0 && file.sizeBytes <= MAX_BYTES);
}

export async function prepareObservation(input: { childId: string; milestoneId: string; status: MilestoneStatus; note?: string; files: UploadFile[] }) {
  if (!STATUSES.has(input.status)) return error('Choose Yes, Almost, or Not Yet.');
  if (!validFiles(input.files)) return error('Choose up to three images under 10 MB each.');
  const note = input.note?.trim() || null;
  if (note && note.length > 2_000) return error('Keep observations under 2,000 characters.');
  try {
    const { user } = await requireChildAccess(input.childId, 'write');
    const milestone = await db.milestone.findUnique({ where: { id: input.milestoneId }, select: { id: true } });
    if (!milestone || (input.files.length > 0 && !hasSupabaseAdminConfig())) return error('Image uploads are not configured.');
    const endpoint = resumableEndpoint();
    if (input.files.length > 0 && !endpoint) return error('Image uploads are not configured.');
    const responseId = randomUUID();
    const admin = createAdminClient();
    const prepared: PreparedFile[] = [];
    try {
      for (const file of input.files) {
        const objectPath = `unregistered/${new Date().toISOString().slice(0, 10)}/children/${input.childId}/responses/${responseId}/${randomUUID()}.${extension(file.mimeType)}`;
        const { data, error: signedError } = await admin.storage.from(BUCKET).createSignedUploadUrl(objectPath, { upsert: false });
        if (signedError || !data) throw new Error('Could not prepare image upload.');
        prepared.push({ ...file, objectPath, token: data.token });
      }
      await db.observationUpload.create({ data: { id: responseId, childId: input.childId, milestoneId: input.milestoneId, userId: user.id, status: input.status, note, files: prepared.map(({ objectPath, mimeType, sizeBytes }) => ({ objectPath, mimeType, sizeBytes })), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
      return { ok: true as const, responseId, endpoint: endpoint ?? '', uploads: prepared };
    } catch (innerError) {
      await removeObjects(prepared.map((file) => file.objectPath));
      throw innerError;
    }
  } catch (innerError) {
    const correlationId = newCorrelationId();
    logServerError(correlationId, innerError);
    return { ok: false as const, error: 'Could not prepare the observation.', correlationId };
  }
}

export async function finalizeObservation(input: { childId: string; responseId: string }) {
  try {
    const { user } = await requireChildAccess(input.childId, 'write');
    const existing = await db.milestoneResponse.findFirst({ where: { id: input.responseId, childId: input.childId }, select: { id: true } });
    if (existing) return { ok: true as const, responseId: existing.id };
    const draft = await db.observationUpload.findFirst({ where: { id: input.responseId, childId: input.childId, userId: user.id, expiresAt: { gt: new Date() } } });
    if (!draft || (Array.isArray(draft.files) && (draft.files as unknown[]).length > 0 && !hasSupabaseAdminConfig())) return error('Observation upload is no longer available.');
    const files = Array.isArray(draft.files) ? draft.files as Array<{ objectPath: string; mimeType: string; sizeBytes: number }> : [];
    const admin = files.length ? createAdminClient() : null;
    try {
      for (const file of files) {
        if (!file.objectPath.startsWith(`unregistered/`) || !TYPES.has(file.mimeType) || file.sizeBytes > MAX_BYTES) throw new Error('Invalid image upload.');
        const { data, error: infoError } = await admin!.storage.from(BUCKET).info(file.objectPath);
        if (infoError || !data || data.size !== file.sizeBytes || data.contentType !== file.mimeType) throw new Error('Stored image verification failed.');
      }
      const response = await db.$transaction(async (tx) => {
        const created = await tx.milestoneResponse.create({ data: { id: draft.id, childId: draft.childId, milestoneId: draft.milestoneId, userId: draft.userId, status: draft.status, note: draft.note, media: files.length ? { create: files.map((file) => ({ objectPath: file.objectPath, mimeType: file.mimeType, sizeBytes: file.sizeBytes })) } : undefined } });
        await tx.observationUpload.delete({ where: { id: draft.id } });
        return created;
      });
      revalidatePath(`/child/${input.childId}/checklist`);
      revalidatePath(`/child/${input.childId}/timeline`);
      revalidatePath('/dashboard');
      await sendCaregiverObservationPush(response.childId, user.id).catch(() => undefined);
      return { ok: true as const, responseId: response.id };
    } catch (innerError) {
      if ((innerError as { code?: string }).code === 'P2002') {
        const concurrent = await db.milestoneResponse.findFirst({ where: { id: draft.id, childId: input.childId }, select: { id: true } });
        if (concurrent) return { ok: true as const, responseId: concurrent.id };
      }
      await removeObjects(files.map((file) => file.objectPath));
      await db.observationUpload.deleteMany({ where: { id: draft.id } });
      throw innerError;
    }
  } catch (innerError) {
    const correlationId = newCorrelationId();
    logServerError(correlationId, innerError);
    return { ok: false as const, error: 'Observation could not be finalized. Please try again.', correlationId };
  }
}

export async function abandonObservationUpload(input: { childId: string; responseId: string }) {
  try {
    const { user } = await requireChildAccess(input.childId, 'write');
    const draft = await db.observationUpload.findFirst({ where: { id: input.responseId, childId: input.childId, userId: user.id }, select: { id: true, files: true } });
    if (!draft) return { ok: true as const };
    const files = Array.isArray(draft.files) ? draft.files as Array<{ objectPath: string }> : [];
    await removeObjects(files.map((file) => file.objectPath));
    await db.observationUpload.delete({ where: { id: draft.id } });
    return { ok: true as const };
  } catch { return error('Upload cleanup failed.'); }
}

async function canManage(responseId: string) {
  const response = await db.milestoneResponse.findUnique({ where: { id: responseId }, include: { child: { select: { userId: true } }, media: { select: { objectPath: true } } } });
  if (!response) throw new Error('Observation not found.');
  const access = await requireChildAccess(response.childId, 'write');
  if (access.relationship !== 'owner' && response.userId !== access.user.id) throw new Error('You cannot manage this observation.');
  return { response, access };
}

export async function editObservation(input: { responseId: string; status: MilestoneStatus; note?: string }) {
  if (!STATUSES.has(input.status)) return error('Choose Yes, Almost, or Not Yet.');
  const note = input.note?.trim() || null;
  if (note && note.length > 2_000) return error('Keep observations under 2,000 characters.');
  try { const { response } = await canManage(input.responseId); await db.milestoneResponse.update({ where: { id: response.id }, data: { status: input.status, note } }); revalidatePath(`/child/${response.childId}/timeline`); return { ok: true as const }; } catch { return error('Observation could not be edited.'); }
}

export async function deleteObservation(responseId: string) {
  try { const { response } = await canManage(responseId); const paths = response.media.map((file) => file.objectPath); await removeObjects(paths); await db.milestoneResponse.delete({ where: { id: response.id } }); revalidatePath(`/child/${response.childId}/timeline`); revalidatePath(`/child/${response.childId}/checklist`); return { ok: true as const }; } catch { return error('Observation could not be deleted.'); }
}

export async function deleteObservationMedia(mediaId: string) {
  try { const media = await db.milestoneResponseMedia.findUnique({ where: { id: mediaId }, include: { response: true } }); if (!media) return error('Photo not found.'); await canManage(media.responseId); await removeObjects([media.objectPath]); await db.milestoneResponseMedia.delete({ where: { id: media.id } }); revalidatePath(`/child/${media.response.childId}/timeline`); return { ok: true as const }; } catch { return error('Photo could not be removed.'); }
}

export async function purgeExpiredObservationUploads(now = new Date()) {
  const drafts = await db.observationUpload.findMany({ where: { expiresAt: { lt: now } }, select: { id: true, files: true } });
  let purged = 0;
  for (const draft of drafts) { const files = Array.isArray(draft.files) ? draft.files as Array<{ objectPath: string }> : []; await removeObjects(files.map((file) => file.objectPath)); await db.observationUpload.deleteMany({ where: { id: draft.id } }); purged += 1; }
  if (!hasSupabaseAdminConfig()) return purged;
  const registered = new Set((await db.milestoneResponseMedia.findMany({ where: { objectPath: { startsWith: 'unregistered/' } }, select: { objectPath: true } })).map((item) => item.objectPath));
  const admin = createAdminClient();
  const stale: string[] = [];
  async function walk(prefix: string, depth: number) {
    if (depth > 8) return;
    const { data, error: listError } = await admin.storage.from(BUCKET).list(prefix, { limit: 1000, offset: 0 });
    if (listError || !data) return;
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) { if (!registered.has(path) && item.created_at && new Date(item.created_at).getTime() < now.getTime() - 24 * 60 * 60 * 1000) stale.push(path); }
      else await walk(path, depth + 1);
    }
  }
  await walk('unregistered', 0);
  if (stale.length) await removeObjects(stale);
  return purged + stale.length;
}
