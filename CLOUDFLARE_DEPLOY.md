# Cloudflare Deployment Guide — Intel Platform

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Network                        │
│                                                             │
│  ┌──────────────┐    ┌─────────────────────────────────┐   │
│  │  Cloudflare  │    │      Cloudflare Workers          │   │
│  │    Pages     │───▶│  (Hono + tRPC backend)           │   │
│  │  (React SPA) │    │  dist/worker.js                  │   │
│  └──────────────┘    └──────────┬──────────────────────┘   │
│                                  │                          │
│           ┌──────────────────────┼───────────────┐         │
│           │                      │               │         │
│    ┌──────▼──────┐   ┌──────────▼───┐  ┌────────▼──────┐  │
│    │  D1 SQLite  │   │   KV Store   │  │  R2 Storage   │  │
│    │  (Database) │   │ (MFA/Session)│  │  (Files/Docs) │  │
│    └─────────────┘   └─────────────┘  └───────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Cloudflare Access (Zero Trust)                      │   │
│  │  • Google Identity Provider                          │   │
│  │  • MFA policy enforcement                            │   │
│  │  • IP allowlist (optional)                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Auth Flow

```
User → /api/auth/google
  → Google OAuth consent
  → /api/auth/google/callback
  → User upserted in D1

  ┌── First login? ──────────────────────────────────────────┐
  │  → /mfa/setup?pending=<id>                               │
  │  → User scans QR code with Google Authenticator          │
  │  → POST /api/auth/mfa/setup/confirm { token: "123456" }  │
  │  → TOTP secret saved to D1                               │
  └──────────────────────────────────────────────────────────┘

  ┌── Returning user ─────────────────────────────────────────┐
  │  → /mfa/verify?pending=<id>                               │
  │  → POST /api/auth/mfa/verify { token: "123456" }          │
  │  → Up to 5 attempts, 15-min lockout on failure            │
  └───────────────────────────────────────────────────────────┘

  → JWT session cookie (HttpOnly, Secure, SameSite=Lax, 1yr)
  → App loads, tRPC routes check session
```

## Prerequisites

1. Cloudflare account (free tier works for dev)
2. Google Cloud Console project with OAuth 2.0 credentials
3. `wrangler` CLI: already in devDependencies (`pnpm run cf:deploy`)

---

## Step 1 — Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add Authorized redirect URIs:
   - `https://<your-worker>.workers.dev/api/auth/google/callback`
   - `https://<your-domain>/api/auth/google/callback`
4. Copy the **Client ID** and **Client Secret**

---

## Step 2 — Cloudflare Setup

### 2a. Login & create resources

```bash
npx wrangler login

# Create D1 database
npx wrangler d1 create intel-platform-db
# → Copy the database_id into wrangler.toml

# Create KV namespaces
npx wrangler kv namespace create MFA_STORE
npx wrangler kv namespace create MFA_STORE --preview
npx wrangler kv namespace create SESSION_STORE
npx wrangler kv namespace create SESSION_STORE --preview
# → Copy the IDs into wrangler.toml

# Create R2 bucket
npx wrangler r2 bucket create intel-platform-storage

# Create Queue
npx wrangler queues create contact-updates
```

### 2b. Update wrangler.toml

Replace all `REPLACE_WITH_YOUR_*` placeholders with the IDs from step 2a.

---

## Step 3 — Set Secrets

```bash
# Never commit secrets — set them via wrangler
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put JWT_SECRET          # random 64-char string
npx wrangler secret put OWNER_OPEN_ID       # your Google sub (from first login)
```

Generate a strong JWT secret:
```bash
openssl rand -hex 32
```

---

## Step 4 — Apply D1 Schema

```bash
# Apply the SQLite schema to D1
npx wrangler d1 execute intel-platform-db --file=drizzle/d1-schema.sql

# Seed admin email whitelist
npx wrangler d1 execute intel-platform-db \
  --command="INSERT OR IGNORE INTO email_whitelist (email, addedBy) VALUES ('Powelljohn9521@gmail.com', 'system')"
```

---

## Step 5 — Deploy

```bash
# Install dependencies
pnpm install

# Build + deploy Worker
pnpm run cf:deploy

# Deploy frontend (Cloudflare Pages)
pnpm run cf:pages:deploy
```

---

## Step 6 — Cloudflare Access (Optional but Recommended)

For an additional zero-trust layer on top of the app-level auth:

1. Cloudflare Zero Trust dashboard → Access → Applications → Add an application
2. Choose "Self-hosted"
3. Set domain: `<your-domain>`
4. Identity providers: Add Google
5. Create a policy: Allow by email domain (e.g. `@yourcompany.com`) or specific emails
6. Enable MFA requirement: Policy → Require MFA

This gives you:
- Google SSO enforced at the CDN edge (before requests reach your Worker)
- MFA enforced by Cloudflare (in addition to the in-app TOTP)
- Session timeouts, device posture checks, audit logs

---

## Contact Automation

Automation runs on two schedules (configured in `wrangler.toml`):

| Cron | Schedule | Action |
|------|----------|--------|
| `0 6 * * *` | Daily 6am UTC | Stale-contact scan — flags contacts not reached in 30+ days |
| `0 2 * * 0` | Sunday 2am UTC | Enrichment sweep — queues contacts missing email/phone/org |

To trigger manually:
```bash
# Force a stale scan run
npx wrangler workflows trigger stale-scan

# Or use the admin panel → Contact Automation tab
```

To integrate with a real enrichment provider (Apollo, Clearbit, Hunter):
- Edit `server/automation/contact-sync.ts`
- Find the `enrichContactData()` stub function
- Replace with your API call

---

## Environment Variables Reference

| Variable | How to set | Purpose |
|----------|-----------|---------|
| `GOOGLE_CLIENT_ID` | `wrangler secret put` | Google OAuth app ID |
| `GOOGLE_CLIENT_SECRET` | `wrangler secret put` | Google OAuth secret |
| `JWT_SECRET` | `wrangler secret put` | Session cookie signing key |
| `ADMIN_EMAIL` | `wrangler.toml [vars]` | Admin user email |
| `NODE_ENV` | `wrangler.toml [vars]` | production / development |

---

## Security Checklist

- [x] Google OAuth — only your domain's accounts allowed
- [x] TOTP MFA — required for every login, 5-attempt lockout
- [x] HttpOnly + Secure + SameSite session cookies
- [x] CSRF protection via OAuth state parameter (KV, one-time-use)
- [x] Rate limiting on MFA attempts (KV-based, 15-min lockout)
- [x] Email whitelist — only approved emails can access the app
- [x] Admin role protection on sensitive tRPC procedures
- [x] Immutable audit log for all admin actions
- [x] D1 data stays in Cloudflare's network (no external DB exposure)
- [ ] Cloudflare Access policy (optional additional layer — see Step 6)
- [ ] IP allowlist (add to Cloudflare Access if needed)
