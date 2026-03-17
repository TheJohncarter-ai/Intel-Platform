/**
 * D1-compatible database helpers for Cloudflare Workers
 *
 * These are slim wrappers around raw D1 SQL — Drizzle's D1 adapter also works
 * but raw D1 keeps the Worker bundle small and avoids Node.js compat issues.
 */

import type { D1Database } from "@cloudflare/workers-types";

export interface WorkerUser {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  mfaSecret: string | null;
  mfaEnrolledAt: string | null;
  createdAt: string;
  lastSignedIn: string;
}

// ── User operations ──────────────────────────────────────────────────────────

export async function getUserByGoogleSub(
  db: D1Database,
  googleSub: string
): Promise<WorkerUser | null> {
  const result = await db
    .prepare(
      `SELECT id, openId, name, email, loginMethod, role,
              mfaSecret, mfaEnrolledAt, createdAt, lastSignedIn
       FROM users WHERE openId = ? LIMIT 1`
    )
    .bind(googleSub)
    .first<WorkerUser>();
  return result ?? null;
}

export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<WorkerUser | null> {
  const result = await db
    .prepare(
      `SELECT id, openId, name, email, loginMethod, role,
              mfaSecret, mfaEnrolledAt, createdAt, lastSignedIn
       FROM users WHERE email = ? LIMIT 1`
    )
    .bind(email)
    .first<WorkerUser>();
  return result ?? null;
}

export async function upsertWorkerUser(
  db: D1Database,
  user: {
    openId: string;
    name: string;
    email: string;
    loginMethod: string;
  }
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (openId, name, email, loginMethod, lastSignedIn)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(openId) DO UPDATE SET
         name         = excluded.name,
         email        = excluded.email,
         loginMethod  = excluded.loginMethod,
         lastSignedIn = datetime('now'),
         updatedAt    = datetime('now')`
    )
    .bind(user.openId, user.name, user.email, user.loginMethod)
    .run();
}

export async function saveMFASecret(
  db: D1Database,
  email: string,
  secret: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE users
       SET mfaSecret = ?, mfaEnrolledAt = datetime('now'), updatedAt = datetime('now')
       WHERE email = ?`
    )
    .bind(secret, email)
    .run();
}

// ── Whitelist operations ──────────────────────────────────────────────────────

export async function isEmailWhitelistedD1(
  db: D1Database,
  email: string
): Promise<boolean> {
  const result = await db
    .prepare(`SELECT 1 FROM email_whitelist WHERE lower(email) = lower(?) LIMIT 1`)
    .bind(email)
    .first<{ 1: number }>();
  return result !== null;
}

// ── Contact operations ────────────────────────────────────────────────────────

export async function getStaleContactsD1(
  db: D1Database,
  daysThreshold = 30
): Promise<Array<{ id: number; name: string; email: string | null; lastContactedAt: string | null }>> {
  const { results } = await db
    .prepare(
      `SELECT id, name, email, lastContactedAt
       FROM contacts
       WHERE lastContactedAt IS NULL
          OR lastContactedAt < datetime('now', '-${daysThreshold} days')
       ORDER BY lastContactedAt ASC
       LIMIT 100`
    )
    .all<{ id: number; name: string; email: string | null; lastContactedAt: string | null }>();
  return results;
}

export async function updateContactFieldsD1(
  db: D1Database,
  contactId: number,
  fields: Partial<{
    name: string;
    role: string;
    organization: string;
    location: string;
    email: string;
    phone: string;
    linkedinUrl: string;
    notes: string;
  }>
): Promise<void> {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  const setClauses = entries.map(([key]) => `${key} = ?`).join(", ");
  const values = entries.map(([, v]) => v);

  await db
    .prepare(
      `UPDATE contacts SET ${setClauses}, updatedAt = datetime('now') WHERE id = ?`
    )
    .bind(...values, contactId)
    .run();
}
