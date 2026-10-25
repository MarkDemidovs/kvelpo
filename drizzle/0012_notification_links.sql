-- Lets the inbox offer inline Review/Decline (applicationId) and show who it is about (actorClerkUserId).
ALTER TABLE "kvelpo_notification" ADD COLUMN IF NOT EXISTS "applicationId" integer;
ALTER TABLE "kvelpo_notification" ADD COLUMN IF NOT EXISTS "actorClerkUserId" varchar(256);
