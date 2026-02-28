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
- [ ] Responsive Home page layout (header, globe, list, stale views)
- [ ] Portrait-to-landscape rotation prompt animation on mobile globe view
- [ ] Responsive Profile page (contact info, notes, forms)
- [ ] Responsive Admin panel (tabs, tables, forms)
- [ ] Responsive Request Access page
- [ ] Touch-friendly globe interactions
- [ ] Contact cards and bottom panel responsive on small screens
- [ ] Tables scroll horizontally on mobile
- [ ] Phase 5 checkpoint + GitHub push
