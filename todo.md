# Project TODO

- [x] Install globe.gl and topojson-client dependencies
- [x] Create contacts database schema with location field
- [x] Seed 35 contacts with full profiles into database
- [x] Create backend tRPC procedures for contacts
- [x] Drop in new GlobeWidget.tsx component with /profile route prefix
- [x] Create country extraction utility (location → country)
- [x] Build Home page with prominent globe placement (height=650)
- [x] Set up dark theme for globe aesthetic
- [x] Add Google Fonts (JetBrains Mono) for globe HUD
- [x] Create profile page route for contact links
- [x] Set up App.tsx routing for /profile/:id
- [x] Write vitest test for the integration
- [x] Verify compilation
- [x] Save checkpoint

## Phase 1 — Re-integrate Features
- [x] Email whitelist table + access control middleware
- [x] Access requests table + "Request Access" page for non-whitelisted users
- [x] Admin panel at /admin (only Powelljohn9521@gmail.com) — approve/deny requests, manage whitelist
- [x] Meeting notes / relationship logs on contact profiles (timestamped, with author)
- [x] Audit log table — tracks profile views, note additions, note deletions
- [x] Admin-only audit log page with filtering and pagination
- [x] Auth flow: protect routes, redirect non-whitelisted to request page
- [x] Notify admin on new access requests
- [x] Phase 1 tests (26 passing)
- [x] Phase 1 checkpoint

## Phase 2 — Review & Refactor
- [x] Full UX review — identify improvements
- [x] Data feed analysis — LinkedIn, RSS, webhooks, APIs for living intelligence
- [x] Codebase refactor — remove redundancy, optimize performance, improve structure
- [x] Write detailed review document
- [x] Phase 2 checkpoint

## Phase 3 — Implement Suggestions + Polish
- [x] LLM-powered "Research Contact" button on profiles
- [x] Contact list/table view (toggleable alongside globe)
- [x] Contact editing (Add Info form: phone, email, notes, role changes)
- [x] Email button on contacts (mailto: link)
- [x] "Last Contacted" indicator on profiles and list
- [x] Aesthetic polish: spacing, typography, transitions, hover states
- [x] Premium intelligence dashboard aesthetic
- [x] Admin panel: Invite button (add to whitelist + send invite)
- [x] Admin panel: visual polish and improved UX
- [x] Verify Google OAuth flow is fully working
- [x] Phase 3 tests (32 total passing)
- [x] Phase 3 checkpoint

## Phase 4 — GitHub Integration + Arcs, Import/Export, Last Contacted
- [x] Pull King's latest changes from GitHub repo (README.md + todo.md update)
- [x] Review and integrate King's changes with current build
- [x] Relationship arcs on globe (animated arcs between contacts sharing org/group)
- [x] CSV export endpoint (download all contacts as CSV)
- [x] CSV import endpoint (bulk-add contacts from CSV upload)
- [x] CSV import/export UI on Home page
- [x] lastContactedAt field on contacts table (auto-update when notes added)
- [x] Stale contacts dashboard view (contacts not engaged recently)
- [x] Push to GitHub repo
- [x] Phase 4 tests (40 total passing)
- [x] Phase 4 checkpoint

## Phase 5 — GitHub Sync + Mobile Optimization
- [x] Push all current code to GitHub main branch
- [x] Verify GitHub repo is fully up to date
- [x] Responsive Home page layout (header, globe, list, stale views)
- [x] Portrait-to-landscape rotation prompt animation on mobile globe view
- [x] Responsive Profile page (contact info, notes, forms)
- [x] Responsive Admin panel (tabs, tables, forms)
- [x] Responsive Request Access page
- [x] Touch-friendly globe interactions
- [x] Contact cards and bottom panel responsive on small screens
- [x] Tables scroll horizontally on mobile
- [x] Phase 5 checkpoint + GitHub push

## Phase 6 — LLM-Powered Intelligent Search
- [x] Backend: LLM search endpoint that gathers all contact data as context
- [x] Backend: Uses invokeLLM with contact names, roles, orgs, bios, regions, notes
- [x] Backend: Returns formatted answer referencing specific contacts with IDs
- [x] Frontend: Floating button (sparkle+?, glowing/pulsing) on list view only
- [x] Frontend: Chat-style search overlay with natural language input
- [x] Frontend: Results link to contact profiles when mentioning names
- [x] Tests for the search endpoint (43 total passing)
- [x] Push to GitHub + checkpoint

## Phase 7 — Import 37 Researched Contacts
- [x] Update contacts schema with new fields: linkedinUrl, email, phone, sector, confidence, companyDomain, companyDescription
- [x] Migrate database with new schema
- [x] Add event field to contacts schema for tagging (e.g., "Black Bull Investors Summit")
- [x] Tag all 37 new contacts with "Black Bull Investors Summit" event
- [x] Create seed script to import all 37 contacts from CSV + markdown bios + event tag
- [x] Update backend to expose new fields in contact queries
- [x] Update Profile page: LinkedIn link, email button, sector tags, confidence indicator, company info, event badge
- [x] Make event visible and searchable in LLM intelligent search
- [x] Update Home list view: show sector tags, confidence badges, LinkedIn/email icons, event tags
- [x] Ensure new contacts appear on globe mapped to correct regions (72 total nodes)
- [x] Ensure new contacts are searchable via LLM intelligent search (with sector, confidence, event, company, LinkedIn)
- [x] Tests for new fields (43 total passing)
- [x] Push to GitHub + checkpoint

## Phase 8 — Connections View + Shared Activity Footer
- [x] Backend: endpoint to compute all contact-to-contact relationships (shared org, event, sector, domain)
- [x] Backend: endpoint for per-contact shared activity (colleagues, co-attendees, sector peers, shared domain)
- [x] Frontend: Connections network graph page with force-directed layout (d3-force)
- [x] Frontend: Interactive nodes (click to profile), edges labeled by relationship type
- [x] Frontend: Filter/highlight by relationship type (org, event, sector, domain)
- [x] Frontend: Add "Graph" button to Home header
- [x] Frontend: Shared Activity footer on Profile page — same company, same event, same sector, same domain
- [x] Frontend: Clickable connections linking to other profiles
- [x] Route setup for /connections page
- [x] Tests for connections endpoint (46 total passing)
- [x] Push to GitHub + checkpoint

## Phase 9 — Cleanup + Extended Network
- [x] Audit all contacts: identified 14 test entries (7 'Test Import Person' + 7 'Another Person')
- [x] Remove test contacts from database (72 real contacts remain)
- [x] Identify and merge duplicate contact entries (no real duplicates found)
- [ ] Add deduplication logic to prevent future duplicates on import
- [x] Backend: Extended Network endpoint using LLM to research associates
- [x] Backend: Cache extended network results to avoid repeated LLM calls (extended_network table)
- [x] Frontend: Extended Network / Professional Associates section on Profile page
- [x] Each associate shows: name, role, organization, connection type, confidence, LinkedIn link
- [x] Tests for new endpoints (52 total passing across 8 test files)
- [ ] Push to GitHub + checkpoint
