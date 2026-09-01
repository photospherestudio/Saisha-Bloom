import { db } from './db';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { POLICY_VERSION } from './policy-content';
import { getCurrentAppUser, hasSupabaseConfig } from './auth';
import { childAge, cdcCheckpointForAge } from './age';
import { demoChild, demoMilestones } from './demo-data';
import { createAdminClient, hasSupabaseAdminConfig } from './supabase/admin';
import { startOfWeekInTimeZone, summarizeWeeklyProgress } from './weekly-progress';
import type { AccessibleChild, ChildWithMilestones, Guidance, Milestone, MilestoneStatus, ObservationMedia, TimelineObservation } from './types';

export class ChildAccessError extends Error {
  constructor() {
    super('Child profile not found.');
  }
}

type MediaRecord = { id: string; objectPath: string; mimeType: string; sizeBytes: number; createdAt: Date };

async function signedMedia(media: MediaRecord[]): Promise<ObservationMedia[]> {
  if (!media.length || !hasSupabaseAdminConfig()) return media.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), signedUrl: null }));
  const admin = createAdminClient();
  return Promise.all(media.map(async (item) => {
    const { data } = await admin.storage.from(process.env.SUPABASE_IMAGE_BUCKET ?? 'milestone-memories').createSignedUrl(item.objectPath, 3600);
    return { ...item, createdAt: item.createdAt.toISOString(), signedUrl: data?.signedUrl ?? null };
  }));
}

function toMilestone(item: {
  id: string; title: string; domain: string; ageRangeMinMonths: number; ageRangeMaxMonths: number; source: string; sourceUrl: string;
  responses: { id: string; status: string; note: string | null; createdAt: Date; author: { id: string; email: string; displayName: string | null } | null; media: MediaRecord[] }[];
}): Milestone {
  const response = item.responses[0];
  return {
    id: item.id, title: item.title, domain: item.domain, ageRangeMinMonths: item.ageRangeMinMonths, ageRangeMaxMonths: item.ageRangeMaxMonths, source: item.source, sourceUrl: item.sourceUrl,
    response: response ? { id: response.id, status: response.status as MilestoneStatus, note: response.note, createdAt: response.createdAt.toISOString(), author: response.author ? { id: response.author.id, email: response.author.email, name: response.author.displayName } : null, media: response.media.map((media) => ({ ...media, createdAt: media.createdAt.toISOString(), signedUrl: null })) } : null,
  };
}

function toGuidance(item: { id: string; externalId: string; title: string; summary: string; domain: string; ageRangeMinMonths: number; ageRangeMaxMonths: number; kind: string; sourceKey: string; sourceName: string; sourceUrl: string; reviewedAt: Date }): Guidance {
  return { ...item, kind: item.kind as Guidance['kind'], reviewedAt: item.reviewedAt.toISOString() };
}

const currentPolicyDocuments = cache(async (userId: string) => db.policyAcceptance.findMany({ where: { userId, version: POLICY_VERSION, document: { in: ['terms', 'privacy'] } }, select: { document: true } }));

export const listAccessibleChildren = cache(async function listAccessibleChildren(): Promise<AccessibleChild[]> {
  const user = await getCurrentAppUser();
  if (!user) return [];
  const children = await db.child.findMany({
    where: { OR: [{ userId: user.id }, { members: { some: { userId: user.id, role: 'editor' } } }] },
    select: { id: true, name: true, dob: true, gender: true, userId: true },
    orderBy: [{ createdAt: 'asc' }],
  });
  return children.map((child) => ({ id: child.id, name: child.name, dob: child.dob.toISOString(), gender: child.gender as AccessibleChild['gender'], relationship: child.userId === user.id ? 'owner' : 'editor' }));
});

export const requireChildAccess = cache(async function requireChildAccess(childId: string, _access: 'read' | 'write' = 'read') {
  const user = await getCurrentAppUser();
  if (!user) throw new ChildAccessError();
  if (user.deletionRequestedAt) throw new ChildAccessError();
  const [accepted, child] = await Promise.all([
    currentPolicyDocuments(user.id),
    db.child.findFirst({ where: { id: childId, OR: [{ userId: user.id }, { members: { some: { userId: user.id, role: 'editor' } } }] } }),
  ]);
  if (new Set(accepted.map((item) => item.document)).size < 2) throw new ChildAccessError();
  if (!child) throw new ChildAccessError();
  return { child, user, relationship: child.userId === user.id ? 'owner' as const : 'editor' as const };
});

export async function requireChildOwner(childId: string) {
  const access = await requireChildAccess(childId, 'write');
  if (access.relationship !== 'owner') throw new ChildAccessError();
  return access;
}

export async function getChild(id?: string): Promise<ChildWithMilestones | null> {
  if (id === 'demo') return demoChild;
  if (!hasSupabaseConfig() && !id) return null;

  const user = await getCurrentAppUser();
  if (!user) {
    return null;
  }
  const policyVersion = POLICY_VERSION;
  const [currentPolicies, selectableChildren] = await Promise.all([currentPolicyDocuments(user.id), id ? Promise.resolve(null) : listAccessibleChildren()]);
  if (new Set(currentPolicies.map((item) => item.document)).size < 2) redirect('/consent');
  const activeChildId = id ?? selectableChildren?.[0]?.id;
  if (!activeChildId) return null;
  let access;
  try {
    access = await requireChildAccess(activeChildId);
  } catch (error) {
    if (error instanceof ChildAccessError) return null;
    throw error;
  }
  const { child } = access;
  if (child.userId === user.id && (child.guardianNoticeVersion !== policyVersion || !child.guardianAttestedAt)) redirect('/consent');
  const age = childAge(child.dob, child.gestationalWeeks);
  const guidanceAge = Math.min(48, Math.max(0, Math.round(age.activeAgeInMonths)));
  const [milestones, guidance, weeklyResponses, accessibleChildren, reminderPreference, family, growthMeasurements] = await Promise.all([
    db.milestone.findMany({ where: { source: 'CDC Learn the Signs. Act Early.', domain: { in: ['social_emotional', 'language_communication', 'cognitive', 'movement_physical'] }, ageRangeMinMonths: { lte: 48 }, ageRangeMaxMonths: { gte: 2 } }, orderBy: [{ ageRangeMinMonths: 'asc' }, { title: 'asc' }], include: { responses: { where: { childId: child.id }, orderBy: { createdAt: 'desc' }, take: 1, include: { author: { select: { id: true, email: true, displayName: true } }, media: { orderBy: { createdAt: 'asc' } } } } } }),
    db.guidance.findMany({ where: { ageRangeMinMonths: { lte: guidanceAge }, ageRangeMaxMonths: { gte: guidanceAge } }, orderBy: [{ kind: 'asc' }, { ageRangeMinMonths: 'asc' }, { externalId: 'asc' }] }),
    db.milestoneResponse.findMany({ where: { childId: child.id, createdAt: { gte: startOfWeekInTimeZone(new Date(), user.timezone ?? 'UTC') } }, select: { milestoneId: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
    listAccessibleChildren(),
    db.reminderPreference.findUnique({ where: { userId_childId: { userId: user.id, childId: child.id } }, select: { enabled: true, emailCheckpointEnabled: true, pushCheckpointEnabled: true, caregiverActivityEnabled: true, user: { select: { email: true } } } }),
    db.child.findUnique({ where: { id: child.id }, select: { members: { orderBy: { createdAt: 'asc' }, select: { id: true, createdAt: true, user: { select: { email: true } } } }, invites: { where: { acceptedAt: null, revokedAt: null }, orderBy: { createdAt: 'desc' }, select: { id: true, email: true, expiresAt: true } } } }),
    db.growthMeasurement.findMany({ where: { childId: child.id }, orderBy: { measuredAt: 'asc' }, select: { id: true, measuredAt: true, heightCm: true, weightKg: true, createdAt: true } }),
  ]);
  return { id: child.id, name: child.name, dob: child.dob.toISOString(), gender: child.gender as ChildWithMilestones['gender'], gestationalWeeks: child.gestationalWeeks, heightCm: child.heightCm, weightKg: child.weightKg, growthMeasurements: growthMeasurements.map((item) => ({ ...item, measuredAt: item.measuredAt.toISOString(), createdAt: item.createdAt.toISOString() })), age, milestones: milestones.map(toMilestone), guidance: guidance.map(toGuidance), weeklyProgress: summarizeWeeklyProgress(weeklyResponses), accessibleChildren, reminderPreference: reminderPreference ? { enabled: reminderPreference.enabled, email: reminderPreference.user.email, emailCheckpointEnabled: reminderPreference.emailCheckpointEnabled, pushCheckpointEnabled: reminderPreference.pushCheckpointEnabled, caregiverActivityEnabled: reminderPreference.caregiverActivityEnabled } : null, relationship: child.userId === user.id ? 'owner' : 'editor', familyMembers: family?.members.map((member) => ({ id: member.id, email: member.user.email, createdAt: member.createdAt.toISOString() })) ?? [], pendingInvites: family?.invites.map((invite) => ({ id: invite.id, email: invite.email, expiresAt: invite.expiresAt.toISOString() })) ?? [] };
}

export async function getTimelineObservations(childId: string): Promise<TimelineObservation[]> {
  if (childId === 'demo') return [];
  const access = await requireChildAccess(childId);
  const responses = await db.milestoneResponse.findMany({
    where: { childId }, orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, email: true, displayName: true } }, milestone: { select: { id: true, title: true, domain: true, source: true, sourceUrl: true } }, media: { orderBy: { createdAt: 'asc' } } },
  });
  return Promise.all(responses.map(async (item) => ({
    id: item.id, status: item.status as MilestoneStatus, note: item.note, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(), author: item.author ? { id: item.author.id, email: item.author.email, name: item.author.displayName } : null, milestone: item.milestone, media: await signedMedia(item.media), canManage: access.relationship === 'owner' || item.userId === access.user.id, anonymous: item.userId === null,
  })));
}

export function progressFor(child: ChildWithMilestones) {
  const answered = child.milestones.filter((item) => item.response).length;
  const yes = child.milestones.filter((item) => item.response?.status === 'yes').length;
  return { answered, yes, total: child.milestones.length };
}

export function milestonesForDemoWithResponses(statuses: Record<string, MilestoneStatus>) {
  return demoMilestones.map((item) => ({ ...item, response: statuses[item.id] ? { status: statuses[item.id], createdAt: new Date().toISOString() } : null }));
}

export { cdcCheckpointForAge };
