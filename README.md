# Strategic Network Intelligence

A full-stack strategic relationship management platform for mapping, profiling, and tracking 35 key contacts across the Colombian VC, financial ecosystem, and international business networks. Built as a private, access-controlled intelligence tool with meeting logs, audit tracking, and an admin control panel.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Database Schema](#database-schema)
- [Authentication & Access Control](#authentication--access-control)
- [Contact Data Structure](#contact-data-structure)
- [API Reference (tRPC Procedures)](#api-reference-trpc-procedures)
- [Setup & Local Development](#setup--local-development)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Directory Structure](#directory-structure)

---

## Overview

Strategic Network Intelligence is a private, invite-only web application that serves as a living intelligence dossier for 35 high-value contacts across three groups:

- **Colombian Market — VC & Financial Ecosystem** (7 contacts, Tier 1–3 ranked)
- **General Contacts** (21 contacts)
- **Business Card Contacts** (7 contacts)

Each contact has a full profile page with professional biography, career history, key achievements, VC assessment (where applicable), and contact information. Whitelisted users can log meeting notes and interaction history directly on each profile. The admin has access to a full audit log of all site activity.

---

## Features

### Contact Intelligence
- **35 complete contact profiles** with bios, career histories, achievements, and contact info
- **VC tier ranking system** (Tier 1–3) for Colombian market decision makers, scored on capital access, track record, and relationship strength
- **Full-text search** across name, organization, role, and location
- **Group filtering** — Colombian Market, General Contacts, Business Card Contacts
- **Rankings page** with detailed VC assessment breakdowns
- **Profile photo support** (Isabella Muñoz)
- **LinkedIn, email, phone, and cell** quick-access links on every card

### Authentication & Access Control
- **OAuth sign-in** via Manus OAuth (supports Google, Apple, Microsoft, GitHub, and email)
- **Email whitelist** — only approved emails can access content
- **Request Access flow** — non-whitelisted users submit name, email, and reason; admin is notified
- **Admin auto-seeding** — `powelljohn9521@gmail.com` is permanently whitelisted and protected from removal
- **AuthGate component** wraps the entire app, enforcing auth at the React router level

### Relationship Notes / Meeting Logs
- **Four note types**: Meeting Note, Interaction, Follow-up Task, General
- Notes are **timestamped** and attributed to the author (name + email)
- Displayed **chronologically** on each contact's profile page
- Any whitelisted user can add notes; authors and admins can delete them

### Admin Panel (`/admin`)
- **Access Requests tab** — view pending/approved/denied requests, approve or deny with one click
- **Whitelist tab** — manually add or remove emails; admin email is permanently protected
- **Audit Log tab** — chronological feed of all profile views, note additions, and note deletions across the entire site; filterable by action type; paginated (30 per page)
- Accessible only to `powelljohn9521@gmail.com`

### Design
- **Intelligence Dossier** aesthetic — dark charcoal canvas (`#0f0f0f`) with warm amber accents (`#c8922a`)
- **DM Serif Display** for names and headings (editorial authority)
- **IBM Plex Sans** for body text (technical precision)
- Responsive layout with collapsible sidebar
- Tier badges styled as classification clearance levels

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Wouter (routing) |
| **UI Components** | shadcn/ui (Radix UI primitives) |
| **Backend** | Express 4, tRPC 11 (type-safe API) |
| **Database** | MySQL / TiDB via Drizzle ORM |
| **Authentication** | Manus OAuth (JWT session cookies) |
| **Build Tool** | Vite 7 |
| **Testing** | Vitest |
| **Package Manager** | pnpm |
| **Runtime** | Node.js 22 (tsx for dev, esbuild for prod) |

---

## Project Architecture

The project follows a **monorepo structure** with a shared TypeScript contract between frontend and backend via tRPC. The frontend and backend run as a single Express server in production (Vite serves the React SPA; Express handles `/api/trpc` and OAuth routes).

```
Browser → Vite SPA (React)
              ↓ tRPC httpBatchLink (/api/trpc)
         Express Server
              ↓
         tRPC Router (server/routers.ts)
              ↓
         Drizzle ORM → MySQL/TiDB
```

**Authentication flow:**

```
User clicks Sign In
    → Redirect to Manus OAuth portal
    → OAuth callback → /api/oauth/callback
    → Server creates JWT session cookie
    → Frontend reads auth state via trpc.auth.me
    → AuthGate checks whitelist status via trpc.auth.whitelistStatus
    → If whitelisted → show app content
    → If not whitelisted → show Request Access page
```

---

## Database Schema

Five tables power the application:

### `users`
Stores authenticated users from OAuth. The `role` field (`user` | `admin`) gates admin-only procedures.

| Column | Type | Description |
|---|---|---|
| `id` | INT PK | Auto-increment primary key |
| `openId` | VARCHAR(64) UNIQUE | Manus OAuth identifier |
| `name` | TEXT | Display name |
| `email` | VARCHAR(320) | Email address |
| `loginMethod` | VARCHAR(64) | OAuth provider used |
| `role` | ENUM | `user` or `admin` |
| `createdAt` | TIMESTAMP | Account creation time |
| `lastSignedIn` | TIMESTAMP | Last login time |

### `whitelist`
Controls who can access the app content after authentication.

| Column | Type | Description |
|---|---|---|
| `id` | INT PK | Auto-increment primary key |
| `email` | VARCHAR(320) UNIQUE | Approved email address |
| `name` | TEXT | Display name (optional) |
| `approvedBy` | VARCHAR(320) | Email of approving admin |
| `createdAt` | TIMESTAMP | Approval timestamp |

### `access_requests`
Stores access requests from authenticated but non-whitelisted users.

| Column | Type | Description |
|---|---|---|
| `id` | INT PK | Auto-increment primary key |
| `name` | VARCHAR(320) | Requester's name |
| `email` | VARCHAR(320) | Requester's email |
| `reason` | TEXT | Reason for requesting access |
| `status` | ENUM | `pending`, `approved`, or `denied` |
| `reviewedBy` | VARCHAR(320) | Admin who reviewed |
| `reviewedAt` | TIMESTAMP | Review timestamp |
| `createdAt` | TIMESTAMP | Request submission time |

### `contact_notes`
Meeting logs, interaction history, and follow-up tasks attached to contacts.

| Column | Type | Description |
|---|---|---|
| `id` | INT PK | Auto-increment primary key |
| `contactId` | INT | Static contact ID (1–35) from contacts data |
| `contactName` | VARCHAR(320) | Denormalized contact name for display |
| `userId` | INT | Author's user ID |
| `userName` | VARCHAR(320) | Author's display name |
| `userEmail` | VARCHAR(320) | Author's email |
| `noteType` | ENUM | `meeting`, `interaction`, `follow_up`, `general` |
| `content` | TEXT | Note body |
| `createdAt` | TIMESTAMP | Note creation time |

### `audit_log`
Immutable record of all significant user actions across the site.

| Column | Type | Description |
|---|---|---|
| `id` | INT PK | Auto-increment primary key |
| `userId` | INT | Actor's user ID |
| `userName` | VARCHAR(320) | Actor's display name |
| `userEmail` | VARCHAR(320) | Actor's email |
| `action` | ENUM | `profile_view`, `note_added`, `note_deleted` |
| `contactId` | INT | Contact involved in the action |
| `contactName` | VARCHAR(320) | Contact's name |
| `metadata` | TEXT | JSON string with extra context (note type, preview) |
| `createdAt` | TIMESTAMP | Action timestamp |

---

## Authentication & Access Control

Access control is enforced at three layers:

1. **React (AuthGate component)** — checks `trpc.auth.me` and `trpc.auth.whitelistStatus` on every route; redirects unauthenticated users to the login screen and non-whitelisted users to the Request Access page.

2. **tRPC middleware** — three procedure types:
   - `publicProcedure` — no auth required (login, OAuth callback)
   - `protectedProcedure` — requires a valid JWT session cookie
   - `adminProcedure` — requires `role === 'admin'` on the user record

3. **Database** — the `whitelist` table is the authoritative source; the admin email is seeded on every server startup and cannot be removed via the API.

---

## Contact Data Structure

All 35 contacts are defined in `client/src/data/contacts.ts` as a typed TypeScript array. Each contact conforms to the `Contact` interface:

```typescript
interface Contact {
  id: number;                    // 1–35, stable identifier
  name: string;
  role: string;
  organization: string;
  location?: string;
  group: 'colombian-vc' | 'general' | 'business-card';
  tier?: 1 | 2 | 3;             // VC tier (Colombian Market only)
  linkedin?: string;
  email?: string;
  phone?: string;
  cell?: string;
  website?: string;
  photo?: string;                // CDN URL
  bio?: string;                  // Full professional biography
  careerHistory?: CareerEntry[];
  achievements?: Achievement[];
  vcAssessment?: VCAssessment;   // Capital access, track record, relationships
  education?: string;
  notes?: string;                // Static background notes
}
```

---

## API Reference (tRPC Procedures)

All procedures are defined in `server/routers.ts` and consumed via `trpc.*` hooks on the frontend.

### `auth.*`
| Procedure | Type | Auth | Description |
|---|---|---|---|
| `auth.me` | Query | Public | Returns current user or null |
| `auth.logout` | Mutation | Public | Clears session cookie |
| `auth.whitelistStatus` | Query | Protected | Returns `{ whitelisted, hasPendingRequest }` |

### `accessRequest.*`
| Procedure | Type | Auth | Description |
|---|---|---|---|
| `accessRequest.submit` | Mutation | Protected | Submit a new access request |

### `notes.*`
| Procedure | Type | Auth | Description |
|---|---|---|---|
| `notes.list` | Query | Protected | List all notes for a contact by `contactId` |
| `notes.create` | Mutation | Protected | Create a note; logs to audit_log |
| `notes.delete` | Mutation | Protected | Delete own note (admin can delete any) |

### `audit.*`
| Procedure | Type | Auth | Description |
|---|---|---|---|
| `audit.logView` | Mutation | Protected | Log a profile view to audit_log |

### `admin.*`
| Procedure | Type | Auth | Description |
|---|---|---|---|
| `admin.listRequests` | Query | Admin | List access requests with optional status filter |
| `admin.approveRequest` | Mutation | Admin | Approve request → adds email to whitelist |
| `admin.denyRequest` | Mutation | Admin | Deny a pending request |
| `admin.listWhitelist` | Query | Admin | List all whitelist entries |
| `admin.addWhitelist` | Mutation | Admin | Manually add an email to whitelist |
| `admin.removeWhitelist` | Mutation | Admin | Remove email (admin email is protected) |
| `admin.auditLog` | Query | Admin | Paginated audit log with action filter |

---

## Setup & Local Development

### Prerequisites

- Node.js 22+
- pnpm 10+
- A MySQL or TiDB database (connection string required)

### Installation

```bash
# Clone the repository
git clone https://github.com/TheJohncarter-ai/Intel-Platform.git
cd Intel-Platform

# Install dependencies
pnpm install

# Copy environment variables template
cp .env.example .env
# Fill in the required values (see Environment Variables section)

# Push the database schema
pnpm db:push

# Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Development Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with hot reload (tsx watch) |
| `pnpm build` | Build for production (Vite + esbuild) |
| `pnpm start` | Run the production build |
| `pnpm test` | Run all Vitest tests |
| `pnpm db:push` | Generate and apply database migrations |
| `pnpm check` | TypeScript type check (no emit) |
| `pnpm format` | Format code with Prettier |

---

## Environment Variables

The following environment variables are required. In production (Manus hosting), these are injected automatically.

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL/TiDB connection string |
| `JWT_SECRET` | Secret for signing session cookies |
| `VITE_APP_ID` | OAuth application ID |
| `OAUTH_SERVER_URL` | OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | OAuth login portal URL (frontend) |
| `OWNER_OPEN_ID` | Owner's OAuth open ID (for admin auto-promotion) |
| `OWNER_NAME` | Owner's display name |
| `BUILT_IN_FORGE_API_URL` | Built-in API base URL (notifications, LLM, storage) |
| `BUILT_IN_FORGE_API_KEY` | Bearer token for server-side built-in APIs |
| `VITE_FRONTEND_FORGE_API_KEY` | Bearer token for frontend built-in APIs |
| `VITE_FRONTEND_FORGE_API_URL` | Built-in API URL for frontend |

Create a `.env` file in the project root with these values for local development.

---

## Running Tests

The project uses **Vitest** for unit and integration testing. Tests run against the live database (using the `DATABASE_URL` from environment).

```bash
pnpm test
```

**28 tests across 3 test files:**

| File | Tests | Coverage |
|---|---|---|
| `server/auth.logout.test.ts` | 1 | Session cookie clearing on logout |
| `server/access-control.test.ts` | 13 | Whitelist check, access request submission, admin approval/denial, whitelist management |
| `server/notes-audit.test.ts` | 14 | Note creation/listing/deletion, audit log view tracking, admin audit log query with filters and pagination |

---

## Deployment

This project is hosted on [Manus](https://manus.im) with built-in CI/CD. To deploy:

1. Save a checkpoint via the Manus Management UI
2. Click the **Publish** button in the Management UI header

The production build runs `pnpm build` (Vite for the frontend, esbuild for the server) and serves everything from a single Express process.

For self-hosted deployment, build the project and run:

```bash
pnpm build
NODE_ENV=production node dist/index.js
```

Ensure all environment variables are set in your production environment.

---

## Directory Structure

```
Intel-Platform/
├── client/                        # React frontend
│   ├── index.html                 # Vite entry point (Google Fonts loaded here)
│   ├── public/                    # Static assets (favicon, robots.txt)
│   └── src/
│       ├── _core/hooks/           # useAuth hook (auth state)
│       ├── components/            # Reusable UI components
│       │   ├── AuthGate.tsx       # App-level auth + whitelist enforcement
│       │   ├── ContactCard.tsx    # Contact card for the network grid
│       │   ├── ContactNotes.tsx   # Notes section on profile pages
│       │   ├── Layout.tsx         # Sidebar + header layout
│       │   └── ui/                # shadcn/ui primitives (40+ components)
│       ├── contexts/              # ThemeContext
│       ├── data/
│       │   └── contacts.ts        # All 35 contacts (typed TypeScript)
│       ├── hooks/                 # Custom React hooks
│       ├── lib/
│       │   ├── trpc.ts            # tRPC React client binding
│       │   └── utils.ts           # Tailwind class merging utility
│       ├── pages/
│       │   ├── AdminPanel.tsx     # Admin panel (requests, whitelist, audit log)
│       │   ├── Home.tsx           # Network dashboard with search + group filter
│       │   ├── ProfileDetail.tsx  # Individual contact dossier page
│       │   ├── Rankings.tsx       # VC tier rankings page
│       │   └── RequestAccess.tsx  # Access request form for non-whitelisted users
│       ├── App.tsx                # Router + route definitions
│       ├── index.css              # Global styles + Tailwind theme tokens
│       └── main.tsx               # React root + tRPC/QueryClient providers
│
├── drizzle/                       # Database schema and migrations
│   ├── schema.ts                  # Table definitions (users, whitelist, etc.)
│   ├── relations.ts               # Drizzle relation definitions
│   └── *.sql                      # Generated migration files
│
├── server/                        # Express + tRPC backend
│   ├── _core/                     # Framework plumbing (do not edit)
│   │   ├── context.ts             # tRPC request context (user injection)
│   │   ├── env.ts                 # Environment variable validation
│   │   ├── index.ts               # Express server entry point
│   │   ├── oauth.ts               # Manus OAuth handler
│   │   ├── trpc.ts                # publicProcedure, protectedProcedure, adminProcedure
│   │   └── notification.ts        # notifyOwner() helper
│   ├── db.ts                      # Drizzle query helpers
│   ├── routers.ts                 # All tRPC procedures
│   ├── storage.ts                 # S3 file storage helpers
│   ├── auth.logout.test.ts        # Logout tests
│   ├── access-control.test.ts     # Whitelist + access request tests
│   └── notes-audit.test.ts        # Notes + audit log tests
│
├── shared/                        # Shared types and constants
│   ├── const.ts                   # Shared constants (cookie name, error messages)
│   └── types.ts                   # Shared TypeScript types
│
├── todo.md                        # Project task history
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── vite.config.ts                 # Vite build configuration
├── vitest.config.ts               # Vitest test configuration
└── drizzle.config.ts              # Drizzle ORM configuration
```

---

## Contact Groups & Data Sources

| Group | Count | Data Source |
|---|---|---|
| Colombian Market — VC & Financial Ecosystem | 7 | `colombian_market_profiles.md` — verified profiles with citations |
| General Contacts | 21 | `complete_master_list.md` — LinkedIn URLs, contact info |
| Business Card Contacts | 7 | Individual profile files + `complete_master_list.md` |

The 7 Colombian Market contacts are ranked by a composite VC assessment covering:
- **Capital Access** — direct access to deployable capital
- **Track Record** — history of VC/PE investments and exits
- **Relationships** — network strength and cross-institutional connections

---

## License

Private and confidential. All contact data is proprietary. Not for public distribution.
