import {
  index,
  pgTableCreator,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const createTable = pgTableCreator(
  (name) => `kvelpo_${name}`,
);

/* -------------------------
   TABLES
------------------------- */

export const profiles = createTable("profile", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  clerkUserId: d.varchar({ length: 256 }).notNull().unique(),
  fullName: d.varchar({ length: 256 }),
  bio: d.text(),
  avatarUrl: d.varchar({ length: 512 }),
  isPublic: d.boolean().notNull().default(true),
  link1: d.varchar({ length: 512 }),
  link2: d.varchar({ length: 512 }),
  link3: d.varchar({ length: 512 }),
  membership: d.varchar({ length: 16 }).notNull().default("free"),
  stripeCustomerId: d.varchar({ length: 256 }),
  stripeSubscriptionId: d.varchar({ length: 256 }),
  subscriptionStartDate: d.timestamp({ withTimezone: true }),
  subscriptionEndDate: d.timestamp({ withTimezone: true }),
  // Set when an admin bans the user: their projects and profile are hidden
  // from everyone but admins, and Clerk blocks them from signing in.
  bannedAt: d.timestamp({ withTimezone: true }),
  bannedReason: d.text(),
  skills: d.jsonb().notNull().default([]),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d
    .timestamp({ withTimezone: true })
    .$onUpdate(() => new Date()),
}), (t) => [
  index("profile_clerk_user_id_idx").on(t.clerkUserId),
  index("is_public_idx").on(t.isPublic),
]);

// One entry in a user's LinkedIn-style experience timeline. Dates are stored
// as the first day of the month (month precision); a null endDate means the
// position is current.
export const experiences = createTable("experience", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  clerkUserId: d.varchar({ length: 256 }).notNull(),
  title: d.varchar({ length: 256 }).notNull(),
  organization: d.varchar({ length: 256 }).notNull(),
  location: d.varchar({ length: 256 }),
  startDate: d.date({ mode: "string" }).notNull(),
  endDate: d.date({ mode: "string" }),
  description: d.text(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d
    .timestamp({ withTimezone: true })
    .$onUpdate(() => new Date()),
}), (t) => [
  index("experiences_clerk_user_id_idx").on(t.clerkUserId),
]);

// A user's report of a project or profile, reviewed on /admin/reports.
// targetId is the project ID (as text) or the reported user's Clerk ID.
export const reports = createTable("report", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  reporterClerkUserId: d.varchar({ length: 256 }).notNull(),
  targetType: d.varchar({ length: 16 }).notNull(),
  targetId: d.varchar({ length: 256 }).notNull(),
  reason: d.varchar({ length: 32 }).notNull(),
  details: d.text(),
  status: d.varchar({ length: 16 }).notNull().default("open"),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  resolvedAt: d.timestamp({ withTimezone: true }),
  resolvedBy: d.varchar({ length: 256 }),
}), (t) => [
  index("reports_status_idx").on(t.status),
  index("reports_reporter_idx").on(t.reporterClerkUserId),
  index("reports_target_idx").on(t.targetType, t.targetId),
]);

// A message sent through the /support contact form, read on /admin/support.
// Signed-out visitors can write in too (clerkUserId null); ipHash is a salted
// hash used only for rate limiting, never the raw IP.
export const supportMessages = createTable("support_message", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  clerkUserId: d.varchar({ length: 256 }),
  name: d.varchar({ length: 256 }),
  email: d.varchar({ length: 320 }).notNull(),
  topic: d.varchar({ length: 32 }).notNull(),
  message: d.text().notNull(),
  ipHash: d.varchar({ length: 64 }),
  status: d.varchar({ length: 16 }).notNull().default("open"),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  resolvedAt: d.timestamp({ withTimezone: true }),
  resolvedBy: d.varchar({ length: 256 }),
}), (t) => [
  index("support_messages_status_idx").on(t.status),
  index("support_messages_user_idx").on(t.clerkUserId),
  index("support_messages_ip_idx").on(t.ipHash),
]);

// Audit log of admin actions (edit/delete/warn/ban/unban), shown on /admin.
// projectName is copied in because deleted projects can't be looked up later.
export const moderationActions = createTable("moderation_action", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  adminClerkUserId: d.varchar({ length: 256 }).notNull(),
  action: d.varchar({ length: 16 }).notNull(),
  targetClerkUserId: d.varchar({ length: 256 }),
  projectId: d.integer(),
  projectName: d.varchar({ length: 256 }),
  reason: d.text(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}), (t) => [
  index("moderation_actions_created_at_idx").on(t.createdAt),
  index("moderation_actions_target_idx").on(t.targetClerkUserId),
]);

export const userConsent = createTable("user_consent", (d) => ({
  userId: d.varchar({ length: 256 }).primaryKey(),
  termsVersion: d.integer().notNull().default(1),
  privacyVersion: d.integer().notNull().default(1),
  acceptedAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}));

export const projects = createTable("project", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  clerkUserId: d.varchar({ length: 256 }).notNull(),
  name: d.varchar({ length: 256 }).notNull(),
  description: d.text(),
  isPublic: d.boolean().notNull().default(true),
  tags: d.jsonb().notNull().default([]),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d
    .timestamp({ withTimezone: true })
    .$onUpdate(() => new Date()),
}), (t) => [
  index("projects_clerk_user_id_idx").on(t.clerkUserId),
  index("name_idx").on(t.name),
  index("projects_is_public_idx").on(t.isPublic),
]);

export const projectRolesNeeded = createTable("project_role_needed", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  projectId: d.integer().notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: d.varchar({ length: 256 }).notNull(),
  description: d.text(),
  slotsNeeded: d.integer().notNull().default(1),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}), (t) => [
  index("project_roles_needed_project_id_idx").on(t.projectId),
]);

export const applications = createTable("application", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  clerkUserId: d.varchar({ length: 256 }).notNull(),
  projectRoleNeededId: d.integer().notNull()
    .references(() => projectRolesNeeded.id, { onDelete: "cascade" }),
  status: d.varchar({ length: 50 }).notNull().default("pending"),
  message: d.text(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d
    .timestamp({ withTimezone: true })
    .$onUpdate(() => new Date()),
}), (t) => [
  index("applications_clerk_user_id_idx").on(t.clerkUserId),
  index("project_role_needed_id_idx").on(t.projectRoleNeededId),
  index("status_idx").on(t.status),
]);

export const projectMembers = createTable("project_member", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  projectId: d.integer().notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  clerkUserId: d.varchar({ length: 256 }).notNull(),
  role: d.varchar({ length: 50 }).notNull().default("member"),
  joinedAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}), (t) => [
  index("project_members_project_id_idx").on(t.projectId),
  index("project_members_clerk_user_id_idx").on(t.clerkUserId),
]);

export const notifications = createTable("notification", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  clerkUserId: d.varchar({ length: 256 }).notNull(),
  projectId: d.integer().references(() => projects.id, { onDelete: "cascade" }),
  type: d.varchar({ length: 100 }).notNull(),
  message: d.text().notNull(),
  isRead: d.boolean().notNull().default(false),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}), (t) => [
  index("notifications_clerk_user_id_idx").on(t.clerkUserId),
  index("is_read_idx").on(t.isRead),
]);

export const messages = createTable("message", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  projectId: d.integer().notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  clerkUserId: d.varchar({ length: 256 }).notNull(),
  message: d.text().notNull(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}), (t) => [
  index("messages_project_id_idx").on(t.projectId),
  index("messages_clerk_user_id_idx").on(t.clerkUserId),
  index("messages_created_at_idx").on(t.createdAt),
]);

/* -------------------------
   RELATIONS
------------------------- */

export const profilesRelations = relations(profiles, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [projects.clerkUserId],
    references: [profiles.clerkUserId],
  }),
  rolesNeeded: many(projectRolesNeeded),
  members: many(projectMembers),
  messages: many(messages),
  notifications: many(notifications),
}));

export const projectRolesNeededRelations = relations(
  projectRolesNeeded,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectRolesNeeded.projectId],
      references: [projects.id],
    }),
  }),
);

export const applicationsRelations = relations(applications, ({ one }) => ({
  role: one(projectRolesNeeded, {
    fields: [applications.projectRoleNeededId],
    references: [projectRolesNeeded.id],
  }),
}));

export const projectMembersRelations = relations(
  projectMembers,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectMembers.projectId],
      references: [projects.id],
    }),
  }),
);

export const notificationsRelations = relations(
  notifications,
  ({ one }) => ({
    project: one(projects, {
      fields: [notifications.projectId],
      references: [projects.id],
    }),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
}));