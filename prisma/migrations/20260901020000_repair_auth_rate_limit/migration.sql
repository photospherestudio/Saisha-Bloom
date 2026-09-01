-- The pre-existing production schema was baselined without this table.
CREATE TABLE IF NOT EXISTS "AuthRateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AuthRateLimit_key_key" ON "AuthRateLimit"("key");
CREATE INDEX IF NOT EXISTS "AuthRateLimit_windowStart_idx" ON "AuthRateLimit"("windowStart");
ALTER TABLE "AuthRateLimit" ENABLE ROW LEVEL SECURITY;
