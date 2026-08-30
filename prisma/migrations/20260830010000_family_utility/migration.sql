-- Run after the initial schema. Existing responses are attributed to the child owner.
ALTER TABLE "User" ADD COLUMN "supabaseUserId" TEXT;
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");

ALTER TABLE "MilestoneResponse" ADD COLUMN "userId" TEXT;
UPDATE "MilestoneResponse" AS response
SET "userId" = child."userId"
FROM "Child" AS child
WHERE response."childId" = child."id";
ALTER TABLE "MilestoneResponse" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "MilestoneResponse"
  ADD CONSTRAINT "MilestoneResponse_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "MilestoneResponse_childId_createdAt_idx" ON "MilestoneResponse"("childId", "createdAt");
CREATE INDEX "MilestoneResponse_userId_createdAt_idx" ON "MilestoneResponse"("userId", "createdAt");

CREATE TABLE "MilestoneResponseMedia" (
  "id" TEXT NOT NULL,
  "responseId" TEXT NOT NULL,
  "objectPath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MilestoneResponseMedia_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MilestoneResponseMedia_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "MilestoneResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MilestoneResponseMedia_objectPath_key" ON "MilestoneResponseMedia"("objectPath");
CREATE INDEX "MilestoneResponseMedia_responseId_createdAt_idx" ON "MilestoneResponseMedia"("responseId", "createdAt");

CREATE TABLE "ChildMember" (
  "id" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'editor',
  "invitedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChildMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChildMember_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChildMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ChildMember_childId_userId_key" ON "ChildMember"("childId", "userId");
CREATE INDEX "ChildMember_userId_createdAt_idx" ON "ChildMember"("userId", "createdAt");

CREATE TABLE "ChildInvite" (
  "id" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "invitedBy" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChildInvite_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ChildInvite_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChildInvite_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ChildInvite_tokenHash_key" ON "ChildInvite"("tokenHash");
CREATE INDEX "ChildInvite_childId_email_idx" ON "ChildInvite"("childId", "email");
CREATE INDEX "ChildInvite_email_expiresAt_idx" ON "ChildInvite"("email", "expiresAt");

CREATE TABLE "ReminderPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReminderPreference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReminderPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReminderPreference_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ReminderPreference_userId_childId_key" ON "ReminderPreference"("userId", "childId");
CREATE INDEX "ReminderPreference_enabled_updatedAt_idx" ON "ReminderPreference"("enabled", "updatedAt");

CREATE TABLE "ReminderDelivery" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "checkpoint" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "providerId" TEXT,
  "error" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReminderDelivery_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReminderDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReminderDelivery_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ReminderDelivery_userId_childId_checkpoint_key" ON "ReminderDelivery"("userId", "childId", "checkpoint");
CREATE INDEX "ReminderDelivery_status_createdAt_idx" ON "ReminderDelivery"("status", "createdAt");
