ALTER TABLE "kvelpo_profile" ADD COLUMN "stripeCustomerId" varchar(256);--> statement-breakpoint
ALTER TABLE "kvelpo_profile" ADD COLUMN "stripeSubscriptionId" varchar(256);--> statement-breakpoint
ALTER TABLE "kvelpo_profile" ADD COLUMN "subscriptionStartDate" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "kvelpo_profile" ADD COLUMN "subscriptionEndDate" timestamp with time zone;