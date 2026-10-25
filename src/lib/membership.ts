import { PRICING } from "./pricing";

/** Plans a user can be on today. */
export type Membership = "free" | "pro";

/**
 * Collapses whatever is stored in `profile.membership` to a current plan.
 * The old "team" plan was retired; any leftover "team" row counts as Pro, and
 * unknown values fall back to Free.
 */
export function normalizeMembership(value: string | null | undefined): Membership {
  return value === "pro" || value === "team" ? "pro" : "free";
}

export function isPro(value: string | null | undefined): boolean {
  return normalizeMembership(value) === "pro";
}

/** How many projects a plan may own at once (`Infinity` = unlimited). */
export function projectLimitFor(value: string | null | undefined): number {
  return isPro(value) ? Number.POSITIVE_INFINITY : PRICING.freeProjects;
}
