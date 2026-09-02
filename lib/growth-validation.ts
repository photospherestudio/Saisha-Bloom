export const GROWTH_BOUNDS = {
  heightCm: [30, 140],
  weightKg: [1, 45],
} as const;

export function validateGrowthMetrics(heightText = '', weightText = ''): string | null {
  const heightCm = heightText.trim() ? Number(heightText) : null;
  const weightKg = weightText.trim() ? Number(weightText) : null;
  if (heightCm === null && weightKg === null) return 'Add height, weight, or both.';
  if (heightCm !== null && (!Number.isFinite(heightCm) || heightCm < GROWTH_BOUNDS.heightCm[0] || heightCm > GROWTH_BOUNDS.heightCm[1])) return `Height must be between ${GROWTH_BOUNDS.heightCm[0]} and ${GROWTH_BOUNDS.heightCm[1]} cm.`;
  if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg < GROWTH_BOUNDS.weightKg[0] || weightKg > GROWTH_BOUNDS.weightKg[1])) return `Weight must be between ${GROWTH_BOUNDS.weightKg[0]} and ${GROWTH_BOUNDS.weightKg[1]} kg.`;
  return null;
}
