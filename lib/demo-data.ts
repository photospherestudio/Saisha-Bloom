import cdcData from '@/prisma/seed-data/cdc-milestones-raw.json';
import guidanceData from '@/prisma/seed-data/guidance.json';
import type { ChildGender, ChildWithMilestones, Guidance, Milestone } from './types';

export const AGE_BANDS = [2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48] as const;
export const MONTHS_FROM_YEAR = Array.from({ length: 37 }, (_, index) => index + 12);

export const DOMAIN_LABELS = {
  movement_physical: 'Motor',
  cognitive: 'Cognitive',
  language_communication: 'Language',
  social_emotional: 'Social-emotional',
} as const;

const cdcMilestones: Milestone[] = cdcData
  .filter((item) => item.ageMonths <= 48)
  .map((item, index) => ({
    id: `cdc-${index + 1}`,
    title: item.text,
    domain: item.domain.startsWith('Movement')
      ? 'movement_physical'
      : item.domain.startsWith('Language')
        ? 'language_communication'
        : item.domain.startsWith('Social')
          ? 'social_emotional'
          : 'cognitive',
    ageRangeMinMonths: item.ageMonths,
    ageRangeMaxMonths: item.ageMonths,
    source: item.source,
    sourceUrl: item.sourceUrl,
    response: null,
  }));

export const demoMilestones: Milestone[] = cdcMilestones.sort((a, b) => a.ageRangeMinMonths - b.ageRangeMinMonths);
export const demoGuidance = guidanceData as Guidance[];

export const demoChild: ChildWithMilestones = {
  id: 'demo',
  name: 'your little one',
  gender: 'girl',
  dob: new Date(Date.now() - 18 * 30.4375 * 24 * 60 * 60 * 1000).toISOString(),
  milestones: demoMilestones,
  guidance: demoGuidance,
};

export function milestoneTitleForGender(title: string, gender?: ChildGender | null) {
  if (!gender) return title;
  const target = gender === 'girl'
    ? { he: 'she', him: 'her', his: 'her', himself: 'herself' }
    : { he: 'he', him: 'him', his: 'his', himself: 'himself' };
  return title.replace(/\b(himself|herself|he|she|him|her|his|hers)\b/gi, (word) => {
    const replacement = word.toLowerCase() === 'herself' || word.toLowerCase() === 'himself'
      ? target.himself
      : ['he', 'she'].includes(word.toLowerCase())
        ? target.he
        : ['him', 'her'].includes(word.toLowerCase())
          ? target.him
          : target.his;
    return /^[A-Z]/.test(word) ? replacement[0].toUpperCase() + replacement.slice(1) : replacement;
  });
}

export function milestoneAgeLabel(minMonths: number, maxMonths: number) {
  const format = (months: number) => months >= 12 && months % 12 === 0
    ? `${months / 12} year${months === 12 ? '' : 's'}`
    : `${months} month${months === 1 ? '' : 's'}`;
  return minMonths === maxMonths ? `Around ${format(Math.round(minMonths))}` : `${format(Math.round(minMonths))}–${format(Math.round(maxMonths))}`;
}

export function childAgeInMonths(dob: string) {
  return Math.max(0, (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.4375));
}

export function currentAgeBand(age: number) {
  if (age >= 12) return Math.min(48, Math.max(12, Math.round(age)));
  return AGE_BANDS.find((band) => age <= band) ?? AGE_BANDS[AGE_BANDS.length - 1];
}

export function sourceCheckpointForMonth(month: number) {
  const checkpoints = AGE_BANDS.filter((band) => band >= 12);
  return [...checkpoints].reverse().find((band) => band <= month) ?? 12;
}
