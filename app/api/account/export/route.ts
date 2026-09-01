import * as archiverModule from 'archiver';
import { PassThrough, Readable } from 'node:stream';
import { getCurrentAppUser, hasSupabaseConfig } from '@/lib/auth';
import { db } from '@/lib/db';
import { createAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/reminders';
import { jsonError } from '@/lib/http';

const createArchive = ((archiverModule as unknown as { default?: unknown }).default ?? archiverModule) as (format: string, options?: object) => { pipe: (stream: NodeJS.WritableStream) => void; append: (data: string | Buffer, options: { name: string }) => void; finalize: () => Promise<void> };

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) return origin === siteUrl();
  const referer = request.headers.get('referer');
  if (!referer) return false;
  try { return new URL(referer).origin === siteUrl(); } catch { return false; }
}

function extension(mimeType: string) {
  return mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : mimeType === 'image/heic' ? 'heic' : 'jpg';
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError('Invalid request origin.', 403);
  if (!hasSupabaseConfig() || !hasSupabaseAdminConfig()) return jsonError('Export is not configured.', 503);
  const body = request.headers.get('content-type')?.includes('application/json')
    ? await request.json().catch(() => ({})) as { password?: string }
    : Object.fromEntries((await request.formData().catch(() => new FormData())).entries()) as { password?: string };
  if (!body.password) return jsonError('Current password is required.', 400);
  const user = await getCurrentAppUser();
  if (!user) return jsonError('Sign in first.', 401);
  if (user.deletionRequestedAt) return jsonError('This account is being deleted.', 403);
  const supabase = await createServerSupabaseClient();
  const reauth = await supabase.auth.signInWithPassword({ email: user.email, password: body.password });
  if (reauth.error) return jsonError('Current password could not be confirmed.', 403);

  const children = await db.child.findMany({ where: { OR: [{ userId: user.id }, { members: { some: { userId: user.id, role: 'editor' } } }] }, include: { responses: { where: { OR: [{ child: { userId: user.id } }, { userId: user.id }] }, orderBy: { createdAt: 'asc' }, include: { milestone: { select: { id: true, title: true, domain: true, source: true, sourceUrl: true } }, author: { select: { id: true, email: true, displayName: true } }, media: { orderBy: { createdAt: 'asc' } } } }, growthMeasurements: { orderBy: { measuredAt: 'asc' } } } });
  const ownerChildren = children.filter((child) => child.userId === user.id);
  const policies = await db.policyAcceptance.findMany({ where: { userId: user.id }, orderBy: { acceptedAt: 'asc' }, select: { document: true, version: true, acceptedAt: true } });
  const archive = createArchive('zip', { zlib: { level: 6 } });
  const output = new PassThrough();
  archive.pipe(output);
  const manifest = { exportVersion: '1.0', generatedAt: new Date().toISOString(), account: { id: user.id, email: user.email, displayName: user.displayName }, policies: policies.map((policy) => ({ ...policy, acceptedAt: policy.acceptedAt.toISOString() })), scope: ownerChildren.length === children.length ? 'owner' : 'editor', children: children.map((child) => ({ id: child.id, name: child.name, dob: child.dob.toISOString(), relationship: child.userId === user.id ? 'owner' : 'editor', measurements: child.userId === user.id ? child.growthMeasurements : [] })), observations: [] as unknown[] };
  const admin = createAdminClient();
  const bucket = process.env.SUPABASE_IMAGE_BUCKET ?? 'milestone-memories';
  for (const child of children) {
    for (const response of child.responses) {
      const observation = { id: response.id, childId: child.id, milestone: response.milestone, status: response.status, note: response.note, observedAt: response.createdAt.toISOString(), updatedAt: response.updatedAt.toISOString(), author: response.userId === user.id ? response.author : child.userId === user.id ? response.author : null, media: response.media.map((item) => ({ id: item.id, mimeType: item.mimeType, sizeBytes: item.sizeBytes, path: `children/${child.id}/observations/${response.id}/${item.id}.${extension(item.mimeType)}` })) };
      manifest.observations.push(observation);
      for (const item of response.media) {
        const downloaded = await admin.storage.from(bucket).download(item.objectPath);
        if (downloaded.error || !downloaded.data) continue;
        archive.append(Buffer.from(await downloaded.data.arrayBuffer()), { name: `children/${child.id}/observations/${response.id}/${item.id}.${extension(item.mimeType)}` });
      }
    }
  }
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
  void archive.finalize();
  const webStream = Readable.toWeb(output) as ReadableStream<Uint8Array>;
  return new Response(webStream, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="saisha-bloom-export.zip"', 'Cache-Control': 'private, no-store' } });
}
