/** Shared report reasons and types, used by the report dialog, API and admin page. */

export const REPORT_REASONS = {
  spam: "Spam",
  scam: "Scam or fraud",
  harassment: "Harassment or hate",
  inappropriate: "Inappropriate content",
  impersonation: "Fake account or impersonation",
  other: "Something else",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;
export type ReportTargetType = "project" | "profile";

export const MAX_REPORT_DETAILS = 1000;

export function isReportReason(value: unknown): value is ReportReason {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(REPORT_REASONS, value);
}

export function isReportTargetType(value: unknown): value is ReportTargetType {
  return value === "project" || value === "profile";
}
