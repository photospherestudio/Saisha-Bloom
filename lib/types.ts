export type MilestoneStatus = 'yes' | 'almost' | 'not_yet';
export type ChildGender = 'boy' | 'girl';
export type Guidance = {
  id: string;
  externalId: string;
  title: string;
  summary: string;
  domain: string;
  ageRangeMinMonths: number;
  ageRangeMaxMonths: number;
  kind: 'activity' | 'evidence' | 'care_seeking';
  sourceKey: string;
  sourceName: string;
  sourceUrl: string;
  reviewedAt: string;
};

export type Milestone = {
  id: string;
  title: string;
  domain: string;
  ageRangeMinMonths: number;
  ageRangeMaxMonths: number;
  source: string;
  sourceUrl: string;
  response?: { status: MilestoneStatus; createdAt: string } | null;
};

export type ChildWithMilestones = {
  id: string;
  name: string;
  dob: string;
  gender?: ChildGender | null;
  heightCm?: number | null;
  weightKg?: number | null;
  milestones: Milestone[];
  guidance?: Guidance[];
  weeklyProgress?: { total: number; yes: number; almost: number; notYet: number };
};
