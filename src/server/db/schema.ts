// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { index, pgTableCreator } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `kvelpo_${name}`);

export const profiles = createTable(
  "profile",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    clerkUserId: d.varchar({ length: 256 }).notNull().unique(),
    fullName: d.varchar({ length: 256 }),
    bio: d.text(),
    avatarUrl: d.varchar({ length: 512 }),
    isPublic: d.boolean().notNull().default(true),
    link1: d.varchar({ length: 512 }),
    link2: d.varchar({ length: 512 }),
    link3: d.varchar({ length: 512 }),
    skills: d.json("jsonb").notNull().default([]),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("profile_clerk_user_id_idx").on(t.clerkUserId),
    index("is_public_idx").on(t.isPublic),
  ],
);

export const projects = createTable(
  "project",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    clerkUserId: d.varchar({ length: 256 }).notNull(),
    name: d.varchar({ length: 256 }).notNull(),
    description: d.text(),
    isPublic: d.boolean().notNull().default(true),
    tags: d.json("jsonb").notNull().default([]),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("projects_clerk_user_id_idx").on(t.clerkUserId),
    index("name_idx").on(t.name),
    index("projects_is_public_idx").on(t.isPublic),
  ],
);

export const projectRolesNeeded = createTable(
  "project_role_needed",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    projectId: d.integer().notNull().references(() => projects.id, { onDelete: "cascade" }),
    title: d.varchar({ length: 256 }).notNull(),
    description: d.text(),
    slotsNeeded: d.integer().notNull().default(1),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [index("project_roles_needed_project_id_idx").on(t.projectId)],
);

export const applications = createTable(
  "application",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    clerkUserId: d.varchar({ length: 256 }).notNull(),
    projectRoleNeededId: d.integer().notNull().references(() => projectRolesNeeded.id, { onDelete: "cascade" }),
    status: d.varchar({ length: 50 }).notNull().default("pending"),
    message: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("applications_clerk_user_id_idx").on(t.clerkUserId),
    index("project_role_needed_id_idx").on(t.projectRoleNeededId),
    index("status_idx").on(t.status),
  ],
);

export const projectMembers = createTable(
  "project_member",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    projectId: d.integer().notNull().references(() => projects.id, { onDelete: "cascade" }),
    clerkUserId: d.varchar({ length: 256 }).notNull(),
    role: d.varchar({ length: 50 }).notNull().default("member"),
    joinedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("project_members_project_id_idx").on(t.projectId),
    index("project_members_clerk_user_id_idx").on(t.clerkUserId),
  ],
);

export const notifications = createTable(
  "notification",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    clerkUserId: d.varchar({ length: 256 }).notNull(),
    projectId: d.integer().references(() => projects.id, { onDelete: "cascade" }),
    type: d.varchar({ length: 100 }).notNull(),
    message: d.text().notNull(),
    isRead: d.boolean().notNull().default(false),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("notifications_clerk_user_id_idx").on(t.clerkUserId),
    index("is_read_idx").on(t.isRead),
  ],
);

export const messages = createTable(
  "message",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    projectId: d.integer().notNull().references(() => projects.id, { onDelete: "cascade" }),
    clerkUserId: d.varchar({ length: 256 }).notNull(),
    message: d.text().notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
  }),
  (t) => [
    index("messages_project_id_idx").on(t.projectId),
    index("messages_clerk_user_id_idx").on(t.clerkUserId),
    index("messages_created_at_idx").on(t.createdAt),
  ],
);
