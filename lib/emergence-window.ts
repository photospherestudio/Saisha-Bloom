import { db } from '@/lib/db';

export type EmergenceWindow = { minMonths: number; maxMonths: number; source: string; sourceUrl: string; reviewedAt: string };

export async function getEmergenceWindow(milestoneId: string): Promise<EmergenceWindow | null> {
  const window = await db.milestoneEmergenceWindow.findUnique({ where: { milestoneId } });
  if (!window || !Number.isFinite(window.minMonths) || !Number.isFinite(window.maxMonths) || window.minMonths < 0 || window.maxMonths < window.minMonths || !window.source.trim() || !window.sourceUrl.trim()) return null;
  return { minMonths: window.minMonths, maxMonths: window.maxMonths, source: window.source, sourceUrl: window.sourceUrl, reviewedAt: window.reviewedAt.toISOString() };
}
