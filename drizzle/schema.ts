import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

// ═══════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════
// CONTACTS
// ═══════════════════════════════════════════════════════════════════════

export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  organization: varchar("organization", { length: 255 }),
  location: varchar("location", { length: 255 }),
  group: varchar("group_name", { length: 255 }),
  tier: varchar("tier", { length: 50 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════
// EMAIL WHITELIST — controls who can access the app after OAuth
// ═══════════════════════════════════════════════════════════════════════

export const emailWhitelist = mysqlTable("email_whitelist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  addedBy: varchar("addedBy", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailWhitelist = typeof emailWhitelist.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════
// ACCESS REQUESTS — non-whitelisted users request access
// ═══════════════════════════════════════════════════════════════════════

export const accessRequests = mysqlTable("access_requests", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "denied"]).default("pending").notNull(),
  reviewedBy: varchar("reviewedBy", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccessRequest = typeof accessRequests.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════
// MEETING NOTES — timestamped relationship logs per contact
// ═══════════════════════════════════════════════════════════════════════

export const meetingNotes = mysqlTable("meeting_notes", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(),
  authorEmail: varchar("authorEmail", { length: 320 }).notNull(),
  authorName: varchar("authorName", { length: 255 }),
  noteType: mysqlEnum("noteType", ["meeting", "call", "email", "follow_up", "general"]).default("general").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MeetingNote = typeof meetingNotes.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════
// AUDIT LOG — tracks profile views, note additions, note deletions
// ═══════════════════════════════════════════════════════════════════════

export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  action: mysqlEnum("action", ["profile_view", "note_added", "note_deleted", "access_approved", "access_denied", "whitelist_added", "whitelist_removed"]).notNull(),
  actorEmail: varchar("actorEmail", { length: 320 }).notNull(),
  actorName: varchar("actorName", { length: 255 }),
  targetType: varchar("targetType", { length: 50 }),
  targetId: int("targetId"),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
