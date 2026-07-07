-- Rename and fix jsonb columns
ALTER TABLE "kvelpo_profile" RENAME COLUMN "jsonb" TO "skills";
ALTER TABLE "kvelpo_profile" ALTER COLUMN "skills" TYPE jsonb USING "skills"::jsonb;

ALTER TABLE "kvelpo_project" RENAME COLUMN "jsonb" TO "tags";
ALTER TABLE "kvelpo_project" ALTER COLUMN "tags" TYPE jsonb USING "tags"::jsonb;
