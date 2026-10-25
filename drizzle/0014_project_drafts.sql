-- Drafts: saved from the post-a-project steps, visible only to their owner until published.
ALTER TABLE "kvelpo_project" ADD COLUMN IF NOT EXISTS "isDraft" boolean DEFAULT false NOT NULL;
