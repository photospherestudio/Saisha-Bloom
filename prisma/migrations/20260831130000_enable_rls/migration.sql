-- App data is accessed through server-side Prisma. Keep Supabase Data API roles
-- from reading these tables unless explicit policies are added intentionally.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Child" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Milestone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MilestoneResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MilestoneResponseMedia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChildMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChildInvite" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReminderPreference" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReminderDelivery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recommendation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Guidance" ENABLE ROW LEVEL SECURITY;
