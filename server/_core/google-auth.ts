/**
 * Google OAuth 2.0 handler for Cloudflare Workers
 *
 * Flow:
 *  1. User hits /api/auth/google  → redirect to Google consent screen
 *  2. Google redirects to /api/auth/google/callback?code=...&state=...
 *  3. Server exchanges code for tokens, fetches user profile
 *  4. If MFA enrolled  → prompt for TOTP code (pending state in KV)
 *  5. If MFA not yet   → enroll on first login (QR setup screen)
 *  6. Verified         → issue JWT session, set HttpOnly cookie
 */

import type { KVNamespace } from "@cloudflare/workers-types";

export interface GoogleUserInfo {
  sub: string;         // Google's unique user ID (openId equivalent)
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// ── Step 1: Build authorization URL ─────────────────────────────────────────

export function buildGoogleAuthUrl(config: GoogleOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    state,
    // Prompt for account selection every time (safer for shared devices)
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ── Step 2: Exchange auth code for access token ──────────────────────────────

export async function exchangeCodeForToken(
  code: string,
  config: GoogleOAuthConfig
): Promise<{ accessToken: string; idToken: string }> {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const data = await resp.json() as {
    access_token: string;
    id_token: string;
    error?: string;
  };

  if (data.error) throw new Error(`Google OAuth error: ${data.error}`);

  return { accessToken: data.access_token, idToken: data.id_token };
}

// ── Step 3: Fetch user profile from Google ────────────────────────────────────

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch Google user info: ${resp.statusText}`);
  }

  const user = await resp.json() as GoogleUserInfo;

  if (!user.email_verified) {
    throw new Error("Google account email is not verified");
  }

  return user;
}

// ── State/CSRF helpers using KV ───────────────────────────────────────────────

const STATE_PREFIX = "oauth_state:";
const STATE_TTL_SECONDS = 600; // 10 minutes

export async function storeOAuthState(
  kv: KVNamespace,
  state: string,
  metadata: Record<string, string> = {}
): Promise<void> {
  await kv.put(
    `${STATE_PREFIX}${state}`,
    JSON.stringify({ createdAt: Date.now(), ...metadata }),
    { expirationTtl: STATE_TTL_SECONDS }
  );
}

export async function validateAndConsumeOAuthState(
  kv: KVNamespace,
  state: string
): Promise<Record<string, string> | null> {
  const key = `${STATE_PREFIX}${state}`;
  const value = await kv.get(key, "json") as Record<string, string> | null;
  if (!value) return null;
  // Consume it — one-time use
  await kv.delete(key);
  return value;
}
