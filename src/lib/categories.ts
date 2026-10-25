/** The single category a project is filed under (Explore filter chips and the post flow). */
export const PROJECT_CATEGORIES = ["Design", "Development", "Marketing", "Business", "Writing", "Other"] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export function isProjectCategory(value: unknown): value is ProjectCategory {
  return typeof value === "string" && (PROJECT_CATEGORIES as readonly string[]).includes(value);
}
