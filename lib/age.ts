export const CDC_CHECKPOINTS = [2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48] as const;
const DAYS_PER_MONTH = 30.4375;

export function chronologicalAgeInMonths(dob: Date | string, now = new Date()) {
  const birthDate = new Date(dob).getTime();
  if (Number.isNaN(birthDate)) return 0;
  return Math.max(0, (now.getTime() - birthDate) / (1000 * 60 * 60 * 24 * DAYS_PER_MONTH));
}

/** Uses corrected age only before the child's second chronological birthday. */
export function correctedAgeInMonths(dob: Date | string, gestationalWeeks?: number | null, now = new Date()) {
  const chronological = chronologicalAgeInMonths(dob, now);
  if (!gestationalWeeks || gestationalWeeks >= 40 || chronological >= 24) return chronological;
  return Math.max(0, chronological - ((40 - gestationalWeeks) * 7) / DAYS_PER_MONTH);
}

export function childAge(dob: Date | string, gestationalWeeks?: number | null, now = new Date()) {
  const chronological = chronologicalAgeInMonths(dob, now);
  const corrected = correctedAgeInMonths(dob, gestationalWeeks, now);
  return {
    chronologicalAgeInMonths: chronological,
    correctedAgeInMonths: corrected,
    activeAgeInMonths: corrected,
    usesCorrectedAge: corrected !== chronological,
  };
}

export function cdcCheckpointForAge(ageInMonths: number) {
  const normalized = Math.max(0, ageInMonths);
  if (normalized < 12) return CDC_CHECKPOINTS.find((checkpoint) => normalized <= checkpoint) ?? 48;
  return [...CDC_CHECKPOINTS].reverse().find((checkpoint) => normalized >= checkpoint) ?? 12;
}

export function reminderCheckpointForAge(ageInMonths: number) {
  const normalized = Math.max(0, ageInMonths);
  return [...CDC_CHECKPOINTS].reverse().find((checkpoint) => normalized >= checkpoint) ?? null;
}
