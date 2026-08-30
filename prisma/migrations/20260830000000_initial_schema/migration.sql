-- Baseline for the pre-existing Prisma schema. Apply this only to an empty database.
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "clerkId" TEXT,
  "email" TEXT NOT NULL,
  "timezone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Child" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "dob" TIMESTAMP(3) NOT NULL,
  "gender" TEXT,
  "gestationalWeeks" INTEGER,
  "heightCm" DOUBLE PRECISION,
  "weightKg" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Child_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Child_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Milestone" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "ageRangeMinMonths" DOUBLE PRECISION NOT NULL,
  "ageRangeMaxMonths" DOUBLE PRECISION NOT NULL,
  "source" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MilestoneResponse" (
  "id" TEXT NOT NULL,
  "childId" TEXT NOT NULL,
  "milestoneId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MilestoneResponse_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MilestoneResponse_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "MilestoneResponse_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "MilestoneResponse_childId_milestoneId_createdAt_idx" ON "MilestoneResponse"("childId", "milestoneId", "createdAt");

CREATE TABLE "Recommendation" (
  "id" TEXT NOT NULL,
  "milestoneId" TEXT NOT NULL,
  "triggerStatus" TEXT NOT NULL,
  "activityText" TEXT NOT NULL,
  "tipText" TEXT NOT NULL,
  "illustrationSlug" TEXT NOT NULL,
  CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Recommendation_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Guidance" (
  "id" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "ageRangeMinMonths" INTEGER NOT NULL,
  "ageRangeMaxMonths" INTEGER NOT NULL,
  "kind" TEXT NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Guidance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Guidance_externalId_key" ON "Guidance"("externalId");
CREATE INDEX "Guidance_ageRangeMinMonths_ageRangeMaxMonths_domain_idx" ON "Guidance"("ageRangeMinMonths", "ageRangeMaxMonths", "domain");
CREATE INDEX "Guidance_kind_ageRangeMinMonths_ageRangeMaxMonths_idx" ON "Guidance"("kind", "ageRangeMinMonths", "ageRangeMaxMonths");
