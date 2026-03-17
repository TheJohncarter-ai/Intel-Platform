/**
 * JWT session management for Cloudflare Workers
 * Uses the jose library (already in dependencies) which works in Workers.
 */

import { SignJWT, jwtVerify } from "jose";
import { ONE_YEAR_MS } from "@shared/const";

export interface SessionPayload {
  sub: string;        // Google sub (user ID)
  email: string;
  name: string;
  picture?: string;
  role: "user" | "admin";
  mfaVerified: boolean;
  iat?: number;
  exp?: number;
}

export const SESSION_COOKIE = "intel_session";
const ALG = "HS256";

function getSecretKey(jwtSecret: string): Uint8Array {
  return new TextEncoder().encode(jwtSecret);
}

// ── Sign a new session JWT ────────────────────────────────────────────────────

export async function signSession(
  payload: Omit<SessionPayload, "iat" | "exp">,
  jwtSecret: string,
  expiresInMs = ONE_YEAR_MS
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(Date.now() + expiresInMs)
    .sign(getSecretKey(jwtSecret));
}

// ── Verify & decode a session JWT ─────────────────────────────────────────────

export async function verifySession(
  token: string,
  jwtSecret: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(jwtSecret));
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export function buildSessionCookie(token: string, maxAgeMs = ONE_YEAR_MS): string {
  const maxAgeSeconds = Math.floor(maxAgeMs / 1000);
  return [
    `${SESSION_COOKIE}=${token}`,
    `Max-Age=${maxAgeSeconds}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

export function buildClearSessionCookie(): string {
  return [
    `${SESSION_COOKIE}=`,
    "Max-Age=0",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

export function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key.trim() === SESSION_COOKIE) {
      return rest.join("=").trim() || null;
    }
  }
  return null;
}
