import { currentAgeBand, sourceCheckpointForMonth } from './demo-data';
import { getRecommendation, type Recommendation } from './recommendation';
import type { Guidance, Milestone, MilestoneStatus } from './types';

export type WeeklyFeedItem = {
  milestone: Milestone;
  status: MilestoneStatus;
  recommendation: Recommendation;
  reason: string;
};

export function buildWeeklyFeed(
  milestones: Milestone[],
  childAgeInMonths: number,
  statuses: Record<string, MilestoneStatus> = {},
  guidance: Guidance[] = [],
): WeeklyFeedItem[] {
  const selectedMonth = currentAgeBand(childAgeInMonths);
  const ageBand = selectedMonth >= 12 ? sourceCheckpointForMonth(selectedMonth) : selectedMonth;
  const current = milestones.filter((item) => item.ageRangeMinMonths === ageBand);
  const fallback = current.length ? current : milestones;

  return fallback
    .map((milestone) => {
      const status = statuses[milestone.id] ?? milestone.response?.status;
      const effectiveStatus = status ?? 'not_yet';
      const reason = status === 'almost'
        ? 'Keep exploring this one'
        : status === 'not_yet'
          ? 'A gentle next step'
          : status === 'yes'
            ? 'A moment worth celebrating'
            : 'A guidepost for this age';
      return {
        milestone,
        status: effectiveStatus,
        recommendation: getRecommendation(milestone, effectiveStatus, childAgeInMonths, guidance),
        reason,
        priority: status === 'almost' ? 0 : status === 'not_yet' ? 1 : status ? 2 : 3,
      };
    })
    .sort((a, b) => a.priority - b.priority || a.milestone.title.localeCompare(b.milestone.title))
    .slice(0, 5)
    .map(({ priority: _priority, ...item }) => item);
}
