-- Release 1-4 production roadmap. Application data remains server-only through
-- Prisma; new tables deliberately have RLS enabled with no Data API policies.

ALTER TABLE "User"
  ADD COLUMN "deletionRequestedAt" TIMESTAMP(3),
  ADD COLUMN "deletionErrorRef" TEXT,
  ADD COLUMN "deletionAttempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Child"
  ADD COLUMN "guardianAttestedAt" TIMESTAMP(3),
  ADD COLUMN "guardianNoticeVersion" TEXT,
  ADD COLUMN "guardianVerificationMethod" TEXT,
  ADD COLUMN "guardianVerificationRef" TEXT,
  ADD COLUMN "deletionRequestedAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Child" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "Child" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "MilestoneResponse" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "MilestoneResponse" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
ALTER TABLE "MilestoneResponse"
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ADD COLUMN "anonymizedAt" TIMESTAMP(3),
  ADD COLUMN "anonymizationBatchId" TEXT,
  ADD COLUMN "retentionExpiresAt" TIMESTAMP(3),
  ADD COLUMN "retainedAt" TIMESTAMP(3),
  ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "MilestoneResponse" DROP CONSTRAINT "MilestoneResponse_userId_fkey";
ALTER TABLE "MilestoneResponse"
  ADD CONSTRAINT "MilestoneResponse_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReminderPreference"
  ADD COLUMN "emailCheckpointEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "pushCheckpointEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "caregiverActivityEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "emailConsentAt" TIMESTAMP(3),
  ADD COLUMN "pushConsentAt" TIMESTAMP(3);
UPDATE "ReminderPreference"
SET "emailCheckpointEnabled" = "enabled",
    "emailConsentAt" = CASE WHEN "enabled" THEN "updatedAt" ELSE NULL END;

DROP INDEX "ReminderDelivery_userId_childId_checkpoint_key";
ALTER TABLE "ReminderDelivery" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'email';
CREATE UNIQUE INDEX "ReminderDelivery_userId_childId_checkpoint_channel_key"
  ON "ReminderDelivery"("userId", "childId", "checkpoint", "channel");
CREATE INDEX "ReminderDelivery_userId_idx" ON "ReminderDelivery"("userId");
CREATE INDEX "ReminderDelivery_childId_idx" ON "ReminderDelivery"("childId");

CREATE TABLE "PolicyAcceptance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "document" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PolicyAcceptance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PolicyAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PolicyAcceptance_userId_document_version_key" ON "PolicyAcceptance"("userId", "document", "version");
CREATE INDEX "PolicyAcceptance_userId_acceptedAt_idx" ON "PolicyAcceptance"("userId", "acceptedAt");

CREATE TABLE "GrowthMeasurement" (
  "id" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "measuredAt" TIMESTAMP(3) NOT NULL,
  "heightCm" DOUBLE PRECISION,
  "weightKg" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GrowthMeasurement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GrowthMeasurement_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "GrowthMeasurement_childId_measuredAt_idx" ON "GrowthMeasurement"("childId", "measuredAt");

CREATE TABLE "MilestoneEmergenceWindow" (
  "id" TEXT NOT NULL,
  "milestoneId" TEXT NOT NULL,
  "minMonths" DOUBLE PRECISION NOT NULL,
  "maxMonths" DOUBLE PRECISION NOT NULL,
  "source" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MilestoneEmergenceWindow_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MilestoneEmergenceWindow_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MilestoneEmergenceWindow_milestoneId_key" ON "MilestoneEmergenceWindow"("milestoneId");

CREATE TABLE "PushSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_updatedAt_idx" ON "PushSubscription"("userId", "updatedAt");

CREATE TABLE "ObservationUpload" (
  "id" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "milestoneId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "note" TEXT,
  "files" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ObservationUpload_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ObservationUpload_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ObservationUpload_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ObservationUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ObservationUpload_childId_idx" ON "ObservationUpload"("childId");
CREATE INDEX "ObservationUpload_milestoneId_idx" ON "ObservationUpload"("milestoneId");
CREATE INDEX "ObservationUpload_userId_idx" ON "ObservationUpload"("userId");
CREATE INDEX "ObservationUpload_expiresAt_idx" ON "ObservationUpload"("expiresAt");

ALTER TABLE "MilestoneResponse"
  ADD CONSTRAINT "MilestoneResponse_status_check" CHECK ("status" IN ('yes', 'almost', 'not_yet'));
ALTER TABLE "ObservationUpload"
  ADD CONSTRAINT "ObservationUpload_status_check" CHECK ("status" IN ('yes', 'almost', 'not_yet'));
ALTER TABLE "GrowthMeasurement"
  ADD CONSTRAINT "GrowthMeasurement_value_check" CHECK (
    ("heightCm" IS NOT NULL OR "weightKg" IS NOT NULL)
    AND ("heightCm" IS NULL OR ("heightCm" >= 30 AND "heightCm" <= 140))
    AND ("weightKg" IS NULL OR ("weightKg" >= 1 AND "weightKg" <= 45))
  );
ALTER TABLE "MilestoneEmergenceWindow"
  ADD CONSTRAINT "MilestoneEmergenceWindow_complete_check" CHECK (
    "minMonths" >= 0 AND "maxMonths" >= "minMonths"
    AND length(btrim("source")) > 0
    AND "sourceUrl" ~ '^https://'
  );
ALTER TABLE "PolicyAcceptance"
  ADD CONSTRAINT "PolicyAcceptance_document_check" CHECK ("document" IN ('terms', 'privacy'));
ALTER TABLE "ReminderDelivery"
  ADD CONSTRAINT "ReminderDelivery_channel_check" CHECK ("channel" IN ('email', 'push'));
ALTER TABLE "Child"
  ADD CONSTRAINT "Child_guardian_verification_check" CHECK (
    ("guardianVerificationMethod" IS NULL AND "guardianVerificationRef" IS NULL)
    OR ("guardianVerificationMethod" = 'self_attested' AND "guardianVerificationRef" IS NULL)
    OR ("guardianVerificationMethod" = 'provider' AND "guardianVerificationRef" IS NOT NULL)
  );

CREATE INDEX "Child_userId_idx" ON "Child"("userId");
CREATE INDEX "MilestoneResponse_anonymizationBatchId_idx" ON "MilestoneResponse"("anonymizationBatchId");
CREATE INDEX "User_deletion_pending_idx" ON "User"("deletionRequestedAt") WHERE "deletionRequestedAt" IS NOT NULL;
CREATE INDEX "Child_deletion_pending_idx" ON "Child"("deletionRequestedAt") WHERE "deletionRequestedAt" IS NOT NULL;
CREATE INDEX "MilestoneResponse_retention_expiry_idx" ON "MilestoneResponse"("retentionExpiresAt") WHERE "retentionExpiresAt" IS NOT NULL AND "retainedAt" IS NULL;

ALTER TABLE "PolicyAcceptance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GrowthMeasurement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MilestoneEmergenceWindow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ObservationUpload" ENABLE ROW LEVEL SECURITY;
