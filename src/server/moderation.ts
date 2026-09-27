import "server-only";
import { db } from "~/server/db";
import { moderationActions } from "~/server/db/schema";

export type ModerationAction = "edit" | "delete" | "warn" | "ban" | "unban";

export const MAX_MODERATION_REASON = 1000;

type LogEntry = {
  adminClerkUserId: string;
  action: ModerationAction;
  targetClerkUserId?: string | null;
  projectId?: number | null;
  projectName?: string | null;
  reason?: string | null;
};

type Executor = Pick<typeof db, "insert">;

/** Records an admin action in the audit log shown on /admin. */
export async function logModerationAction(entry: LogEntry, executor: Executor = db): Promise<void> {
  await executor.insert(moderationActions).values({
    adminClerkUserId: entry.adminClerkUserId,
    action: entry.action,
    targetClerkUserId: entry.targetClerkUserId ?? null,
    projectId: entry.projectId ?? null,
    projectName: entry.projectName ?? null,
    reason: entry.reason ?? null,
  });
}

/** Trims a free-text reason from a request body; "" when missing. */
export function readReason(body: Record<string, unknown> | null): string {
  const value = body?.reason;
  return typeof value === "string" ? value.trim() : "";
}
