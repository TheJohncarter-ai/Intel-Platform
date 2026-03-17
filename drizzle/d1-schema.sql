-- ============================================================
-- Intel Platform — D1 (SQLite) Schema
-- Compatible with Cloudflare D1
--
-- Run via:  wrangler d1 execute intel-platform-db --file=drizzle/d1-schema.sql
-- Or via:   wrangler d1 migrations apply intel-platform-db
-- ============================================================

-- ── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER  PRIMARY KEY AUTOINCREMENT,
  openId        TEXT     NOT NULL UNIQUE,           -- Google sub
  name          TEXT,
  email         TEXT,
  loginMethod   TEXT     DEFAULT 'google',
  role          TEXT     NOT NULL DEFAULT 'user'
                         CHECK(role IN ('user','admin')),
  -- MFA fields (new vs MySQL schema)
  mfaSecret     TEXT,                               -- base32 TOTP secret (null = not enrolled)
  mfaEnrolledAt TEXT,                               -- ISO-8601 datetime
  createdAt     TEXT     NOT NULL DEFAULT (datetime('now')),
  updatedAt     TEXT     NOT NULL DEFAULT (datetime('now')),
  lastSignedIn  TEXT     NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email   ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_openId  ON users(openId);

-- ── CONTACTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT    NOT NULL,
  role                TEXT,
  organization        TEXT,
  location            TEXT,
  group_name          TEXT,
  tier                TEXT,
  email               TEXT,
  phone               TEXT,
  notes               TEXT,
  linkedinUrl         TEXT,
  sector              TEXT,
  confidence          TEXT    CHECK(confidence IN ('high','medium','low')),
  companyDomain       TEXT,
  companyDescription  TEXT,
  event               TEXT,
  lastResearchedAt    TEXT,
  lastContactedAt     TEXT,
  -- Automation tracking
  autoUpdateEnabled   INTEGER NOT NULL DEFAULT 1,   -- 1=yes, 0=paused
  lastAutoUpdatedAt   TEXT,
  createdAt           TEXT    NOT NULL DEFAULT (datetime('now')),
  updatedAt           TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_contacts_email        ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_organization ON contacts(organization);
CREATE INDEX IF NOT EXISTS idx_contacts_lastContacted ON contacts(lastContactedAt);

-- ── EMAIL WHITELIST ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_whitelist (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  email     TEXT    NOT NULL UNIQUE,
  addedBy   TEXT,
  createdAt TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── ACCESS REQUESTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_requests (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL,
  name       TEXT,
  reason     TEXT,
  status     TEXT    NOT NULL DEFAULT 'pending'
             CHECK(status IN ('pending','approved','denied')),
  reviewedBy TEXT,
  createdAt  TEXT    NOT NULL DEFAULT (datetime('now')),
  updatedAt  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);

-- ── MEETING NOTES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_notes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  contactId   INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  authorEmail TEXT    NOT NULL,
  authorName  TEXT,
  noteType    TEXT    NOT NULL DEFAULT 'general'
              CHECK(noteType IN ('meeting','call','email','follow_up','general','research')),
  content     TEXT    NOT NULL,
  createdAt   TEXT    NOT NULL DEFAULT (datetime('now')),
  updatedAt   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_meeting_notes_contactId ON meeting_notes(contactId);

-- ── AUDIT LOG ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  action      TEXT    NOT NULL,
  actorEmail  TEXT    NOT NULL,
  actorName   TEXT,
  targetType  TEXT,
  targetId    INTEGER,
  details     TEXT,
  createdAt   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actorEmail ON audit_log(actorEmail);
CREATE INDEX IF NOT EXISTS idx_audit_log_createdAt  ON audit_log(createdAt DESC);

-- ── EXTENDED NETWORK CACHE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS extended_network (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  contactId       INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  associateName   TEXT    NOT NULL,
  associateRole   TEXT,
  associateOrg    TEXT,
  connectionReason TEXT,
  connectionType  TEXT,
  linkedinUrl     TEXT,
  confidence      TEXT    DEFAULT 'medium'
                  CHECK(confidence IN ('high','medium','low')),
  createdAt       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_extended_network_contactId ON extended_network(contactId);

-- ── CONTACT UPDATE LOG (automation) ────────────────────────
-- Tracks automated contact updates for auditing & deduplication
CREATE TABLE IF NOT EXISTS contact_update_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  contactId   INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  updateType  TEXT    NOT NULL,     -- 'stale_ping', 'enrich', 'bulk_update'
  status      TEXT    NOT NULL DEFAULT 'pending'
              CHECK(status IN ('pending','completed','failed')),
  details     TEXT,
  createdAt   TEXT    NOT NULL DEFAULT (datetime('now')),
  completedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_update_log_contactId  ON contact_update_log(contactId);
CREATE INDEX IF NOT EXISTS idx_update_log_status     ON contact_update_log(status);
