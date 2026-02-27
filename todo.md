# Strategic Network — Auth & Access Control Upgrade

## Phase 1: Infrastructure
- [x] Run webdev_add_feature to add web-db-user (backend, database, auth)
- [x] Review generated scaffolding and README

## Phase 2: Google OAuth
- [x] Configure Google OAuth via Manus OAuth system (uses Manus OAuth which supports Google sign-in)
- [x] Build login page with sign-in button
- [x] Handle OAuth callback and session management

## Phase 3: Database & Backend
- [x] Create whitelist table (email, name, approved_at, approved_by)
- [x] Create access_requests table (name, email, reason, status, created_at)
- [x] Seed admin email (Powelljohn9521@gmail.com) into whitelist
- [x] Build tRPC procedures: accessRequest.submit, accessRequest.myStatus
- [x] Build tRPC procedures: admin.listRequests, admin.approveRequest, admin.denyRequest
- [x] Build tRPC procedures: admin.listWhitelist, admin.addWhitelist, admin.removeWhitelist
- [x] Build auth.whitelistStatus procedure
- [x] Build middleware: protectedProcedure, adminProcedure

## Phase 4: Frontend
- [x] AuthGate component wrapping entire app
- [x] Login page (sign-in button with Manus OAuth)
- [x] "Request Access" page for non-whitelisted users
- [x] Admin panel page (pending requests, approve/deny, whitelist management)
- [x] Route guards: redirect unauthenticated to login, non-whitelisted to request page
- [x] Admin nav link visible only to admin
- [x] Sign out button in sidebar with user info
- [x] Admin cannot be removed from whitelist (PROTECTED badge)

## Phase 5: Email Notifications
- [x] Send notification to admin when new access request is submitted (via built-in notifyOwner)

## Phase 6: Testing & Deploy
- [x] Write vitest tests for access control system (14 tests passing)
- [x] Verify admin panel UI (access requests + whitelist tabs)
- [ ] Save checkpoint and deploy
