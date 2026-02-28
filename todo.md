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
