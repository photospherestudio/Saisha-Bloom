import { childAge } from '@/lib/age';
import type { AccessibleChild, ChildWithMilestones, ObservationMedia, TimelineObservation, MilestoneStatus } from '@/lib/types';

export type ChildSummary = Pick<AccessibleChild, 'id' | 'name' | 'dob'>;
export type ObservationEvent = Omit<TimelineObservation, 'milestone'> & { milestoneId: string };
export type FamilyChild = ChildWithMilestones;
export type { ObservationMedia };

export function asFamilyChild(child: ChildWithMilestones) {
  return child as FamilyChild;
}

export function ageDisplay(child: FamilyChild) {
  const age = child.age ?? childAge(child.dob, child.gestationalWeeks);
  return {
    chronological: age.chronologicalAgeInMonths,
    corrected: age.activeAgeInMonths,
    adjusted: age.usesCorrectedAge,
  };
}

export function observationEventsFor(child: FamilyChild): ObservationEvent[] {
  if (child.observations) return child.observations.map((item) => ({ ...item, milestoneId: item.milestone.id }));
  return child.milestones.flatMap((milestone) => milestone.response
    ? [{ milestoneId: milestone.id, status: milestone.response.status, createdAt: milestone.response.createdAt, note: milestone.response.note, author: milestone.response.author, media: milestone.response.media ?? [], id: milestone.response.id ?? '', milestone: { id: milestone.id, title: milestone.title, domain: milestone.domain, source: milestone.source, sourceUrl: milestone.sourceUrl } }]
    : []);
}

export type ReminderPreference = { enabled: boolean; email?: string | null };

export function statusLabel(status: MilestoneStatus) {
  return status === 'yes' ? 'Noticed' : status === 'almost' ? 'Almost' : 'Not yet';
}
