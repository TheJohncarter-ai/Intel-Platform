/**
 * Cloudflare Workers entry point
 *
 * Replaces the Express server (server/_core/index.ts) with a Hono application
 * that runs natively on Cloudflare Workers. Provides:
 *
 *  - Google OAuth 2.0 login
 *  - TOTP MFA (Google Authenticator compatible)
 *  - tRPC API via fetch adapter
 *  - Scheduled contact-update automation (Cron Triggers)
 *  - Queue consumer for async contact enrichment
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { nanoid } from "nanoid";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type {
  D1Database,
  KVNamespace,
  R2Bucket,
  Queue,
  ExecutionContext,
  MessageBatch,
  ScheduledController,
} from "@cloudflare/workers-types";

import { appRouter } from "./routers";
import { createWorkerContext } from "./_core/worker-context";
import {
  buildGoogleAuthUrl,
  exchangeCodeForToken,
  fetchGoogleUserInfo,
  storeOAuthState,
  validateAndConsumeOAuthState,
} from "./_core/google-auth";
import {
  generateTOTPSecret,
  verifyTOTP,
  storePendingMFASession,
  getPendingMFASession,
  deletePendingMFASession,
  checkAndIncrementMFAAttempts,
  resetMFAAttempts,
} from "./_core/mfa";
import {
  signSession,
  buildSessionCookie,
  buildClearSessionCookie,
  getSessionTokenFromRequest,
  verifySession,
} from "./_core/session";
import { runStaleScan, runEnrichmentSweep } from "./automation/contact-sync";

// ── Cloudflare bindings type ──────────────────────────────────────────────────

export interface Env {
  // D1 database
  DB: D1Database;
  // KV namespaces
  MFA_STORE: KVNamespace;
  SESSION_STORE: KVNamespace;
  // R2 bucket
  STORAGE: R2Bucket;
  // Queue
  CONTACT_UPDATE_QUEUE: Queue;
  // Secrets / vars
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  ADMIN_EMAIL: string;
  NODE_ENV: string;
}

// ── App ───────────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: (origin) => origin,  // echo origin — tightened below via Access policies
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

// ── Auth: Google OAuth ────────────────────────────────────────────────────────

app.get("/api/auth/google", async (c) => {
  const state = nanoid(32);
  const redirectUri = new URL("/api/auth/google/callback", c.req.url).toString();

  await storeOAuthState(c.env.MFA_STORE, state);

  const url = buildGoogleAuthUrl(
    {
      clientId: c.env.GOOGLE_CLIENT_ID,
      clientSecret: c.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    },
    state
  );

  return c.redirect(url, 302);
});

app.get("/api/auth/google/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code || !state) {
    return c.json({ error: "Missing code or state" }, 400);
  }

  const storedState = await validateAndConsumeOAuthState(c.env.MFA_STORE, state);
  if (!storedState) {
    return c.json({ error: "Invalid or expired OAuth state" }, 400);
  }

  const redirectUri = new URL("/api/auth/google/callback", c.req.url).toString();

  let googleUser;
  try {
    const { accessToken } = await exchangeCodeForToken(code, {
      clientId: c.env.GOOGLE_CLIENT_ID,
      clientSecret: c.env.GOOGLE_CLIENT_SECRET,
      redirectUri,
    });
    googleUser = await fetchGoogleUserInfo(accessToken);
  } catch (err) {
    console.error("[OAuth] Google callback failed:", err);
    return c.redirect("/?error=oauth_failed", 302);
  }

  // Upsert user in D1
  const { getUserByGoogleSub, upsertWorkerUser } = await import("./_core/worker-db");
  await upsertWorkerUser(c.env.DB, {
    openId: googleUser.sub,
    name: googleUser.name,
    email: googleUser.email,
    loginMethod: "google",
  });

  const user = await getUserByGoogleSub(c.env.DB, googleUser.sub);
  if (!user) return c.redirect("/?error=user_error", 302);

  // Check if MFA is enrolled
  if (user.mfaSecret) {
    // Store pending MFA session — user must verify TOTP before getting cookie
    const pendingId = nanoid(32);
    await storePendingMFASession(c.env.MFA_STORE, pendingId, {
      googleSub: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      createdAt: Date.now(),
    });
    return c.redirect(`/mfa/verify?pending=${pendingId}`, 302);
  }

  // First login — send to MFA enrollment
  const pendingId = nanoid(32);
  await storePendingMFASession(c.env.MFA_STORE, pendingId, {
    googleSub: googleUser.sub,
    email: googleUser.email,
    name: googleUser.name,
    picture: googleUser.picture,
    createdAt: Date.now(),
  });
  return c.redirect(`/mfa/setup?pending=${pendingId}`, 302);
});

// ── Auth: MFA Setup (enrollment) ─────────────────────────────────────────────

app.get("/api/auth/mfa/setup", async (c) => {
  const pendingId = c.req.query("pending");
  if (!pendingId) return c.json({ error: "Missing pending session" }, 400);

  const pending = await getPendingMFASession(c.env.MFA_STORE, pendingId);
  if (!pending) return c.json({ error: "Pending session expired or invalid" }, 401);

  const { secret, otpAuthUri } = generateTOTPSecret(pending.email);

  // Store the un-confirmed secret temporarily (confirmed on first verify)
  await c.env.MFA_STORE.put(
    `mfa_setup:${pendingId}`,
    JSON.stringify({ secret, email: pending.email }),
    { expirationTtl: 600 }
  );

  return c.json({ otpAuthUri, pendingId });
});

app.post("/api/auth/mfa/setup/confirm", async (c) => {
  const { pendingId, token } = await c.req.json<{ pendingId: string; token: string }>();
  if (!pendingId || !token) return c.json({ error: "Missing fields" }, 400);

  const pending = await getPendingMFASession(c.env.MFA_STORE, pendingId);
  if (!pending) return c.json({ error: "Pending session expired" }, 401);

  const setupData = await c.env.MFA_STORE.get<{ secret: string; email: string }>(
    `mfa_setup:${pendingId}`,
    "json"
  );
  if (!setupData) return c.json({ error: "Setup session expired" }, 401);

  const rateCheck = await checkAndIncrementMFAAttempts(c.env.MFA_STORE, pendingId);
  if (!rateCheck.allowed) {
    return c.json({ error: "Too many attempts. Please try again in 15 minutes." }, 429);
  }

  if (!verifyTOTP(setupData.secret, token)) {
    return c.json({ error: `Invalid code. ${rateCheck.attemptsLeft} attempts remaining.` }, 401);
  }

  // Save secret to D1
  const { saveMFASecret } = await import("./_core/worker-db");
  await saveMFASecret(c.env.DB, pending.email, setupData.secret);

  await resetMFAAttempts(c.env.MFA_STORE, pendingId);
  await deletePendingMFASession(c.env.MFA_STORE, pendingId);
  await c.env.MFA_STORE.delete(`mfa_setup:${pendingId}`);

  // Issue session
  const isAdmin = pending.email.toLowerCase() === c.env.ADMIN_EMAIL.toLowerCase();
  const token_ = await signSession(
    {
      sub: pending.googleSub,
      email: pending.email,
      name: pending.name,
      picture: pending.picture,
      role: isAdmin ? "admin" : "user",
      mfaVerified: true,
    },
    c.env.JWT_SECRET
  );

  return c.json(
    { success: true },
    200,
    { "Set-Cookie": buildSessionCookie(token_) }
  );
});

// ── Auth: MFA Verify (login) ──────────────────────────────────────────────────

app.post("/api/auth/mfa/verify", async (c) => {
  const { pendingId, token } = await c.req.json<{ pendingId: string; token: string }>();
  if (!pendingId || !token) return c.json({ error: "Missing fields" }, 400);

  const pending = await getPendingMFASession(c.env.MFA_STORE, pendingId);
  if (!pending) return c.json({ error: "Session expired. Please sign in again." }, 401);

  const rateCheck = await checkAndIncrementMFAAttempts(c.env.MFA_STORE, pendingId);
  if (!rateCheck.allowed) {
    await deletePendingMFASession(c.env.MFA_STORE, pendingId);
    return c.json({ error: "Too many failed attempts. Please sign in again." }, 429);
  }

  const { getUserByGoogleSub } = await import("./_core/worker-db");
  const user = await getUserByGoogleSub(c.env.DB, pending.googleSub);
  if (!user?.mfaSecret) return c.json({ error: "MFA not configured" }, 400);

  if (!verifyTOTP(user.mfaSecret, token)) {
    return c.json(
      { error: `Invalid code. ${rateCheck.attemptsLeft} attempts remaining.` },
      401
    );
  }

  await resetMFAAttempts(c.env.MFA_STORE, pendingId);
  await deletePendingMFASession(c.env.MFA_STORE, pendingId);

  const isAdmin = pending.email.toLowerCase() === c.env.ADMIN_EMAIL.toLowerCase();
  const sessionToken = await signSession(
    {
      sub: pending.googleSub,
      email: pending.email,
      name: pending.name,
      picture: pending.picture,
      role: isAdmin ? "admin" : "user",
      mfaVerified: true,
    },
    c.env.JWT_SECRET
  );

  return c.json(
    { success: true },
    200,
    { "Set-Cookie": buildSessionCookie(sessionToken) }
  );
});

// ── Auth: Logout ─────────────────────────────────────────────────────────────

app.post("/api/auth/logout", (c) => {
  return c.json({ success: true }, 200, { "Set-Cookie": buildClearSessionCookie() });
});

// ── Auth: Session check ───────────────────────────────────────────────────────

app.get("/api/auth/me", async (c) => {
  const token = getSessionTokenFromRequest(c.req.raw);
  if (!token) return c.json(null, 200);

  const session = await verifySession(token, c.env.JWT_SECRET);
  if (!session) return c.json(null, 200);

  return c.json({
    sub: session.sub,
    email: session.email,
    name: session.name,
    picture: session.picture,
    role: session.role,
  });
});

// ── tRPC API ─────────────────────────────────────────────────────────────────

app.all("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () => createWorkerContext(c.req.raw, c.env),
  });
});

// ── Default: serve Cloudflare Pages assets ───────────────────────────────────
// In production, Cloudflare Pages serves static assets automatically.
// This fallback returns a minimal 404 for unknown API routes.
app.notFound((c) => {
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: "Not found" }, 404);
  }
  // Let Cloudflare Pages handle everything else
  return c.text("Not found", 404);
});

// ── Scheduled handler (Cron Triggers) ────────────────────────────────────────

async function scheduledHandler(
  controller: ScheduledController,
  env: Env,
  _ctx: ExecutionContext
): Promise<void> {
  const cron = controller.cron;
  console.log(`[Cron] Triggered: ${cron}`);

  if (cron === "0 6 * * *") {
    // Daily stale-contact scan
    await runStaleScan(env.DB, env.CONTACT_UPDATE_QUEUE);
  } else if (cron === "0 2 * * 0") {
    // Weekly enrichment sweep
    await runEnrichmentSweep(env.DB, env.CONTACT_UPDATE_QUEUE);
  }
}

// ── Queue consumer (contact update jobs) ─────────────────────────────────────

async function queueHandler(
  batch: MessageBatch<ContactUpdateMessage>,
  env: Env
): Promise<void> {
  const { processContactUpdateBatch } = await import("./automation/contact-sync");
  await processContactUpdateBatch(batch.messages, env.DB);
}

export interface ContactUpdateMessage {
  type: "stale_ping" | "enrich" | "bulk_update";
  contactId?: number;
  payload?: Record<string, unknown>;
}

// ── Export ────────────────────────────────────────────────────────────────────

export default {
  fetch: app.fetch,
  scheduled: scheduledHandler,
  queue: queueHandler,
};
