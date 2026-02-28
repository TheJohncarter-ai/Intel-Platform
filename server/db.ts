import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, contacts, emailWhitelist, accessRequests,
  meetingNotes, auditLog,
  type Contact, type EmailWhitelist, type AccessRequest,
  type MeetingNote, type AuditLogEntry,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ═══════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    };
    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ═══════════════════════════════════════════════════════════════════════
// CONTACTS
// ═══════════════════════════════════════════════════════════════════════

export async function getAllContacts(): Promise<Contact[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).orderBy(contacts.name);
}

export async function getContactById(id: number): Promise<Contact | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result[0];
}

export async function updateContact(
  id: number,
  data: Partial<Pick<Contact, "name" | "role" | "organization" | "location" | "group" | "tier" | "email" | "phone" | "notes" | "linkedinUrl">>
): Promise<Contact | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateSet: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) updateSet[key === "group" ? "group_name" : key] = value;
  }
  if (Object.keys(updateSet).length === 0) return getContactById(id);
  await db.update(contacts).set(updateSet).where(eq(contacts.id, id));
  return getContactById(id);
}

export async function setContactResearchedAt(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(contacts).set({ lastResearchedAt: new Date() }).where(eq(contacts.id, id));
}

/** Get the most recent note date for each contact */
export async function getLastContactedMap(): Promise<Map<number, Date>> {
  const db = await getDb();
  if (!db) return new Map();
  const rows = await db.select({
    contactId: meetingNotes.contactId,
    lastDate: sql<Date>`MAX(${meetingNotes.createdAt})`,
  }).from(meetingNotes).groupBy(meetingNotes.contactId);
  const map = new Map<number, Date>();
  for (const row of rows) {
    map.set(row.contactId, row.lastDate);
  }
  return map;
}

// ═══════════════════════════════════════════════════════════════════════
// EMAIL WHITELIST
// ═══════════════════════════════════════════════════════════════════════

export async function isEmailWhitelisted(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(emailWhitelist)
    .where(eq(emailWhitelist.email, email.toLowerCase())).limit(1);
  return result.length > 0;
}

export async function getAllWhitelistEntries(): Promise<EmailWhitelist[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailWhitelist).orderBy(desc(emailWhitelist.createdAt));
}

export async function addToWhitelist(email: string, addedBy: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(emailWhitelist).values({ email: email.toLowerCase(), addedBy }).onDuplicateKeyUpdate({ set: { addedBy } });
}

export async function removeFromWhitelist(email: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(emailWhitelist).where(eq(emailWhitelist.email, email.toLowerCase()));
}

// ═══════════════════════════════════════════════════════════════════════
// ACCESS REQUESTS
// ═══════════════════════════════════════════════════════════════════════

export async function createAccessRequest(email: string, name: string | null, reason: string | null): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(accessRequests).values({ email: email.toLowerCase(), name, reason });
}

export async function getAllAccessRequests(): Promise<AccessRequest[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessRequests).orderBy(desc(accessRequests.createdAt));
}

export async function getPendingAccessRequests(): Promise<AccessRequest[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessRequests)
    .where(eq(accessRequests.status, "pending"))
    .orderBy(desc(accessRequests.createdAt));
}

export async function updateAccessRequestStatus(
  id: number, status: "approved" | "denied", reviewedBy: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(accessRequests).set({ status, reviewedBy }).where(eq(accessRequests.id, id));
}

export async function hasExistingPendingRequest(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(accessRequests)
    .where(and(eq(accessRequests.email, email.toLowerCase()), eq(accessRequests.status, "pending")))
    .limit(1);
  return result.length > 0;
}

// ═══════════════════════════════════════════════════════════════════════
// MEETING NOTES
// ═══════════════════════════════════════════════════════════════════════

type NoteType = "meeting" | "call" | "email" | "follow_up" | "general" | "research";

export async function getNotesByContactId(contactId: number): Promise<MeetingNote[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(meetingNotes)
    .where(eq(meetingNotes.contactId, contactId))
    .orderBy(desc(meetingNotes.createdAt));
}

export async function addMeetingNote(
  contactId: number, authorEmail: string, authorName: string | null,
  noteType: NoteType, content: string
): Promise<MeetingNote> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(meetingNotes).values({
    contactId, authorEmail, authorName, noteType, content,
  }).$returningId();
  const id = result[0].id;
  const rows = await db.select().from(meetingNotes).where(eq(meetingNotes.id, id)).limit(1);
  return rows[0];
}

export async function deleteMeetingNote(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(meetingNotes).where(eq(meetingNotes.id, id));
}

export async function getMeetingNoteById(id: number): Promise<MeetingNote | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(meetingNotes).where(eq(meetingNotes.id, id)).limit(1);
  return result[0];
}

// ═══════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════

type AuditAction = "profile_view" | "note_added" | "note_deleted" | "access_approved" | "access_denied" | "whitelist_added" | "whitelist_removed" | "contact_updated" | "contact_researched" | "invite_sent";

export async function logAudit(
  action: AuditAction,
  actorEmail: string,
  actorName: string | null,
  targetType?: string,
  targetId?: number,
  details?: string,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values({ action, actorEmail, actorName, targetType, targetId, details });
}

export async function getAuditLog(opts: {
  action?: AuditAction;
  limit: number;
  offset: number;
}): Promise<{ entries: AuditLogEntry[]; total: number }> {
  const db = await getDb();
  if (!db) return { entries: [], total: 0 };

  const conditions = opts.action ? eq(auditLog.action, opts.action) : undefined;

  const entries = await db.select().from(auditLog)
    .where(conditions)
    .orderBy(desc(auditLog.createdAt))
    .limit(opts.limit)
    .offset(opts.offset);

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(auditLog).where(conditions);
  const total = Number(countResult[0]?.count ?? 0);

  return { entries, total };
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN STATS
// ═══════════════════════════════════════════════════════════════════════

export async function getAdminStats(): Promise<{
  totalContacts: number;
  totalWhitelisted: number;
  pendingRequests: number;
  totalNotes: number;
  recentActivity: number;
}> {
  const db = await getDb();
  if (!db) return { totalContacts: 0, totalWhitelisted: 0, pendingRequests: 0, totalNotes: 0, recentActivity: 0 };

  const [contactCount] = await db.select({ count: sql<number>`count(*)` }).from(contacts);
  const [whitelistCount] = await db.select({ count: sql<number>`count(*)` }).from(emailWhitelist);
  const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(accessRequests).where(eq(accessRequests.status, "pending"));
  const [noteCount] = await db.select({ count: sql<number>`count(*)` }).from(meetingNotes);
  const [activityCount] = await db.select({ count: sql<number>`count(*)` }).from(auditLog)
    .where(sql`${auditLog.createdAt} > DATE_SUB(NOW(), INTERVAL 7 DAY)`);

  return {
    totalContacts: Number(contactCount?.count ?? 0),
    totalWhitelisted: Number(whitelistCount?.count ?? 0),
    pendingRequests: Number(pendingCount?.count ?? 0),
    totalNotes: Number(noteCount?.count ?? 0),
    recentActivity: Number(activityCount?.count ?? 0),
  };
}
