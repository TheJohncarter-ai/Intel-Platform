/**
 * Contact Update Automation — Cloudflare Workers
 *
 * Three automation modes:
 *
 * 1. STALE SCAN (daily cron "0 6 * * *")
 *    Finds contacts not contacted in >30 days.
 *    Enqueues a `stale_ping` job for each → logs to contact_update_log.
 *
 * 2. ENRICHMENT SWEEP (weekly cron "0 2 * * 0")
 *    Enqueues `enrich` jobs for contacts missing key fields (email, phone, org).
 *
 * 3. BULK UPDATE (Queue consumer)
 *    Processes batches of contact update messages from the Queue.
 *    Writes updates to D1 and logs them to contact_update_log.
 *
 * External trigger — POST /api/contacts/automation/update
 *    Whitelisted admins can push a contact update payload directly.
 *    Validates fields and writes them synchronously (no queue needed).
 */

import type { D1Database, Queue, Message } from "@cloudflare/workers-types";
import type { ContactUpdateMessage } from "../worker";
import { getStaleContactsD1, updateContactFieldsD1 } from "../_core/worker-db";

const STALE_DAYS_THRESHOLD = 30;

// ── Stale contact scan ────────────────────────────────────────────────────────

export async function runStaleScan(
  db: D1Database,
  queue: Queue<ContactUpdateMessage>
): Promise<void> {
  console.log("[Automation] Starting stale contact scan...");

  const staleContacts = await getStaleContactsD1(db, STALE_DAYS_THRESHOLD);
  console.log(`[Automation] Found ${staleContacts.length} stale contacts`);

  if (staleContacts.length === 0) return;

  // Enqueue in batches of 10 (Queue batch limit)
  const BATCH_SIZE = 10;
  for (let i = 0; i < staleContacts.length; i += BATCH_SIZE) {
    const batch = staleContacts.slice(i, i + BATCH_SIZE);
    await queue.sendBatch(
      batch.map(contact => ({
        body: {
          type: "stale_ping" as const,
          contactId: contact.id,
          payload: {
            name: contact.name,
            email: contact.email,
            lastContactedAt: contact.lastContactedAt,
          },
        },
      }))
    );
  }

  console.log(`[Automation] Enqueued ${staleContacts.length} stale-ping jobs`);
}

// ── Enrichment sweep ──────────────────────────────────────────────────────────

export async function runEnrichmentSweep(
  db: D1Database,
  queue: Queue<ContactUpdateMessage>
): Promise<void> {
  console.log("[Automation] Starting enrichment sweep...");

  const { results } = await db
    .prepare(
      `SELECT id, name
       FROM contacts
       WHERE autoUpdateEnabled = 1
         AND (email IS NULL OR phone IS NULL OR organization IS NULL OR linkedinUrl IS NULL)
       ORDER BY updatedAt ASC
       LIMIT 50`
    )
    .all<{ id: number; name: string }>();

  if (results.length === 0) {
    console.log("[Automation] No contacts need enrichment");
    return;
  }

  const BATCH_SIZE = 10;
  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    const batch = results.slice(i, i + BATCH_SIZE);
    await queue.sendBatch(
      batch.map(contact => ({
        body: {
          type: "enrich" as const,
          contactId: contact.id,
          payload: { name: contact.name },
        },
      }))
    );
  }

  console.log(`[Automation] Enqueued ${results.length} enrichment jobs`);
}

// ── Queue message processor ───────────────────────────────────────────────────

export async function processContactUpdateBatch(
  messages: readonly Message<ContactUpdateMessage>[],
  db: D1Database
): Promise<void> {
  for (const msg of messages) {
    const { type, contactId, payload } = msg.body;

    if (!contactId) {
      console.warn("[Queue] Message missing contactId, skipping:", msg.body);
      msg.ack();
      continue;
    }

    try {
      if (type === "stale_ping") {
        await logContactUpdate(db, contactId, "stale_ping", "pending");
        // The stale ping simply marks the contact as needing follow-up.
        // In a real integration you could send a Slack/email reminder here.
        await logContactUpdate(db, contactId, "stale_ping", "completed", "Stale alert logged");

      } else if (type === "enrich") {
        // Enrichment placeholder — integrate with Clearbit, Apollo, or similar
        // For now we log the intent; swap in your data provider below.
        await logContactUpdate(db, contactId, "enrich", "pending");
        const enriched = await enrichContactData(contactId, payload ?? {});
        if (enriched && Object.keys(enriched).length > 0) {
          await updateContactFieldsD1(db, contactId, enriched);
        }
        await logContactUpdate(db, contactId, "enrich", "completed",
          enriched ? `Updated: ${Object.keys(enriched).join(", ")}` : "No new data");

      } else if (type === "bulk_update") {
        // Direct field update from admin/external system
        if (payload && typeof payload === "object") {
          const fields = payload as Parameters<typeof updateContactFieldsD1>[2];
          await updateContactFieldsD1(db, contactId, fields);
          await logContactUpdate(db, contactId, "bulk_update", "completed",
            `Updated: ${Object.keys(fields).join(", ")}`);
        }
      }

      msg.ack();
    } catch (err) {
      console.error(`[Queue] Failed to process ${type} for contact ${contactId}:`, err);
      await logContactUpdate(db, contactId, type, "failed", String(err));
      msg.retry();
    }
  }
}

// ── Enrichment integration stub ───────────────────────────────────────────────
// Replace this with a real data provider (Clearbit, Apollo.io, Hunter.io, etc.)

async function enrichContactData(
  contactId: number,
  payload: Record<string, unknown>
): Promise<Record<string, string> | null> {
  // Stub: return null to skip update.
  // Real integration example:
  //   const data = await fetch(`https://api.apollo.io/v1/people/match?name=${payload.name}`, {
  //     headers: { "X-Api-Key": env.APOLLO_API_KEY },
  //   }).then(r => r.json());
  //   return { email: data.email, phone: data.phone, organization: data.organization };
  console.log(`[Enrichment] Stub called for contact ${contactId}`, payload);
  return null;
}

// ── Audit helper ──────────────────────────────────────────────────────────────

async function logContactUpdate(
  db: D1Database,
  contactId: number,
  updateType: string,
  status: "pending" | "completed" | "failed",
  details?: string
): Promise<void> {
  if (status === "pending") {
    await db
      .prepare(
        `INSERT INTO contact_update_log (contactId, updateType, status, details)
         VALUES (?, ?, ?, ?)`
      )
      .bind(contactId, updateType, status, details ?? null)
      .run();
  } else {
    await db
      .prepare(
        `UPDATE contact_update_log
         SET status = ?, details = ?, completedAt = datetime('now')
         WHERE contactId = ? AND updateType = ? AND status = 'pending'
         ORDER BY createdAt DESC LIMIT 1`
      )
      .bind(status, details ?? null, contactId, updateType)
      .run();
  }
}

// ── Manual update endpoint helper ────────────────────────────────────────────
// Called from the tRPC router for immediate admin-triggered updates

export async function applyManualContactUpdate(
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
    tier: string;
  }>,
  actorEmail: string
): Promise<void> {
  await updateContactFieldsD1(db, contactId, fields);

  // Audit trail
  await db
    .prepare(
      `INSERT INTO audit_log (action, actorEmail, targetType, targetId, details)
       VALUES ('contact_updated', ?, 'contact', ?, ?)`
    )
    .bind(
      actorEmail,
      contactId,
      JSON.stringify({ updatedFields: Object.keys(fields), source: "manual" })
    )
    .run();
}
