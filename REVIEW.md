# Strategic Network Intelligence — Phase 2 Review

**Date:** February 28, 2026  
**Scope:** UX review, data feed analysis, codebase refactor, and recommendations

---

## 1. Executive Summary

The Strategic Network Intelligence platform is a specialized CRM/intelligence tool built around an interactive 3D globe visualization of 35 contacts across 14 regions. The application features Google OAuth authentication with email whitelist-based access control, an admin panel for managing access requests, relationship logging (meeting notes, calls, emails, follow-ups), and a comprehensive audit trail.

This review covers three areas: (1) UX improvements implemented and recommended, (2) data feed mechanisms for keeping profiles current, and (3) codebase refactoring completed and further opportunities.

---

## 2. UX Review

### 2.1 Improvements Implemented

| Feature | Description | Impact |
|---------|-------------|--------|
| **Quick Search (Ctrl+K)** | Command palette-style search overlay in the header. Searches contacts by name, organization, country, and role. Results link directly to profiles. | High — eliminates the need to manually browse the globe for specific contacts |
| **Delete Confirmation** | Meeting notes now require a two-step delete (click trash → confirm/cancel) instead of immediate deletion | Medium — prevents accidental data loss |
| **Shared UI Primitives** | Created `ui-primitives.tsx` with reusable components: PageShell, PageHeader, AccentBar, SectionLabel, PanelCard, StatusBadge, LoadingScreen, EmptyState | Medium — reduces code duplication and ensures visual consistency |
| **Shared Country Extraction** | Moved `extractCountry()` to `shared/utils.ts` for use by both client and server | Low — better code organization |

### 2.2 Recommended Future Improvements

**High Priority:**

1. **Contact List View** — Add a toggleable sidebar or table view alongside the globe. Users with 35+ contacts need a scannable list sorted by name, tier, or last interaction date. The globe is excellent for geographic context but poor for sequential browsing.

2. **Contact Editing** — Currently contacts are read-only (seeded via SQL). Add inline editing for name, role, organization, location, email, phone, and notes. This transforms the tool from a static directory into a living intelligence platform.

3. **"Last Contacted" Indicator** — Derive from the most recent meeting note timestamp. Display on both the globe tooltip and the contact list. Contacts with no interaction in 30+ days should be flagged for follow-up.

4. **Mobile Responsive Layout** — The globe renders at a fixed 650px height. On mobile, this should collapse to a contact list with a "Show Globe" toggle. The admin panel and profile pages need responsive grid adjustments.

**Medium Priority:**

5. **Contact Tags/Labels** — Allow users to tag contacts with custom labels (e.g., "key decision maker", "follow up Q2", "warm lead"). Tags should be filterable on the globe and in list view.

6. **Export Capabilities** — Admin audit log export to CSV. Contact list export. Meeting notes export per contact or bulk.

7. **Dashboard Stats on Admin** — Show total contacts, total whitelisted users, pending requests count, and recent activity summary at the top of the admin panel.

8. **Keyboard Navigation** — Beyond Ctrl+K search, add arrow key navigation through search results, Enter to open profile, Escape to close overlays.

**Low Priority:**

9. **Loading Skeletons** — Replace text-based "Loading..." with skeleton UI that matches the final layout shape.

10. **Breadcrumb Navigation** — Add breadcrumbs on Profile and Admin pages for clearer wayfinding.

---

## 3. Data Feed Analysis

For a "living intelligence tool," the platform needs mechanisms to keep contact profiles current without manual data entry. Below is an analysis of viable approaches ranked by implementation cost and value.

### 3.1 Recommended Data Feed Mechanisms

| Mechanism | Cost | Value | Description |
|-----------|------|-------|-------------|
| **Manual Enrichment via LLM** | Low | High | Add a "Research Contact" button on each profile that calls the built-in LLM API with the contact's name + organization. The LLM can summarize publicly available information, recent news, and role changes. Results are saved as a "research" note type. |
| **RSS/News Feed Integration** | Low | High | Configure RSS feeds for key news sources (Reuters, Bloomberg, industry-specific). A server-side cron job (or tRPC mutation) checks feeds daily and matches articles mentioning contact names or organizations. Matched articles appear as "intel" notes on the relevant profile. |
| **Email Forwarding Webhook** | Medium | High | Create an inbound webhook endpoint that accepts forwarded emails. Parse sender/recipient against the contact database and auto-create "email" type notes. This captures real interaction data without manual logging. |
| **LinkedIn Profile Scraping** | High | High | Store LinkedIn profile URLs on contacts. Use a scraping service (Proxycurl, PhantomBuster, or similar API) to periodically pull profile updates — role changes, company changes, new connections. **Note:** LinkedIn actively blocks scraping; a paid API like Proxycurl ($49/mo) is the reliable path. |
| **Webhook-based CRM Sync** | Medium | Medium | If the user also uses Salesforce, HubSpot, or Pipedrive, set up webhook listeners for contact update events. Map external CRM fields to the local contact schema. |
| **Calendar Integration** | Medium | Medium | Connect to Google Calendar or Outlook via OAuth. When a calendar event includes a contact's email, auto-create a "meeting" note with the event title and time. |
| **Public Data APIs** | Low | Medium | Use free APIs like Clearbit (company data), FullContact (person data), or OpenCorporates (company registry) to enrich organization details, logos, and company metadata. |

### 3.2 Recommended Implementation Order

**Phase 1 (Quick Wins):**
1. LLM-powered contact research button (uses existing `invokeLLM` helper — zero external dependencies)
2. RSS feed monitoring for organization mentions (use `rss-parser` npm package + server-side cron)

**Phase 2 (Medium Effort):**
3. Email forwarding webhook (requires DNS/email configuration)
4. Calendar integration (requires OAuth flow for Google/Microsoft)

**Phase 3 (Paid Services):**
5. LinkedIn enrichment via Proxycurl API
6. CRM sync webhooks (depends on user's existing CRM)

### 3.3 Architecture for Data Feeds

All data feeds should follow the same pattern:

```
External Source → Server Webhook/Cron → Normalize Data → 
  → Create MeetingNote (type: "intel" | "research" | "email" | "calendar")
  → Optionally update Contact fields (role, organization)
  → Log to AuditLog (action: "auto_enrichment")
```

This keeps the existing schema intact while adding automated intelligence. The meeting notes table already supports multiple note types, so adding "intel", "research", and "calendar" types is a schema migration of one enum extension.

---

## 4. Codebase Refactor

### 4.1 Refactoring Completed

| Change | Files Affected | Rationale |
|--------|---------------|-----------|
| Created `shared/utils.ts` | Home.tsx, shared/utils.ts | Moved `extractCountry()` from inline in Home.tsx to a shared module usable by both client and server |
| Created `ui-primitives.tsx` | Profile.tsx, ui-primitives.tsx | Extracted 10 reusable components (PageShell, PanelCard, StatusBadge, etc.) that were previously inline-styled in every page |
| Refactored Profile.tsx | Profile.tsx | Replaced all inline style objects with shared primitives; added delete confirmation flow; cleaner component structure |
| Added Quick Search | Home.tsx | Keyboard-accessible search overlay with Ctrl+K shortcut |

### 4.2 Remaining Refactoring Opportunities

**High Impact:**

1. **Split Admin Router** — `server/routers.ts` is 192 lines with admin procedures nested 3 levels deep. Extract `server/routers/admin.ts` for whitelist, requests, and audit log procedures. Keep the main router as a thin aggregator.

2. **GlobeWidget Decomposition** — At ~1,100 lines, `GlobeWidget.tsx` is the largest file. The internal sub-components (HUD panel, control hints, contact cards, filter bar) could be extracted into separate files under `components/globe/`. The core globe initialization logic should remain in one file, but the UI overlay can be modular.

3. **Admin Page Component Extraction** — `Admin.tsx` contains three full tab components (AccessRequestsTab, WhitelistTab, AuditLogTab) plus shared sub-components. Each tab should be its own file under `pages/admin/`.

**Medium Impact:**

4. **Type Safety for Note Types** — The note type enum ("meeting" | "call" | "email" | "follow_up" | "general") is repeated in schema, routers, and UI. Create a shared constant in `shared/const.ts` and derive types from it.

5. **Consistent Error Handling** — Some DB functions return `undefined` on failure, others throw. Standardize to always throw on unexpected errors and return `null` for "not found" cases.

6. **Query Key Management** — tRPC invalidation calls are scattered across components. Consider a centralized invalidation helper that knows which queries to refresh after each mutation type.

### 4.3 Performance Observations

- **Globe Rendering:** The globe.gl library loads a ~2MB world topology JSON on mount. This is cached by the browser after first load, but initial load could benefit from a CDN-hosted topology file with aggressive cache headers.
- **Contact Queries:** The `contacts.list` query fetches all 35 contacts on every home page load. At this scale, this is fine. Beyond ~500 contacts, implement server-side pagination and pass only the country/coordinate data to the globe (not full profiles).
- **Audit Log Pagination:** Already implemented correctly with server-side offset/limit. No issues at current scale.

### 4.4 Test Coverage

Current: **26 tests across 3 test files** (all passing)

| File | Tests | Coverage |
|------|-------|----------|
| `contacts.test.ts` | 7 | Country extraction, contact data mapping |
| `auth.logout.test.ts` | 1 | Session cookie clearing |
| `phase1.test.ts` | 18 | Whitelist, access requests, notes CRUD, audit logging |

**Recommended additions:**
- Edge cases for `extractCountry()` with unusual location formats
- Admin procedure authorization tests (non-admin user attempting admin operations)
- Globe contact mapping tests (null fields, missing locations)
- Integration test for the access request → approve → whitelist flow

---

## 5. Architecture Summary

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (React 19)                 │
├─────────────────────────────────────────────────────┤
│  Home.tsx ──── GlobeWidget.tsx (globe.gl)           │
│  Profile.tsx ── MeetingNotesSection                  │
│  Admin.tsx ──── AccessRequests / Whitelist / Audit   │
│  RequestAccess.tsx                                   │
│  AuthGate.tsx (whitelist enforcement)                │
│  ui-primitives.tsx (shared components)               │
├─────────────────────────────────────────────────────┤
│                    tRPC (type-safe RPC)              │
├─────────────────────────────────────────────────────┤
│                    SERVER (Express 4)                │
├─────────────────────────────────────────────────────┤
│  routers.ts ── contacts / notes / admin / auth       │
│  db.ts ──────── Drizzle ORM query helpers            │
│  _core/ ─────── OAuth, context, LLM, notifications   │
├─────────────────────────────────────────────────────┤
│                    DATABASE (MySQL/TiDB)             │
├─────────────────────────────────────────────────────┤
│  users │ contacts │ email_whitelist │ access_requests│
│  meeting_notes │ audit_log                           │
└─────────────────────────────────────────────────────┘
```

---

## 6. Conclusion

The platform is well-architected for its current scope. The globe visualization is a compelling differentiator, and the auth/whitelist system provides appropriate access control. The most impactful next steps are:

1. **Contact editing** — transforms it from a directory to a CRM
2. **LLM-powered research** — leverages the built-in API for zero-cost intelligence enrichment
3. **Contact list view** — makes the tool usable for daily operations beyond geographic exploration
4. **RSS monitoring** — adds passive intelligence gathering

The codebase is clean and well-tested. The main structural improvement is splitting the larger files (GlobeWidget, Admin, routers) into smaller, focused modules as the feature set grows.
