CREATE TABLE "kvelpo_user_consent" (
	"userId" varchar(256) PRIMARY KEY NOT NULL,
	"termsVersion" integer DEFAULT 1 NOT NULL,
	"privacyVersion" integer DEFAULT 1 NOT NULL,
	"acceptedAt" timestamp with time zone NOT NULL
);
