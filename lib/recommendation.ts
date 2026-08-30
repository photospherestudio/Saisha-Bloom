import type { Guidance, Milestone, MilestoneStatus } from './types';
import { activityFor } from './activity-bank';

export type Recommendation = {
  tone: 'celebrate' | 'encourage' | 'reassure' | 'mention';
  heading: string;
  activityText: string;
  tipText: string;
};

export function getRecommendation(
  milestone: Pick<Milestone, 'title' | 'domain' | 'ageRangeMinMonths' | 'ageRangeMaxMonths'>,
  status: MilestoneStatus,
  childAgeInMonths: number,
  guidance: Guidance[] = [],
): Recommendation {
  const sourceActivity = guidance.find((item) => item.kind === 'activity' && (item.domain === milestone.domain || item.domain === 'all'));
  const activity = activityFor(milestone, childAgeInMonths) ?? (sourceActivity ? { activityText: sourceActivity.summary, tipText: 'Keep it light, stay close, and follow your child’s lead.' } : null);
  const careGuidance = guidance.find((item) => item.kind === 'care_seeking');
  const activityText = activity?.activityText ?? `Offer gentle, playful chances to explore ${milestone.title.toLowerCase()}.`;

  if (status === 'yes') {
    return {
      tone: 'celebrate',
      heading: 'A lovely step forward',
      activityText: activity ? `Keep it going: ${activityText}` : `Keep making room for ${milestone.title.toLowerCase()} through everyday play.`,
      tipText: activity?.tipText ?? 'Notice the little attempts too. They are part of the story.',
    };
  }

  if (status === 'almost') {
    return {
      tone: 'encourage',
      heading: 'Almost there is still progress',
      activityText: activity ? `Try this: ${activityText}` : `Try a few minutes of playful practice with ${milestone.title.toLowerCase()}.`,
      tipText: activity?.tipText ?? 'Follow your child’s interest and pause when they need a break.',
    };
  }

  const pastWindow = childAgeInMonths > milestone.ageRangeMaxMonths;
  return {
    tone: pastWindow ? 'mention' : 'reassure',
    heading: pastWindow ? 'Worth mentioning at your next visit' : 'There is time to grow into this',
    activityText,
    tipText: pastWindow
      ? activity?.tipText ?? careGuidance?.summary ?? 'Bring it up with your child’s pediatrician at the next visit for personal guidance.'
      : activity?.tipText ?? `Many children reach this across a window of about ${milestone.ageRangeMinMonths.toFixed(0)}–${milestone.ageRangeMaxMonths.toFixed(0)} months.`,
  };
}
