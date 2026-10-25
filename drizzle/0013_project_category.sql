-- One category per project (Design, Development, ...), used for the Explore filter chips.
ALTER TABLE "kvelpo_project" ADD COLUMN IF NOT EXISTS "category" varchar(32);
CREATE INDEX IF NOT EXISTS "projects_category_idx" ON "kvelpo_project" ("category");
