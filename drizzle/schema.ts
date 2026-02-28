import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Whitelist table — only emails in this table can access the app content.
 * The admin email is auto-seeded on first server start.
 */
export const whitelist = mysqlTable("whitelist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: text("name"),
  approvedBy: varchar("approvedBy", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhitelistEntry = typeof whitelist.$inferSelect;
export type InsertWhitelistEntry = typeof whitelist.$inferInsert;

/**
 * Access requests — non-whitelisted users can request access.
 * Admin reviews and approves/denies.
 */
export const accessRequests = mysqlTable("access_requests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 320 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "denied"]).default("pending").notNull(),
  reviewedBy: varchar("reviewedBy", { length: 320 }),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = typeof accessRequests.$inferInsert;

/**
 * Contact notes — relationship notes, meeting logs, follow-up tasks
 * attached to specific contacts by whitelisted users.
 */
export const contactNotes = mysqlTable("contact_notes", {
  id: int("id").autoincrement().primaryKey(),
  /** The static contact ID from the contacts data (1-35) */
  contactId: int("contactId").notNull(),
  /** The name of the contact (denormalized for easy display) */
  contactName: varchar("contactName", { length: 320 }).notNull(),
  /** The user who created this note */
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 320 }).notNull(),
  userEmail: varchar("userEmail", { length: 320 }).notNull(),
  /** Type of note */
  noteType: mysqlEnum("noteType", ["meeting", "interaction", "follow_up", "general"]).default("general").notNull(),
  /** Note content */
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactNote = typeof contactNotes.$inferSelect;
export type InsertContactNote = typeof contactNotes.$inferInsert;

/**
 * Audit log — tracks profile views and note additions across the site.
 * Only visible to admin.
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  /** The user who performed the action */
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 320 }).notNull(),
  userEmail: varchar("userEmail", { length: 320 }).notNull(),
  /** Action type */
  action: mysqlEnum("action", ["profile_view", "note_added", "note_deleted"]).notNull(),
  /** The contact involved */
  contactId: int("contactId").notNull(),
  contactName: varchar("contactName", { length: 320 }).notNull(),
  /** Optional metadata (e.g., note type, note preview) */
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLogEntry = typeof auditLog.$inferInsert;
