/**
 * Shared shape, validation and formatting for profile experience entries.
 * Used by the API (validation), the profile editor and the public profile.
 */

export type Experience = {
  id: number;
  title: string;
  organization: string;
  location: string | null;
  /** YYYY-MM-DD, always the first of the month. */
  startDate: string;
  /** YYYY-MM-DD, or null while the position is current. */
  endDate: string | null;
  description: string | null;
};

export type ExperienceInput = Omit<Experience, "id">;

export const MAX_EXPERIENCES = 30;
const MAX_SHORT_TEXT = 256;
const MAX_DESCRIPTION = 2000;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Validates a request body; `startMonth`/`endMonth` are "YYYY-MM" strings. */
export function parseExperienceInput(body: unknown): { value: ExperienceInput } | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body" };
  }
  const raw = body as Record<string, unknown>;
  const text = (key: string) => {
    const value = raw[key];
    return typeof value === "string" ? value.trim() : "";
  };

  const title = text("title");
  const organization = text("organization");
  const location = text("location");
  const description = text("description");
  const startMonth = text("startMonth");
  const endMonth = text("endMonth");

  if (!title || !organization) {
    return { error: "Title and company/organization are required" };
  }
  if (title.length > MAX_SHORT_TEXT || organization.length > MAX_SHORT_TEXT || location.length > MAX_SHORT_TEXT) {
    return { error: `Title, organization and location must be at most ${MAX_SHORT_TEXT} characters` };
  }
  if (description.length > MAX_DESCRIPTION) {
    return { error: `Description must be at most ${MAX_DESCRIPTION} characters` };
  }
  if (!MONTH_PATTERN.test(startMonth)) {
    return { error: "Start date is required" };
  }
  if (endMonth && !MONTH_PATTERN.test(endMonth)) {
    return { error: "End date is invalid" };
  }
  if (startMonth > currentMonth()) {
    return { error: "Start date can't be in the future" };
  }
  if (endMonth && endMonth < startMonth) {
    return { error: "End date can't be before the start date" };
  }

  return {
    value: {
      title,
      organization,
      location: location.length > 0 ? location : null,
      startDate: `${startMonth}-01`,
      endDate: endMonth ? `${endMonth}-01` : null,
      description: description.length > 0 ? description : null,
    },
  };
}

/** Current roles first, then most recently ended, then most recently started. */
export function sortExperiences<T extends Pick<Experience, "startDate" | "endDate">>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (!a.endDate !== !b.endDate) return a.endDate ? 1 : -1;
    const byEnd = (b.endDate ?? "").localeCompare(a.endDate ?? "");
    return byEnd !== 0 ? byEnd : b.startDate.localeCompare(a.startDate);
  });
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonth(date: string): string {
  const [year, month] = date.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/** e.g. "Mar 2022 – Present · 2 yrs 7 mos" */
export function formatExperienceRange(startDate: string, endDate: string | null, now = new Date()): string {
  const [startYear = 0, startMonth = 1] = startDate.split("-").map(Number);
  const [endYear = 0, endMonth = 1] = endDate
    ? endDate.split("-").map(Number)
    : [now.getUTCFullYear(), now.getUTCMonth() + 1];

  // Inclusive of both months, like LinkedIn (Jan–Jan is 1 month).
  const totalMonths = Math.max(1, (endYear - startYear) * 12 + (endMonth - startMonth) + 1);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const duration = [
    years ? `${years} yr${years === 1 ? "" : "s"}` : "",
    months ? `${months} mo${months === 1 ? "" : "s"}` : "",
  ].filter(Boolean).join(" ");

  return `${formatMonth(startDate)} – ${endDate ? formatMonth(endDate) : "Present"} · ${duration}`;
}
