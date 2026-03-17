/**
 * TOTP-based MFA (Google Authenticator / Authy compatible)
 *
 * Uses the otpauth library which runs in both Node.js and Cloudflare Workers.
 *
 * Enrollment flow:
 *  1. generateTOTPSecret()   → returns secret + otpauth URI
 *  2. Show QR code to user   → user scans in Authenticator app
 *  3. User submits a code    → verifyTOTP() to confirm enrollment
 *  4. Save encrypted secret  → storeMFASecret() in D1 (users.mfaSecret)
 *
 * Login flow:
 *  1. After Google OAuth success → check if mfaSecret exists in DB
 *  2. If enrolled → store pending session in KV → redirect to MFA verify page
 *  3. User enters 6-digit code → POST /api/auth/mfa/verify
 *  4. verifyTOTP() → if valid, issue JWT cookie and delete pending KV entry
 */

import * as OTPAuth from "otpauth";
import type { KVNamespace } from "@cloudflare/workers-types";

const PENDING_MFA_PREFIX = "mfa_pending:";
const PENDING_MFA_TTL = 300; // 5 minutes to complete MFA

export interface TOTPSecret {
  secret: string;       // base32-encoded secret
  otpAuthUri: string;   // otpauth:// URI for QR code
}

// ── Generate a new TOTP secret for a user ────────────────────────────────────

export function generateTOTPSecret(userEmail: string, issuer = "Intel Platform"): TOTPSecret {
  const secret = new OTPAuth.Secret({ size: 20 });

  const totp = new OTPAuth.TOTP({
    issuer,
    label: userEmail,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  return {
    secret: secret.base32,
    otpAuthUri: totp.toString(),
  };
}

// ── Verify a TOTP code against a stored secret ───────────────────────────────

export function verifyTOTP(
  secret: string,
  token: string,
  windowSize = 1  // allow 1 step before/after for clock drift
): boolean {
  const totp = new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  const delta = totp.validate({ token, window: windowSize });
  return delta !== null;
}

// ── Pending MFA session (KV) ──────────────────────────────────────────────────
// After Google OAuth but before MFA is verified, store a pending record in KV.
// This record contains the user's Google sub and email so we can complete
// the session once the TOTP code is confirmed.

export interface PendingMFASession {
  googleSub: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: number;
}

export async function storePendingMFASession(
  kv: KVNamespace,
  pendingId: string,
  session: PendingMFASession
): Promise<void> {
  await kv.put(
    `${PENDING_MFA_PREFIX}${pendingId}`,
    JSON.stringify(session),
    { expirationTtl: PENDING_MFA_TTL }
  );
}

export async function getPendingMFASession(
  kv: KVNamespace,
  pendingId: string
): Promise<PendingMFASession | null> {
  return kv.get<PendingMFASession>(`${PENDING_MFA_PREFIX}${pendingId}`, "json");
}

export async function deletePendingMFASession(
  kv: KVNamespace,
  pendingId: string
): Promise<void> {
  await kv.delete(`${PENDING_MFA_PREFIX}${pendingId}`);
}

// ── Rate limiting for MFA attempts (KV-based) ────────────────────────────────
// Prevent brute-force on the 6-digit code.

const MFA_ATTEMPTS_PREFIX = "mfa_attempts:";
const MAX_MFA_ATTEMPTS = 5;
const MFA_LOCKOUT_SECONDS = 900; // 15 min lockout after 5 failures

export async function checkAndIncrementMFAAttempts(
  kv: KVNamespace,
  identifier: string // e.g. pendingId or email
): Promise<{ allowed: boolean; attemptsLeft: number }> {
  const key = `${MFA_ATTEMPTS_PREFIX}${identifier}`;
  const raw = await kv.get(key);
  const attempts = raw ? parseInt(raw, 10) : 0;

  if (attempts >= MAX_MFA_ATTEMPTS) {
    return { allowed: false, attemptsLeft: 0 };
  }

  await kv.put(key, String(attempts + 1), { expirationTtl: MFA_LOCKOUT_SECONDS });
  return { allowed: true, attemptsLeft: MAX_MFA_ATTEMPTS - attempts - 1 };
}

export async function resetMFAAttempts(kv: KVNamespace, identifier: string): Promise<void> {
  await kv.delete(`${MFA_ATTEMPTS_PREFIX}${identifier}`);
}
