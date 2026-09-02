'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireChildAccess, requireChildOwner } from '@/lib/queries';
import { validateGrowthMetrics } from '@/lib/growth-validation';

export type GrowthPoint = { id: string; measuredAt: string; heightCm: number | null; weightKg: number | null };

export async function getGrowthMeasurements(childId: string): Promise<GrowthPoint[]> {
  if (childId === 'demo') return [];
  await requireChildAccess(childId);
  const measurements = await db.growthMeasurement.findMany({ where: { childId }, orderBy: [{ measuredAt: 'asc' }, { createdAt: 'asc' }] });
  return measurements.map((measurement) => ({ id: measurement.id, measuredAt: measurement.measuredAt.toISOString(), heightCm: measurement.heightCm, weightKg: measurement.weightKg }));
}

export async function addGrowthMeasurement(input: { childId: string; measuredAt: string; heightCm?: string; weightKg?: string }) {
  const heightText = input.heightCm?.trim() ?? '';
  const weightText = input.weightKg?.trim() ?? '';
  const heightCm = heightText ? Number(heightText) : null;
  const weightKg = weightText ? Number(weightText) : null;
  const measuredAt = new Date(`${input.measuredAt}T12:00:00.000Z`);
  if (!input.measuredAt || Number.isNaN(measuredAt.getTime())) return { ok: false as const, error: 'Choose the date you measured.' };
  const metricError = validateGrowthMetrics(heightText, weightText);
  if (metricError) return { ok: false as const, error: metricError };
  try {
    const { child } = await requireChildOwner(input.childId);
    const latestAllowed = new Date();
    latestAllowed.setUTCHours(23, 59, 59, 999);
    if (measuredAt < new Date(`${child.dob.toISOString().slice(0, 10)}T00:00:00.000Z`) || measuredAt > latestAllowed) return { ok: false as const, error: 'Use a date between the birth date and today.' };
    await db.growthMeasurement.create({ data: { childId: child.id, measuredAt, heightCm, weightKg } });
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard?childId=${child.id}`);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: 'Only the child-profile owner can add growth entries.' };
  }
}

export async function deleteGrowthMeasurement(measurementId: string) {
  try {
    const measurement = await db.growthMeasurement.findUnique({ where: { id: measurementId }, select: { id: true, childId: true } });
    if (!measurement) return { ok: true as const };
    await requireChildOwner(measurement.childId);
    await db.growthMeasurement.delete({ where: { id: measurement.id } });
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard?childId=${measurement.childId}`);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: 'Only the child-profile owner can delete growth entries.' };
  }
}
