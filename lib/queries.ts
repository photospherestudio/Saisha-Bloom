import { db } from './db';
import { getCurrentAppUser } from './auth';
import { childAgeInMonths, demoChild, demoMilestones } from './demo-data';
import { startOfWeek, summarizeWeeklyProgress } from './weekly-progress';
import type { ChildWithMilestones, Guidance, Milestone, MilestoneStatus } from './types';

function toMilestone(item: {
  id: string;
  title: string;
  domain: string;
  ageRangeMinMonths: number;
  ageRangeMaxMonths: number;
  source: string;
  sourceUrl: string;
  responses: { status: string; createdAt: Date }[];
}): Milestone {
  const response = item.responses[0];
  return {
    id: item.id,
    title: item.title,
    domain: item.domain,
    ageRangeMinMonths: item.ageRangeMinMonths,
    ageRangeMaxMonths: item.ageRangeMaxMonths,
    source: item.source,
    sourceUrl: item.sourceUrl,
    response: response ? { status: response.status as MilestoneStatus, createdAt: response.createdAt.toISOString() } : null,
  };
}

function toGuidance(item: {
  id: string;
  externalId: string;
  title: string;
  summary: string;
  domain: string;
  ageRangeMinMonths: number;
  ageRangeMaxMonths: number;
  kind: string;
  sourceKey: string;
  sourceName: string;
  sourceUrl: string;
  reviewedAt: Date;
}): Guidance {
  return { ...item, kind: item.kind as Guidance['kind'], reviewedAt: item.reviewedAt.toISOString() };
}

export async function getChild(id?: string): Promise<ChildWithMilestones> {
  if (id === 'demo') return demoChild;

  try {
    const user = await getCurrentAppUser();
    const activeChildId = id ?? (user ? (await db.child.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } }))?.id : undefined);
    const child = user && activeChildId
      ? await db.child.findFirst({ where: { id: activeChildId, userId: user.id } })
      : null;
    if (!child) return demoChild;

    const milestones = await db.milestone.findMany({
      where: {
        source: 'CDC Learn the Signs. Act Early.',
        domain: { in: ['social_emotional', 'language_communication', 'cognitive', 'movement_physical'] },
        ageRangeMinMonths: { lte: 48 },
        ageRangeMaxMonths: { gte: 2 },
      },
      orderBy: [{ ageRangeMinMonths: 'asc' }, { title: 'asc' }],
      include: { responses: { where: { childId: child.id }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    const guidanceAge = Math.min(48, Math.max(0, Math.round(childAgeInMonths(child.dob.toISOString()))));
    const guidance = await db.guidance.findMany({
      where: { ageRangeMinMonths: { lte: guidanceAge }, ageRangeMaxMonths: { gte: guidanceAge } },
      orderBy: [{ kind: 'asc' }, { ageRangeMinMonths: 'asc' }, { externalId: 'asc' }],
    });
    const weeklyResponses = await db.milestoneResponse.findMany({ where: { childId: child.id, createdAt: { gte: startOfWeek() } }, select: { status: true } });
    return { id: child.id, name: child.name, dob: child.dob.toISOString(), gender: child.gender as ChildWithMilestones['gender'], heightCm: child.heightCm, weightKg: child.weightKg, milestones: milestones.map(toMilestone), guidance: guidance.map(toGuidance), weeklyProgress: summarizeWeeklyProgress(weeklyResponses.map((item) => item.status)) };
  } catch {
    return demoChild;
  }
}

export function progressFor(child: ChildWithMilestones) {
  const answered = child.milestones.filter((item) => item.response).length;
  const yes = child.milestones.filter((item) => item.response?.status === 'yes').length;
  return { answered, yes, total: child.milestones.length };
}

export function milestonesForDemoWithResponses(statuses: Record<string, MilestoneStatus>) {
  return demoMilestones.map((item) => ({ ...item, response: statuses[item.id] ? { status: statuses[item.id], createdAt: new Date().toISOString() } : null }));
}
