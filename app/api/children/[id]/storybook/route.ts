import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import sharp from 'sharp';
import { getCurrentAppUser, hasSupabaseConfig } from '@/lib/auth';
import { db } from '@/lib/db';
import { createAdminClient, hasSupabaseAdminConfig } from '@/lib/supabase/admin';
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/reminders';
import { jsonError } from '@/lib/http';
import { reviewedMilestoneTitle } from '@/lib/milestone-copy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sameOrigin(request: Request) { const origin = request.headers.get('origin'); if (origin) return origin === siteUrl(); const referer = request.headers.get('referer'); if (!referer) return false; try { return new URL(referer).origin === siteUrl(); } catch { return false; } }

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return jsonError('Invalid request origin.', 403);
  if (!hasSupabaseConfig() || !hasSupabaseAdminConfig()) return jsonError('Storybook is not configured.', 503);
  const { id } = await params;
  const body = await request.json().catch(() => ({})) as { password?: string; observationIds?: string[] };
  if (!body.password) return jsonError('Current password is required.', 400);
  const user = await getCurrentAppUser();
  if (!user) return jsonError('Sign in first.', 401);
  if (user.deletionRequestedAt) return jsonError('This account is being deleted.', 403);
  const supabase = await createServerSupabaseClient();
  const reauth = await supabase.auth.signInWithPassword({ email: user.email, password: body.password });
  if (reauth.error) return jsonError('Current password could not be confirmed.', 403);
  const child = await db.child.findFirst({ where: { id, userId: user.id }, include: { responses: { where: { createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }, ...(body.observationIds?.length ? { id: { in: body.observationIds.slice(0, 24) } } : {}) }, orderBy: { createdAt: 'asc' }, take: 24, include: { milestone: { select: { title: true } }, media: { orderBy: { createdAt: 'asc' }, take: 3 } } } } });
  if (!child) return jsonError('Child profile not found.', 404);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const admin = createAdminClient();
  const bucket = process.env.SUPABASE_IMAGE_BUCKET ?? 'milestone-memories';
  let page = pdf.addPage([612, 792]);
  let y = 740;
  page.drawText(`${child.name}'s Milestone Storybook`, { x: 48, y, size: 25, font: bold, color: rgb(0.12, 0.2, 0.24) });
  y -= 34;
  page.drawText('A family memory artifact · guideposts, not deadlines', { x: 48, y, size: 11, font, color: rgb(0.28, 0.35, 0.4) });
  y -= 28;
  for (const response of child.responses) {
    if (y < 180) { page = pdf.addPage([612, 792]); y = 740; }
    page.drawText(`${response.createdAt.toLocaleDateString()} · ${reviewedMilestoneTitle(response.milestone.title)}`, { x: 48, y, size: 13, font: bold, color: rgb(0.16, 0.24, 0.28) });
    y -= 18;
    page.drawText(`Status: ${response.status === 'not_yet' ? 'Not yet' : response.status === 'almost' ? 'Almost' : 'Yes'}`, { x: 48, y, size: 10, font, color: rgb(0.3, 0.38, 0.42) });
    y -= 16;
    if (response.note) { const lines = response.note.match(/.{1,90}(?:\s|$)/g) ?? [response.note]; for (const line of lines.slice(0, 4)) { page.drawText(line.trim(), { x: 48, y, size: 10, font, color: rgb(0.18, 0.22, 0.25) }); y -= 14; } }
    let imageX = 48;
    for (const media of response.media) {
      const downloaded = await admin.storage.from(bucket).download(media.objectPath);
      if (!downloaded.data) { page.drawRectangle({ x: imageX, y: y - 82, width: 96, height: 72, color: rgb(0.92, 0.93, 0.93) }); page.drawText('Photo unavailable', { x: imageX + 8, y: y - 45, size: 8, font, color: rgb(0.35, 0.4, 0.4) }); imageX += 108; continue; }
      try { const normalized = await sharp(Buffer.from(await downloaded.data.arrayBuffer())).rotate().jpeg({ quality: 84 }).toBuffer(); const embedded = await pdf.embedJpg(normalized); const scale = Math.min(96 / embedded.width, 72 / embedded.height); page.drawImage(embedded, { x: imageX, y: y - embedded.height * scale, width: embedded.width * scale, height: embedded.height * scale }); }
      catch { page.drawRectangle({ x: imageX, y: y - 82, width: 96, height: 72, color: rgb(0.92, 0.93, 0.93) }); page.drawText('Photo unavailable', { x: imageX + 8, y: y - 45, size: 8, font, color: rgb(0.35, 0.4, 0.4) }); }
      imageX += 108;
    }
    y -= 94;
  }
  if (y < 100) { page = pdf.addPage([612, 792]); y = 740; }
  page.drawText('This keepsake is not a medical record or developmental diagnosis. Share questions with your child’s care team.', { x: 48, y: 60, size: 9, font, color: rgb(0.38, 0.42, 0.43) });
  const bytes = await pdf.save();
  const pdfBody = new Uint8Array(bytes).buffer as ArrayBuffer;
  return new Response(pdfBody, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${child.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-storybook.pdf"`, 'Cache-Control': 'private, no-store' } });
}
