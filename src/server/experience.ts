import { experiences } from "~/server/db/schema";

/** Columns returned to clients for an experience entry (matches `Experience`). */
export const experienceColumns = {
  id: experiences.id,
  title: experiences.title,
  organization: experiences.organization,
  location: experiences.location,
  startDate: experiences.startDate,
  endDate: experiences.endDate,
  description: experiences.description,
};
