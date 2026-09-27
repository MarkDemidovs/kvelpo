/** Shared support-contact details, used by the support page, API and admin inbox. */

/** Both team members receive "Email us" messages and are CC'd on replies. */
export const SUPPORT_EMAILS = ["markussdemidovs@kvelpo.com", "arvismelnis@kvelpo.com"] as const;

export const SUPPORT_TOPICS = {
  account: "Account or sign-in",
  billing: "Billing or subscription",
  bug: "Something isn't working",
  feedback: "Feedback or feature idea",
  other: "Something else",
} as const;

export type SupportTopic = keyof typeof SUPPORT_TOPICS;

export const MAX_SUPPORT_MESSAGE = 5000;

export function isSupportTopic(value: unknown): value is SupportTopic {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(SUPPORT_TOPICS, value);
}

/** Loose but practical email check; the real test is whether a reply arrives. */
export function isValidEmail(value: string): boolean {
  return value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
