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
- [x] Save checkpoint and deploy

## Feature: Relationship Notes / Meeting Logs
- [x] Create contact_notes table (contactId, userId, userName, noteType, content, createdAt)
- [x] Build tRPC procedures: notes.list, notes.create, notes.delete
- [x] Build notes UI section on ProfileDetail page (chronological, timestamped, author shown)
- [x] Support note types: meeting note, interaction, follow-up task, general
- [x] Only whitelisted users can add notes

## Feature: Audit Log
- [x] Create audit_log table (userId, userName, action, contactId, contactName, metadata, createdAt)
- [x] Log profile views automatically when user opens a contact profile
- [x] Log note additions when a user creates a note
- [x] Log note deletions when a user deletes a note
- [x] Build admin-only tRPC procedures: auditLog.list with pagination and filters
- [x] Add "Audit Log" tab in admin panel with chronological feed
- [x] Audit log only visible to admin (powelljohn9521@gmail.com)

## Deploy
- [x] Write vitest tests for notes and audit log (14 new tests, 28 total passing)
- [ ] Save final checkpoint and deploy
