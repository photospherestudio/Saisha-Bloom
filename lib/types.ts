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
  response?: Observation | null;
};

export type ObservationMedia = {
  id: string;
  objectPath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  signedUrl?: string | null;
};

export type Observation = {
  id?: string;
  status: MilestoneStatus;
  createdAt: string;
  note?: string | null;
  author?: { id: string; email: string; name?: string | null } | null;
  media?: ObservationMedia[];
};

export type TimelineObservation = Observation & {
  id: string;
  milestone: Pick<Milestone, 'id' | 'title' | 'domain' | 'source' | 'sourceUrl'>;
};

export type AccessibleChild = {
  id: string;
  name: string;
  dob: string;
  gender?: ChildGender | null;
  relationship: 'owner' | 'editor';
};

export type FamilyMember = { id: string; email: string; createdAt: string };
export type PendingInvite = { id: string; email: string; expiresAt: string };

export type ChildWithMilestones = {
  id: string;
  name: string;
  dob: string;
  gender?: ChildGender | null;
  gestationalWeeks?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  age?: {
    chronologicalAgeInMonths: number;
    correctedAgeInMonths: number;
    activeAgeInMonths: number;
    usesCorrectedAge: boolean;
  };
  milestones: Milestone[];
  guidance?: Guidance[];
  weeklyProgress?: { total: number; yes: number; almost: number; notYet: number };
  observations?: TimelineObservation[];
  accessibleChildren?: AccessibleChild[];
  reminderPreference?: { enabled: boolean; email?: string | null } | null;
  relationship?: AccessibleChild['relationship'];
  familyMembers?: FamilyMember[];
  pendingInvites?: PendingInvite[];
};
