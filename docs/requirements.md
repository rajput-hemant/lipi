# Lipi Requirements & Showcase Scope

Canonical product requirements and scope specification for Lipi.

> **Declared Goal:** Lipi is a **portfolio showcase project**, not a commercial product. The implemented Stripe tiers and quota enforcement serve as concrete architectural demonstrations of multi-tenant SaaS billing patterns, without asserting any commercial goal or launching paid offerings.

---

## 1. Intended Users & Target Audience

Lipi is engineered for and evaluated by:

1. **Technical Evaluators & Hiring Managers:** Reviewing full-stack TypeScript engineering, distributed state synchronization (CRDT/Yjs via WebSockets), multi-tenant RBAC security, hierarchical PostgreSQL modeling, and automated test coverage.
2. **Peer Developers & Open-Source Engineers:** Exploring real-world integration patterns for Next.js 16, React 19, BlockNote, Better Auth with shared database schemas, and standalone Hocuspocus servers.
3. **Showcase Visitors & Interactive Testers:** Interacting with a responsive, live collaborative document editor across multiple browser sessions.

---

## 2. Showcase Scope vs. Notion

Lipi focuses on the core collaborative document editing and workspace mechanics of Notion.

### In-Scope (Implemented & Demonstrated)
- **Multi-Tenant Workspaces & RBAC:** Organization into workspaces with strict role-based access control (`owner`, `editor`, `viewer`) and email invitation flows.
- **Nested Block Documents:** Hierarchical document trees with arbitrary parent-child nesting, breadcrumb navigation, reordering, custom icons, and cover presets.
- **Block-Based Rich Text Editor:** BlockNote editor supporting formatted text, headings, alert/callout blocks, checklists, code blocks, and lists.
- **Real-Time Collaboration & Presence:** Sub-second collaborative editing powered by Yjs CRDTs and a standalone Hocuspocus server, with member presence indicators (live cursor positions and names) and read-only viewer enforcement.
- **Document Trash & Lifecycle:** Soft-deletion (`inTrash`), ancestor reconciliation on restore, and permanent deletion with confirmation.
- **Instant Search:** Workspace-scoped command palette (⌘K) searching document titles and content with permission filtering.
- **Asset Uploads:** Secure image, banner, and logo uploads via UploadThing with workspace permission validation.
- **Quota & Billing Infrastructure:** Multi-tier quota enforcement (Free vs. Pro limits on workspaces, collaborators, and blocks) and Stripe checkout/portal/webhook integration.

### Capabilities Beyond Current Showcase Scope (Unimplemented / Unrequested Future Work)
The following capabilities represent functionality beyond the current demonstrated showcase scope and unrequested future work (not established as active requirements):
- **Notion Databases & Multi-View Tables:** Relational databases, kanban boards, calendar/timeline/gallery views, rollups, and formula properties.
- **Public Page Publishing & Custom Domains:** Public web publishing or custom domain mapping for documents; current documents are private to authorized workspace members.
- **Third-Party Integrations & Embeds:** External integrations (Slack, Jira, GitHub, Figma) and public developer API / webhook endpoints.
- **Native Applications:** Desktop (Electron) or native mobile (iOS/Android) applications; Lipi is currently delivered as a responsive web application.
- **Commercial Monetization & Enterprise Infrastructure:** Production payment processing, live customer billing operations, paid support tiers, or enterprise SSO (SAML/SCIM).

---

## 3. Testable Acceptance Criteria & Evidence

Checklist items below are evidence-backed. Items marked `[x]` cite concrete implementation and automated test coverage on `feat/complete-lipi` (or specific referenced branches). Items marked `[ ]` represent planned, unverified, or open operational items.

### 3.1 Authentication & Session Management
- [x] **Shared Database Authentication:** Authenticates users against a shared PostgreSQL database shared with Infinitunes using unprefixed auth tables (`lib/auth/create-auth.ts`, `lib/auth/create-auth.test.ts`, [shared-database-auth](./shared-database-auth.md)).
- [x] **Credential Accounts:** Secure password hashing and credential validation for email/username sign-in (`lib/auth/credential-account.ts`, `lib/auth/credential-account.test.ts`).
- [x] **Auth Rate Limiting:** Protects sign-in and sign-up endpoints against brute force using Upstash Redis rate limiters (`lib/auth/auth-rate-limit.ts`, `lib/auth/auth-rate-limit.test.ts`).
- [x] **Session & Navigation Flow:** Verified end-to-end sign-up, sign-out, sign-in, and initial workspace redirect flow (`tests/e2e/auth-workspace.spec.ts`).
- [ ] **Legacy User Backfill:** Execution of Infinitunes' `BACKFILL_ALL` on the production shared database remains an open operational prerequisite for legacy NextAuth users ([shared-database-auth](./shared-database-auth.md)).

### 3.2 Workspaces, Roles & Invites
- [x] **Role Hierarchy & Permissions:** Enforces three discrete roles (`owner`, `editor`, `viewer`) across seven granular permissions (`workspace:read`, `document:read`, `document:write`, `member:manage`, `workspace:settings`, `workspace:transfer`, `workspace:delete`) (`lib/workspace/permissions.ts`, `lib/workspace/permissions.test.ts`, `lib/workspace/authorization-matrix.test.ts`).
- [x] **Email Invites:** Generates unique invite tokens, prevents duplicate active invites, and restricts invite visibility to managers (`lib/workspace/workspace-invites.ts`, `lib/workspace/workspace-invites.test.ts`, migration `0009_workspace_roles_invites.sql`, `0010_workspace_invite_email_unique.sql`).
- [x] **End-to-End Invite & Role Assignment:** Verified inviting editor and viewer members via email and token acceptance in multi-context browser tests (`tests/e2e/collaboration.spec.ts`).
- [x] **Collaborator Quotas:** Enforces collaborator limits based on active workspace tier (`lib/db/queries/workspace-member-quota.ts`, `lib/db/queries/workspace-members.quota.test.ts`).

### 3.3 Nested Block Documents
- [x] **BlockNote Editor Integration:** Rich-text block editing with custom callout/alert blocks and custom styling (`components/document-editor/`, `lib/block-editor/editor-schema.ts`, `lib/block-editor/alert-block.tsx`).
- [x] **Hierarchical Document Trees:** Nested parent-child document relationships in PostgreSQL with cycle detection and cross-workspace validation (`lib/db/document-operations.ts`, `lib/db/document-operations.test.ts`, `lib/db/documents-tree.ts`).
- [x] **Sidebar Tree Navigation:** Dynamic sidebar document tree with collapsible folder triggers and document navigation (`components/sidebar/document-tree-utils.test.ts`, `components/sidebar/folder-accordion-trigger.test.tsx`).
- [x] **End-to-End Page & Subpage Creation:** Verified creating parent pages, nesting subpages, and typing in BlockNote (`tests/e2e/documents-editor.spec.ts`).

### 3.4 Document Trash & Lifecycle
- [x] **Soft-Delete Architecture:** Documents are soft-deleted via `inTrash` flag with cascade handling and restore target collection (`lib/db/document-operations.ts`, `lib/db/document-operations.test.ts`, `lib/db/client-document-state.ts`).
- [x] **Permanent Delete Authorization:** Restricts permanent document deletion to authorized workspace roles with correct dependency ordering (`lib/db/document-operations.ts`, `lib/db/document-operations.test.ts`).
- [x] **Trash UI Polish:** Responsive dialog layout, `size-4 shrink-0` fallback icon, accessible labels (`Restore ${title}` / `Delete ${title} permanently`), and confirmation dialog (`components/trash.tsx`, `components/trash.test.tsx`).

### 3.5 Search & File Uploads
- [x] **Workspace Search Command:** Command palette dialog (⌘K / Ctrl+K) with debounced input, keyboard selection, and error handling (`components/search-command.tsx`, `components/search-command.test.tsx`, `lib/search/search-utils.test.ts`).
- [x] **Search Authorization:** Database queries enforce user authentication, workspace `document:read` permission, and filter out trashed documents (`lib/db/queries/search.ts`, `lib/db/queries/search.test.ts`).
- [x] **Upload Router & RBAC Middleware:** UploadThing router endpoints (`documentImage`, `coverBanner`, `workspaceLogo`) validating authentication and required permissions (`document:write` or `workspace:settings`) (`app/api/uploadthing/core.ts`, `app/api/uploadthing/core.test.ts`).
- [ ] **Live Binary Upload Delivery:** Verified via unit mocks; live end-to-end binary transfer to external UploadThing storage in a running browser environment requires external service credentials (`UPLOADTHING_TOKEN`).

### 3.6 Real-Time Collaboration
- [x] **Standalone Realtime Server:** Dedicated Hocuspocus 4.7.0 server with Yjs CRDT synchronization and PostgreSQL persistence (`realtime/server.ts`, `realtime/bootstrap.mjs`, [realtime](./realtime.md)).
- [x] **Signed Room Tokens:** Cryptographic HMAC tokens with 60-second expiration and 30-second refresh cadence scoped to document or workspace rooms (`lib/realtime/token.ts`, `lib/realtime/token.test.ts`, `app/api/realtime/token/route.ts`).
- [x] **Room Authorization & Viewer Enforcement:** Validates session and workspace membership on connection and synchronization; enforces read-only access for viewers (`lib/realtime/authorize-room.ts`, `lib/realtime/authorize-room.test.ts`).
- [x] **Authoritative State Snapshots:** Yjs document state in `lipi_realtime_documents.state` serves as editing truth, with debounced snapshots written to `documents.content` (`lib/realtime/authoritative-content.ts`, `lib/realtime/authoritative-content.test.ts`).
- [x] **End-to-End Multi-Client Synchronization:** Verified simultaneous multi-user editing, cursor presence, and viewer write rejection in a 3-context browser session (`tests/e2e/collaboration.spec.ts`).
- [ ] **Production Realtime Endpoint Topology:** Architectural choice between single cookie-owning host vs. separate host with `wss://` and signed token remains an open deployment decision ([research note](./research/realtime-collaboration.md)).

### 3.7 Plan Quotas & Stripe Billing Demonstration
- [x] **Free vs. Pro Quota Model:** Purely operational showcase quotas: Free plan allows 1 workspace, 2 collaborators, and 500 blocks; Pro plan allows unlimited (`lib/billing/plan-quotas.ts`, `lib/billing/plan-quotas.test.ts`, `lib/billing/quota-entitlement.test.ts`).
- [x] **Subscription Entitlement:** Maps active and trialing subscriptions to Pro tier privileges (`lib/billing/entitlement.ts`, `lib/billing/entitlement.test.ts`).
- [x] **Checkout Redirection:** End-to-end verified checkout session flow redirecting user to Stripe Checkout with mocked billing API (`app/api/stripe/checkout/route.ts`, `tests/e2e/stripe-checkout.spec.ts`).
- [x] **Stripe Webhook Synchronization:** Validates Stripe signatures and updates subscription status in `lipi_subscriptions` (`lib/stripe/webhook-verify.ts`, `lib/stripe/webhook-handlers.ts`, `lib/stripe/subscription-sync.ts`, `lib/stripe/*.test.ts`).
- [ ] **Live Commercial Payment Processing:** Mocked in automated tests; production billing endpoints and live payment collection are intentionally unconfigured, consistent with showcase status.

---

## 4. Open Architectural & Operational Decisions

The following items are tracked as open and require operational execution or infrastructure decisions prior to production deployment:

1. **Shared Database Migration & Backfill (`BACKFILL_ALL`):**
   - Infinitunes owns unprefixed auth tables. Legacy user migration (`packages/db/src/backfill.ts` on `migration/bun-monorepo`) must be executed against the shared database before legacy users can log in ([shared-database-auth](./shared-database-auth.md)).
2. **Production Realtime Server Host Arrangement:**
   - Decision remains open between:
     - **Option A:** Same cookie-owning host running Next.js and Hocuspocus behind a reverse proxy.
     - **Option B:** Separate WebSocket host terminating `wss://` using short-lived signed tokens ([research note](./research/realtime-collaboration.md)).
