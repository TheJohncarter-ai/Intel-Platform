import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  whitelist,
  InsertWhitelistEntry,
  accessRequests,
  InsertAccessRequest,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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

// ─── User helpers ────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Whitelist helpers ───────────────────────────────────────

const ADMIN_EMAIL = "powelljohn9521@gmail.com";

export async function seedAdminWhitelist(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Check if admin already exists
    const existing = await db
      .select()
      .from(whitelist)
      .where(eq(whitelist.email, ADMIN_EMAIL))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(whitelist).values({
        email: ADMIN_EMAIL,
        name: "Admin",
        approvedBy: "system",
      });
      console.log("[Whitelist] Admin email seeded:", ADMIN_EMAIL);
    }
  } catch (error) {
    console.error("[Whitelist] Failed to seed admin:", error);
  }
}

export async function isEmailWhitelisted(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const normalizedEmail = email.toLowerCase().trim();
  const result = await db
    .select()
    .from(whitelist)
    .where(eq(whitelist.email, normalizedEmail))
    .limit(1);

  return result.length > 0;
}

export async function addToWhitelist(
  entry: InsertWhitelistEntry
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedEntry = {
    ...entry,
    email: entry.email.toLowerCase().trim(),
  };

  await db
    .insert(whitelist)
    .values(normalizedEntry)
    .onDuplicateKeyUpdate({ set: { name: normalizedEntry.name } });
}

export async function removeFromWhitelist(email: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(whitelist)
    .where(eq(whitelist.email, email.toLowerCase().trim()));
}

export async function getAllWhitelistEntries() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(whitelist).orderBy(desc(whitelist.createdAt));
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL;
}

// ─── Access request helpers ──────────────────────────────────

export async function createAccessRequest(
  request: InsertAccessRequest
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const normalizedRequest = {
    ...request,
    email: request.email.toLowerCase().trim(),
  };

  const result = await db.insert(accessRequests).values(normalizedRequest);
  return result[0].insertId;
}

export async function getAccessRequests(
  status?: "pending" | "approved" | "denied"
) {
  const db = await getDb();
  if (!db) return [];

  if (status) {
    return db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.status, status))
      .orderBy(desc(accessRequests.createdAt));
  }

  return db
    .select()
    .from(accessRequests)
    .orderBy(desc(accessRequests.createdAt));
}

export async function getAccessRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(accessRequests)
    .where(eq(accessRequests.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateAccessRequestStatus(
  id: number,
  status: "approved" | "denied",
  reviewedBy: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(accessRequests)
    .set({
      status,
      reviewedBy,
      reviewedAt: new Date(),
    })
    .where(eq(accessRequests.id, id));
}

export async function hasExistingPendingRequest(
  email: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(accessRequests)
    .where(eq(accessRequests.email, email.toLowerCase().trim()))
    .limit(1);

  return result.some((r) => r.status === "pending");
}
