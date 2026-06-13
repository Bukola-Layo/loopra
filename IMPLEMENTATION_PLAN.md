# Loopra Implementation Plan

**Document Version:** 1.0  
**Date:** June 8, 2026  
**Status:** Planning Phase - Ready for Review  
**Target Audience:** Senior Development Team

---

## Executive Summary

Loopra is a communication automation platform positioned between Beehiiv, ConvertKit, Mailchimp, and Substack. Unlike competitors, Loopra emphasizes **simplicity, beginner-friendly automation, and guided UX**. This document outlines the complete implementation strategy for MVP through Phase 8 (Production Readiness).

**Key Differentiators:**
- Guided, low-friction automation workflows ("Loops")
- AI-assisted newsletter generation
- Form builder with simple embedding
- Audience segmentation without complexity
- Flutterwave payment integration for African markets

---

## 1. SYSTEM ARCHITECTURE

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE NETWORK                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         NEXT.JS FRONTEND (App Router)                │   │
│  │  ┌──────────┐  ┌─────────┐  ┌──────────────────────┐ │   │
│  │  │Dashboard │  │Auth     │  │Marketing Site        │ │   │
│  │  │(Protected)   │Pages   │  │(Landing, Pricing)    │ │   │
│  │  └──────────┘  └─────────┘  └──────────────────────┘ │   │
│  │  ┌──────────┐  ┌─────────┐  ┌──────────────────────┐ │   │
│  │  │Forms/    │  │Campaign │  │Form Embed Loader     │ │   │
│  │  │Embeds    │  │Editor   │  │(Public, No Auth)     │ │   │
│  │  └──────────┘  └─────────┘  └──────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      NEXT.JS ROUTE HANDLERS (API Routes)             │   │
│  │  ┌──────┐ ┌────────┐ ┌──────┐ ┌─────────────────┐   │   │
│  │  │Auth  │ │Audience│ │Forms │ │Webhooks         │   │   │
│  │  │      │ │        │ │      │ │(Flutterwave)    │   │   │
│  │  └──────┘ └────────┘ └──────┘ └─────────────────┘   │   │
│  │  ┌──────┐ ┌────────┐ ┌──────┐ ┌─────────────────┐   │   │
│  │  │Email │ │Loops   │ │AI    │ │Analytics        │   │   │
│  │  │      │ │        │ │      │ │                 │   │   │
│  │  └──────┘ └────────┘ └──────┘ └─────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐ ┌───────────┐
        │PostgreSQL│  │Resend    │ │Flutterwave│
        │Database  │  │(Email)   │ │(Payments) │
        └──────────┘  └──────────┘ └───────────┘
              │
              ▼
        ┌──────────────┐
        │Vercel Blob   │
        │(Storage)     │
        └──────────────┘
```

### 1.2 Frontend Architecture

**Technology:** Next.js 14+ App Router, TypeScript, React Server Components, Tailwind CSS, shadcn/ui

**Rendering Strategy:**
- Server Components by default (data fetching, layouts)
- Client Components (`"use client"`) only for interactivity and browser APIs
- Streaming for improved perceived performance
- Static generation for marketing pages

**State Management:**
- URL state (searchParams) for filters, pagination, tabs
- React state (useState) for local UI ephemeral state
- React Context for auth session and theme (global-only)
- React Query / TanStack Query for server state and caching
- No Redux/Zustand unless clear necessity arises

**Component Organization:**
```
components/
  ├── ui/                    # Primitive design system (from shadcn/ui)
  ├── shared/                # Cross-feature reusable components
  ├── layout/                # Page layouts, sidebars
  ├── forms/                 # Form components and builders
  ├── data-tables/           # Reusable table components
  ├── analytics/             # Analytics/chart components
  ├── dashboard/             # Dashboard-specific components
  ├── campaigns/             # Campaign editor components
  ├── loops/                 # Loop builder components
  └── embeds/                # Form embed components
```

### 1.3 Backend Architecture

**Technology:** Next.js Route Handlers, TypeScript (strict mode), Prisma ORM, PostgreSQL

**API Layer:**
- RESTful endpoints under `app/api/`
- All inputs validated with Zod before DB/service access
- Structured JSON error responses with HTTP status codes
- Authenticated session derived from NextAuth.js

**Service Layer:**
```
lib/
  ├── db.ts                  # Prisma singleton
  ├── auth.ts                # Session helpers
  ├── resend.ts              # Email service
  ├── flutterwave.ts         # Payment helpers
  ├── ai.ts                  # AI generation (OpenAI/Anthropic)
  ├── analytics.ts           # Analytics event tracking
  ├── loops-engine.ts        # Loop execution logic
  └── utils.ts               # General utilities
```

**Data Access Pattern:**
- Database queries flow through Prisma via `lib/db.ts` singleton
- Multi-step writes use `prisma.$transaction([])`
- DTOs map Prisma models before sending to client
- No raw Prisma models exposed to frontend

### 1.4 Service Layer Architecture

**Core Services:**

| Service | Responsibility | Tech |
|---|---|---|
| **Auth Service** | Session mgmt, signup, login, password reset, email verification | NextAuth.js |
| **Email Service** | Send campaigns, transactional emails, tracking webhooks | Resend + custom tracking |
| **Loop Engine** | Trigger evaluation, delay scheduling, condition logic, retry | Node.js + cron (or Bull queue) |
| **AI Service** | Newsletter generation, subject lines, tone selection, templates | OpenAI/Anthropic API |
| **Form Service** | Build, validate, embed generation, subscriber capture | Custom logic |
| **Analytics Service** | Event tracking, aggregation, dashboard metrics | PostHog or custom |
| **Billing Service** | Subscription mgmt, payment processing, webhook handling | Flutterwave |
| **Audience Service** | Subscriber CRUD, segmentation, tagging, deduplication | Prisma + business logic |

### 1.5 Database Architecture

**Multi-Tenant Design:**
- Every table includes `workspaceId` as the primary tenant identifier
- Row-level security enforced in code (query filters by workspaceId)
- Single database serves all customers (cost-efficient, data isolation via queries)

**Core Entity Groups:**

1. **Authentication & Identity**
   - `users` — user accounts
   - `accounts` — OAuth credentials
   - `sessions` — active sessions
   - `workspaces` — organization/workspace
   - `workspaceMembers` — role assignments

2. **Audience & Subscribers**
   - `subscribers` — email addresses + metadata
   - `subscriberTags` — tagging system
   - `subscriberSegments` — segment membership
   - `segments` — audience segments
   - `subscriberHistory` — engagement history

3. **Forms**
   - `forms` — form definitions
   - `formFields` — fields within forms
   - `formSubmissions` — subscriber sign-ups via forms
   - `formEmbeds` — embed scripts and tracking

4. **Campaigns**
   - `campaigns` — newsletter sends
   - `campaignDrafts` — in-progress campaigns
   - `campaignVariants` — A/B test variants
   - `campaignSends` — individual send records
   - `campaignEvents` — opens, clicks, bounces

5. **Loops (Automation)**
   - `loops` — automation workflows
   - `loopTriggers` — workflow triggers
   - `loopActions` — workflow steps/actions
   - `loopExecutions` — runtime instances
   - `loopEventLogs` — execution audit trail

6. **Templates**
   - `templates` — saved campaign templates
   - `templateCategories` — organization

7. **Analytics & Events**
   - `analyticsEvents` — raw events (opens, clicks, etc.)
   - `analyticsSummaries` — pre-aggregated metrics

8. **Billing & Payments**
   - `subscriptionPlans` — plan definitions
   - `subscriptions` — active subscriptions
   - `payments` — payment records
   - `paymentWebhooks` — webhook logs

9. **AI & Content**
   - `aiGenerations` — history of AI requests (for cost tracking)
   - `aiPrompts` — saved prompt templates

### 1.6 Email Architecture

**Resend Integration:**
- Transactional emails (signup verification, password reset, campaign sends)
- Tracking via pixel tags (opens) and link rewrites (clicks)
- Webhook listeners for bounces, complaints, deliveries
- Custom webhook verification (HMAC-SHA256)

**Campaign Sending Flow:**
1. User schedules/sends campaign
2. Campaign marked as `pending_send`
3. Background job queries campaign + segments
4. Resend batch API sends to all subscribers
5. Resend webhooks report opens, clicks, bounces
6. Events aggregated into campaign analytics

**Unsubscribe Handling:**
- Unsubscribe links cryptographically signed (HMAC)
- One-click unsubscribe RFC 8058
- Soft-delete vs hard-delete configurable per workspace

### 1.7 AI Architecture

**Capabilities (Phase 5):**
- AI newsletter generation from topic/outline
- Subject line generation
- Tone adjustment (professional, casual, funny)
- Template suggestions

**Integration:**
- Call OpenAI or Anthropic API from route handler
- Cache popular prompts to reduce API calls
- Cost tracking per workspace (for billing/rate limiting)
- Configurable model (GPT-4, Claude, etc.)

**Prompt Management:**
```ts
// lib/ai.ts
export async function generateNewsletter(
  topic: string,
  tone: "professional" | "casual" | "funny",
  workspaceId: string
): Promise<{ content: string; subject: string }> {
  const model = "gpt-4";
  const prompt = buildPrompt(topic, tone);
  
  // Track cost for billing
  const result = await openai.chat.completions.create({ ... });
  await trackAICost(workspaceId, result.usage.prompt_tokens);
  
  return { content: result.choices[0].message.content, ... };
}
```

### 1.8 Billing Architecture

**Flutterwave Integration:**

1. **Checkout Flow:**
   - User selects plan
   - Frontend redirects to Flutterwave hosted checkout
   - Flutterwave redirects back with reference
   - Backend verifies payment with Flutterwave API

2. **Webhook Processing:**
   - Flutterwave POSTs to `/api/webhooks/flutterwave`
   - Signature verified (HMAC-SHA256)
   - Payment status updated in `payments` table
   - `subscriptions` table updated
   - User features unlocked based on plan

3. **Subscription Plans:**
   - Free: 1,000 subscribers, 1 form, basic analytics
   - Starter: 10K subscribers, 5 forms, Loops, $9/mo
   - Pro: 100K subscribers, unlimited forms, AI, $49/mo
   - Enterprise: custom

4. **Billing Events:**
   - Successful payment → subscription active
   - Failed payment → retry logic (3 attempts)
   - Cancelled subscription → features downgraded
   - Exceeded limits → soft-block or upgrade prompt

### 1.9 Analytics Architecture

**Event Types:**
- `subscriber.created` — new subscriber via form/API
- `subscriber.unsubscribed`
- `campaign.sent` — campaign sent to X subscribers
- `campaign.opened` — subscriber opened email
- `campaign.clicked` — subscriber clicked link
- `campaign.bounced` — email bounced
- `form.submitted` — form filled out
- `loop.triggered` — automation triggered
- `loop.executed` — automation completed

**Aggregation:**
- Raw events stored in `analyticsEvents` table
- Nightly batch job pre-aggregates into `analyticsSummaries`
- Dashboard queries pre-aggregated data (faster)
- Real-time events available via Resend webhooks

---

## 2. DOMAIN BREAKDOWN

### 2.1 Authentication Domain

**Responsibilities:**
- User signup, login, password reset
- Email verification
- Session management
- Role-based access control (Owner, Admin, Member)

**Entities:**
- `users` (id, email, password, emailVerified)
- `accounts` (provider, providerAccountId)
- `sessions` (token, expiresAt)
- `workspaces` (id, name, ownerId)
- `workspaceMembers` (userId, workspaceId, role)

**APIs:**
- `POST /api/auth/signup` — Create new account
- `POST /api/auth/login` — Session login
- `POST /api/auth/logout` — Destroy session
- `POST /api/auth/verify-email` — Verify email token
- `POST /api/auth/password-reset` — Send reset link
- `PATCH /api/auth/password` — Update password
- `GET /api/auth/session` — Current session

**UI Screens:**
- Signup page (email, password, terms)
- Login page
- Email verification page
- Forgot password page
- Reset password page
- Onboarding wizard (create workspace, set preferences)

---

### 2.2 Users & Workspace Domain

**Responsibilities:**
- User profile management
- Workspace administration
- Team member invitations and role management
- Workspace settings (logo, name, billing contact)

**Entities:**
- `users` (profile, notifications preferences)
- `workspaces` (settings, logo, branding)
- `workspaceMembers` (role, joinedAt, invitedAt)
- `workspaceInvitations` (email, role, expiresAt)

**APIs:**
- `GET /api/users/me` — Current user profile
- `PATCH /api/users/me` — Update profile
- `GET /api/workspaces` — List user's workspaces
- `PATCH /api/workspaces/[id]` — Update workspace settings
- `POST /api/workspaces/[id]/members` — Invite member
- `PATCH /api/workspaces/[id]/members/[memberId]` — Update role
- `DELETE /api/workspaces/[id]/members/[memberId]` — Remove member

**UI Screens:**
- User profile/account settings
- Workspace settings
- Team member list and invitations
- Workspace switcher

---

### 2.3 Audience Domain

**Responsibilities:**
- Subscriber CRUD operations
- Bulk import/export
- Subscriber metadata and tagging
- Subscriber history and engagement tracking

**Entities:**
- `subscribers` (workspaceId, email, firstName, lastName, tags, customFields, createdAt)
- `subscriberTags` (subscriberId, tag)
- `subscriberHistory` (subscriberId, action, campaignId, timestamp)

**APIs:**
- `GET /api/audience` — List subscribers (paginated, filterable)
- `GET /api/audience/[id]` — Get single subscriber
- `POST /api/audience` — Create/import subscriber
- `PATCH /api/audience/[id]` — Update subscriber
- `DELETE /api/audience/[id]` — Delete subscriber
- `POST /api/audience/bulk-import` — CSV upload
- `POST /api/audience/export` — Generate export file

**UI Screens:**
- Audience overview (count, growth chart, segmentation)
- Subscriber list/table (sortable, filterable, searchable)
- Subscriber detail card (engagement history, tags, custom fields)
- Import subscribers (CSV uploader with mapping)
- Export interface

---

### 2.4 Segments Domain

**Responsibilities:**
- Segment creation based on filters
- Dynamic segment evaluation
- Segment membership CRUD

**Entities:**
- `segments` (workspaceId, name, criteria, createdAt)
- `segmentMembers` (segmentId, subscriberId) — denormalized for performance

**APIs:**
- `GET /api/segments` — List segments
- `POST /api/segments` — Create segment
- `PATCH /api/segments/[id]` — Update criteria
- `DELETE /api/segments/[id]` — Delete segment
- `GET /api/segments/[id]/members` — Get members in segment

**UI Screens:**
- Segment builder (UI to define filters: tag=founder, campaignsOpened>5, etc.)
- Segment list
- Segment detail (member preview, engagement metrics)

---

### 2.5 Forms Domain

**Responsibilities:**
- Form template creation
- Form field definition
- Embed generation (HTML snippet)
- Hosted form pages
- Form submission capture
- Spam prevention (CAPTCHA, honeypot)

**Entities:**
- `forms` (workspaceId, name, fields[], settings, createdAt)
- `formFields` (formId, label, type, required, position)
- `formSubmissions` (formId, data, ipAddress, timestamp)
- `formEmbeds` (formId, code, viewCount, conversionCount)

**APIs:**
- `GET /api/forms` — List forms
- `POST /api/forms` — Create form
- `PATCH /api/forms/[id]` — Update form
- `DELETE /api/forms/[id]` — Delete form
- `POST /api/forms/[id]/embed` — Generate embed code
- `POST /api/embed/forms/[formId]` — Public: Submit form (no auth required)

**UI Screens:**
- Form builder (drag-drop interface for fields)
- Form list
- Form settings (auto-tagging, confirmations, redirects)
- Embed code generator (copy, preview)
- Form analytics (submissions over time, conversion rate)

---

### 2.6 Newsletter Campaigns Domain

**Responsibilities:**
- Campaign creation and editing
- Campaign scheduling and sending
- Template management
- Campaign analytics and tracking

**Entities:**
- `campaigns` (workspaceId, title, subject, content, status, sendAt, createdAt)
- `campaignDrafts` (autosave versions)
- `campaignVariants` (A/B test versions)
- `campaignSends` (sendId, subscriberId, sendAt, openedAt, clickedAt)
- `campaignEvents` (campaignId, subscriberId, eventType, timestamp)

**APIs:**
- `GET /api/campaigns` — List campaigns
- `POST /api/campaigns` — Create campaign
- `PATCH /api/campaigns/[id]` — Update (draft status only)
- `POST /api/campaigns/[id]/send` — Send immediately
- `POST /api/campaigns/[id]/schedule` — Schedule send
- `DELETE /api/campaigns/[id]` — Delete campaign
- `GET /api/campaigns/[id]/analytics` — Campaign metrics
- `POST /api/campaigns/[id]/duplicate` — Clone campaign

**UI Screens:**
- Campaign list (status, send date, open rate, click rate)
- Campaign editor (WYSIWYG or HTML mode, template selector)
- Send confirmation (segment selection, timing preview)
- Campaign analytics dashboard (opens, clicks, bounces, unsubscribes)

---

### 2.7 Automation Loops Domain

**Responsibilities:**
- Loop creation and trigger setup
- Action sequencing (email, delay, conditional)
- Execution engine and scheduling
- Retry logic and failure handling

**Entities:**
- `loops` (workspaceId, name, trigger, status, createdAt)
- `loopTriggers` (loopId, type: "form_submission" | "tag_added" | "subscriber_created", config)
- `loopActions` (loopId, sequence, type: "email" | "delay" | "condition" | "tag", config)
- `loopExecutions` (loopId, subscriberId, startedAt, completedAt, status)
- `loopEventLogs` (executionId, actionId, status, error, timestamp)

**APIs:**
- `GET /api/loops` — List loops
- `POST /api/loops` — Create loop
- `PATCH /api/loops/[id]` — Update loop
- `DELETE /api/loops/[id]` — Delete loop
- `POST /api/loops/[id]/publish` — Activate loop
- `POST /api/loops/[id]/pause` — Pause loop
- `GET /api/loops/[id]/executions` — View past executions

**UI Screens:**
- Loop builder (visual canvas: trigger → actions → outcomes)
- Loop list (active, paused, drafts)
- Loop settings (trigger config, error handling)
- Execution logs (debug view for troubleshooting)

---

### 2.8 Templates Domain

**Responsibilities:**
- Template library management
- Template categories and search
- Template usage tracking

**Entities:**
- `templates` (workspaceId, name, category, content, thumbnail, createdAt)
- `templateCategories` (workspaceId, name)

**APIs:**
- `GET /api/templates` — List templates
- `POST /api/templates` — Create template
- `PATCH /api/templates/[id]` — Update template
- `DELETE /api/templates/[id]` — Delete template

**UI Screens:**
- Template gallery (searchable, filterable by category)
- Template editor
- Template preview

---

### 2.9 Analytics Domain

**Responsibilities:**
- Event capture and aggregation
- Dashboard metrics computation
- Report generation

**Entities:**
- `analyticsEvents` (workspaceId, eventType, resourceId, data, timestamp)
- `analyticsSummaries` (workspaceId, date, metric, value) — pre-aggregated

**APIs:**
- `GET /api/analytics/dashboard` — Summary metrics
- `GET /api/analytics/campaigns` — Campaign performance
- `GET /api/analytics/subscribers` — Subscriber growth
- `GET /api/analytics/forms` — Form conversion rates
- `GET /api/analytics/export` — Generate report

**UI Screens:**
- Dashboard (KPIs: subscribers, open rate, click rate, revenue)
- Campaign performance breakdown
- Subscriber growth chart and trends
- Form conversion analytics

---

### 2.10 Billing Domain

**Responsibilities:**
- Subscription plan management
- Checkout and payment processing
- Invoice generation
- Usage tracking and enforcement

**Entities:**
- `subscriptionPlans` (name, price, features, limits)
- `subscriptions` (workspaceId, planId, startDate, renewalDate, status)
- `payments` (subscriptionId, amount, status, reference, createdAt)
- `paymentWebhooks` (reference, status, rawData)

**APIs:**
- `GET /api/billing/plans` — List available plans
- `POST /api/billing/checkout` — Initiate payment
- `POST /api/webhooks/flutterwave` — Payment webhook
- `GET /api/billing/subscription` — Current subscription
- `POST /api/billing/upgrade` — Upgrade plan
- `POST /api/billing/cancel` — Cancel subscription

**UI Screens:**
- Pricing page (feature matrix, plan selector)
- Checkout (form or redirect to Flutterwave)
- Billing dashboard (current plan, renewal date, invoices)
- Plan upgrade/downgrade modal

---

## 3. DATABASE DESIGN

### 3.1 Complete ERD (Text Format)

```
USERS
├── id (PK, UUID)
├── email (UNIQUE, NOT NULL)
├── password (hashed, NOT NULL)
├── firstName (VARCHAR)
├── lastName (VARCHAR)
├── emailVerified (TIMESTAMP, nullable)
├── image (VARCHAR, nullable)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

WORKSPACES
├── id (PK, UUID)
├── ownerId (FK -> users.id)
├── name (VARCHAR, NOT NULL)
├── logo (VARCHAR, nullable)
├── domain (VARCHAR, unique, nullable)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

WORKSPACE_MEMBERS
├── id (PK, UUID)
├── workspaceId (FK -> workspaces.id)
├── userId (FK -> users.id)
├── role (ENUM: owner, admin, member)
├── joinedAt (TIMESTAMP)
├── UNIQUE (workspaceId, userId)

ACCOUNTS (OAuth)
├── id (PK, UUID)
├── userId (FK -> users.id)
├── type (VARCHAR: "oauth")
├── provider (VARCHAR)
├── providerAccountId (VARCHAR)
├── UNIQUE (provider, providerAccountId)

SESSIONS
├── id (PK, UUID)
├── userId (FK -> users.id)
├── expires (TIMESTAMP)
├── sessionToken (VARCHAR, UNIQUE)

SUBSCRIBERS
├── id (PK, UUID)
├── workspaceId (FK -> workspaces.id)
├── email (VARCHAR, NOT NULL)
├── firstName (VARCHAR, nullable)
├── lastName (VARCHAR, nullable)
├── status (ENUM: active, unsubscribed, bounced)
├── customFields (JSONB)
├── lastEngagedAt (TIMESTAMP, nullable)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)
├── INDEX (workspaceId, email)
├── INDEX (workspaceId, status)
├── UNIQUE (workspaceId, email)

SUBSCRIBER_TAGS
├── id (PK, UUID)
├── subscriberId (FK -> subscribers.id)
├── tag (VARCHAR)
├── INDEX (subscriberId, tag)

SEGMENTS
├── id (PK, UUID)
├── workspaceId (FK -> workspaces.id)
├── name (VARCHAR, NOT NULL)
├── criteria (JSONB) -- filters: {tags: ["founder"], openedCampaigns: {">": 5}}
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

SEGMENT_MEMBERS (denormalized for fast queries)
├── id (PK, UUID)
├── segmentId (FK -> segments.id)
├── subscriberId (FK -> subscribers.id)
├── INDEX (segmentId, subscriberId)

FORMS
├── id (PK, UUID)
├── workspaceId (FK -> workspaces.id)
├── name (VARCHAR, NOT NULL)
├── description (TEXT, nullable)
├── settings (JSONB) -- autoTag, redirectUrl, confirmationMessage, etc.
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

FORM_FIELDS
├── id (PK, UUID)
├── formId (FK -> forms.id)
├── label (VARCHAR, NOT NULL)
├── type (ENUM: text, email, select, checkbox, textarea)
├── required (BOOLEAN)
├── position (INT)
├── validation (JSONB, nullable)

FORM_SUBMISSIONS
├── id (PK, UUID)
├── formId (FK -> forms.id)
├── subscriberId (FK -> subscribers.id, nullable)
├── data (JSONB) -- form field values
├── ipAddress (VARCHAR, nullable)
├── timestamp (TIMESTAMP)

CAMPAIGNS
├── id (PK, UUID)
├── workspaceId (FK -> workspaces.id)
├── title (VARCHAR, NOT NULL)
├── subject (VARCHAR, NOT NULL)
├── content (TEXT) -- HTML or Markdown
├── contentType (ENUM: html, markdown)
├── templateId (FK -> templates.id, nullable)
├── status (ENUM: draft, scheduled, sent, sending)
├── sendAt (TIMESTAMP, nullable)
├── sentAt (TIMESTAMP, nullable)
├── recipientCount (INT, default 0)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)
├── INDEX (workspaceId, status)

CAMPAIGN_SENDS
├── id (PK, UUID)
├── campaignId (FK -> campaigns.id)
├── subscriberId (FK -> subscribers.id)
├── sentAt (TIMESTAMP)
├── openedAt (TIMESTAMP, nullable)
├── clickedAt (TIMESTAMP, nullable)
├── bounced (BOOLEAN, default false)
├── unsubscribed (BOOLEAN, default false)
├── INDEX (campaignId, subscriberId)

CAMPAIGN_EVENTS
├── id (PK, UUID)
├── campaignId (FK -> campaigns.id)
├── subscriberId (FK -> subscribers.id)
├── eventType (ENUM: opened, clicked, bounced, complained)
├── linkClicked (VARCHAR, nullable)
├── timestamp (TIMESTAMP)
├── INDEX (campaignId, eventType)

LOOPS
├── id (PK, UUID)
├── workspaceId (FK -> workspaces.id)
├── name (VARCHAR, NOT NULL)
├── description (TEXT, nullable)
├── status (ENUM: draft, active, paused)
├── triggerId (FK -> loop_triggers.id)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)
├── INDEX (workspaceId, status)

LOOP_TRIGGERS
├── id (PK, UUID)
├── loopId (FK -> loops.id)
├── type (ENUM: form_submission, tag_added, subscriber_created, campaign_opened, campaign_clicked)
├── config (JSONB) -- {formId, tagName, campaignId, etc.}
├── createdAt (TIMESTAMP)

LOOP_ACTIONS
├── id (PK, UUID)
├── loopId (FK -> loops.id)
├── sequence (INT) -- order in workflow
├── type (ENUM: send_email, delay, apply_tag, remove_tag, condition, webhook)
├── config (JSONB) -- {emailBody, delayDays, tagName, condition, etc.}
├── createdAt (TIMESTAMP)

LOOP_EXECUTIONS
├── id (PK, UUID)
├── loopId (FK -> loops.id)
├── subscriberId (FK -> subscribers.id)
├── triggeredAt (TIMESTAMP)
├── startedAt (TIMESTAMP, nullable)
├── completedAt (TIMESTAMP, nullable)
├── status (ENUM: pending, running, completed, failed)
├── lastError (TEXT, nullable)
├── INDEX (loopId, subscriberId, status)

LOOP_EVENT_LOGS
├── id (PK, UUID)
├── executionId (FK -> loop_executions.id)
├── actionId (FK -> loop_actions.id)
├── status (ENUM: pending, executing, completed, failed)
├── result (JSONB, nullable)
├── error (TEXT, nullable)
├── timestamp (TIMESTAMP)

TEMPLATES
├── id (PK, UUID)
├── workspaceId (FK -> workspaces.id)
├── name (VARCHAR, NOT NULL)
├── category (VARCHAR, nullable)
├── content (TEXT)
├── thumbnail (VARCHAR, nullable)
├── isPublished (BOOLEAN, default false)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

SUBSCRIPTION_PLANS
├── id (PK, UUID)
├── name (VARCHAR, NOT NULL)
├── slug (VARCHAR, UNIQUE)
├── price (DECIMAL)
├── currency (VARCHAR, default "USD")
├── billingCycle (ENUM: monthly, yearly)
├── features (JSONB)
├── limits (JSONB) -- {subscribers: 10000, forms: 5, campaignsPerMonth: 100}
├── createdAt (TIMESTAMP)

SUBSCRIPTIONS
├── id (PK, UUID)
├── workspaceId (FK -> workspaces.id)
├── planId (FK -> subscription_plans.id)
├── status (ENUM: active, cancelled, past_due)
├── currentPeriodStart (TIMESTAMP)
├── currentPeriodEnd (TIMESTAMP)
├── cancelledAt (TIMESTAMP, nullable)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)
├── INDEX (workspaceId, status)

PAYMENTS
├── id (PK, UUID)
├── subscriptionId (FK -> subscriptions.id)
├── amount (DECIMAL)
├── currency (VARCHAR)
├── status (ENUM: pending, success, failed, refunded)
├── flutterwaveReference (VARCHAR, UNIQUE, nullable)
├── createdAt (TIMESTAMP)
├── updatedAt (TIMESTAMP)

ANALYTICS_EVENTS
├── id (PK, UUID)
├── workspaceId (FK -> workspaces.id)
├── eventType (VARCHAR)
├── resourceId (UUID, nullable)
├── resourceType (VARCHAR, nullable)
├── metadata (JSONB)
├── timestamp (TIMESTAMP)
├── INDEX (workspaceId, eventType, timestamp)

ANALYTICS_SUMMARIES (denormalized, refreshed nightly)
├── id (PK, UUID)
├── workspaceId (FK -> workspaces.id)
├── date (DATE)
├── metric (VARCHAR)
├── value (DECIMAL)
├── INDEX (workspaceId, date, metric)
```

### 3.2 Indexing Strategy

**Critical Indexes:**
```sql
-- Subscriber lookup and filtering
CREATE INDEX idx_subscribers_workspace_email ON subscribers(workspaceId, email);
CREATE INDEX idx_subscribers_workspace_status ON subscribers(workspaceId, status);
CREATE INDEX idx_subscriber_tags_subscriber ON subscriber_tags(subscriberId);

-- Campaign queries
CREATE INDEX idx_campaigns_workspace_status ON campaigns(workspaceId, status);
CREATE INDEX idx_campaign_sends_campaign_subscriber ON campaign_sends(campaignId, subscriberId);
CREATE INDEX idx_campaign_events_campaign_type ON campaign_events(campaignId, eventType);

-- Loop execution monitoring
CREATE INDEX idx_loop_executions_loop_status ON loop_executions(loopId, status);
CREATE INDEX idx_loop_event_logs_execution ON loop_event_logs(executionId);

-- Analytics aggregation
CREATE INDEX idx_analytics_events_workspace_timestamp ON analyticsEvents(workspaceId, timestamp);

-- Multi-tenant security
CREATE INDEX idx_forms_workspace ON forms(workspaceId);
CREATE INDEX idx_segments_workspace ON segments(workspaceId);
```

### 3.3 Audit Fields

All tables include:
- `createdAt` (TIMESTAMP, auto-populated)
- `updatedAt` (TIMESTAMP, auto-updated on record modification)
- Optional: `deletedAt` (TIMESTAMP, nullable) for soft deletes where applicable

### 3.4 Multi-Tenant Isolation Strategy

**Data Isolation Pattern:**
```sql
-- Every query filters by workspaceId
SELECT * FROM subscribers 
WHERE workspaceId = $1 AND status = 'active';

-- Foreign keys prevent cross-tenant access
ALTER TABLE subscribers 
  ADD CONSTRAINT fk_subscribers_workspace 
  FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE;
```

**Session-Based Authorization:**
```ts
// lib/auth.ts
export async function getWorkspaceId() {
  const session = await getServerSession();
  if (!session) throw new UnauthorizedError();
  return session.user.workspaceId; // Always derive from session
}

// app/api/subscribers/route.ts
export async function GET(req: Request) {
  const workspaceId = await getWorkspaceId();
  const subscribers = await db.subscriber.findMany({
    where: { workspaceId }, // Never trust request body
  });
  return NextResponse.json(subscribers);
}
```

---

## 4. API ARCHITECTURE

### 4.1 Complete API Inventory

**HTTP Methods & Status Codes:**
- `GET` (200 OK, 404 Not Found)
- `POST` (201 Created, 400 Bad Request, 422 Unprocessable Entity)
- `PATCH` (200 OK, 404 Not Found, 409 Conflict)
- `DELETE` (204 No Content, 404 Not Found)

**Error Response Format:**
```json
{
  "error": "Invalid email format",
  "code": "VALIDATION_ERROR",
  "details": { "field": "email", "reason": "must be valid email" }
}
```

---

### 4.2 API Routes by Domain

#### Authentication APIs

```
POST /api/auth/signup
  Purpose: Create new user account
  Body: { email, password, firstName, lastName, terms }
  Response: { user, token }
  Auth: None

POST /api/auth/login
  Purpose: User login
  Body: { email, password }
  Response: { user, token, expiresAt }
  Auth: None

POST /api/auth/logout
  Purpose: End session
  Auth: Required

GET /api/auth/session
  Purpose: Get current session
  Response: { user, workspaceId, role }
  Auth: Required

POST /api/auth/verify-email
  Purpose: Verify email address
  Query: token
  Auth: None

POST /api/auth/password-reset
  Purpose: Send reset email
  Body: { email }
  Auth: None

PATCH /api/auth/password
  Purpose: Update password
  Body: { currentPassword, newPassword }
  Auth: Required
```

#### Workspace & Users APIs

```
GET /api/workspaces
  Purpose: List user's workspaces
  Response: { workspaces: [] }
  Auth: Required

POST /api/workspaces
  Purpose: Create workspace
  Body: { name }
  Response: { workspace }
  Auth: Required

PATCH /api/workspaces/[id]
  Purpose: Update workspace
  Body: { name, logo, domain }
  Auth: Required (Owner)

GET /api/workspaces/[id]/members
  Purpose: List workspace members
  Response: { members: [] }
  Auth: Required

POST /api/workspaces/[id]/members
  Purpose: Invite member
  Body: { email, role }
  Auth: Required (Owner/Admin)

PATCH /api/workspaces/[id]/members/[memberId]
  Purpose: Update member role
  Body: { role }
  Auth: Required (Owner)

DELETE /api/workspaces/[id]/members/[memberId]
  Purpose: Remove member
  Auth: Required (Owner)
```

#### Audience APIs

```
GET /api/audience
  Purpose: List subscribers
  Query: page, limit, search, tag, segment, status
  Response: { subscribers: [], total, page }
  Auth: Required

GET /api/audience/[id]
  Purpose: Get subscriber details
  Response: { subscriber, history: [] }
  Auth: Required

POST /api/audience
  Purpose: Create subscriber
  Body: { email, firstName, lastName, customFields, tags }
  Response: { subscriber }
  Auth: Required

PATCH /api/audience/[id]
  Purpose: Update subscriber
  Body: { firstName, lastName, tags, customFields, status }
  Auth: Required

DELETE /api/audience/[id]
  Purpose: Delete subscriber
  Auth: Required

POST /api/audience/bulk-import
  Purpose: Import CSV
  Body: FormData with file
  Response: { imported: 100, skipped: 5, errors: [] }
  Auth: Required

POST /api/audience/export
  Purpose: Export subscribers
  Query: segment, tag, status
  Response: CSV file download
  Auth: Required
```

#### Segments APIs

```
GET /api/segments
  Purpose: List segments
  Response: { segments: [] }
  Auth: Required

POST /api/segments
  Purpose: Create segment
  Body: { name, criteria }
  Response: { segment }
  Auth: Required

PATCH /api/segments/[id]
  Purpose: Update segment
  Body: { name, criteria }
  Auth: Required

DELETE /api/segments/[id]
  Purpose: Delete segment
  Auth: Required

GET /api/segments/[id]/members
  Purpose: Get segment members
  Query: page, limit
  Response: { members: [], total }
  Auth: Required

POST /api/segments/[id]/recompute
  Purpose: Recompute segment membership
  Response: { processed: 1000 }
  Auth: Required
```

#### Forms APIs

```
GET /api/forms
  Purpose: List forms
  Response: { forms: [] }
  Auth: Required

POST /api/forms
  Purpose: Create form
  Body: { name, fields: [], settings: {} }
  Response: { form }
  Auth: Required

PATCH /api/forms/[id]
  Purpose: Update form
  Body: { name, fields, settings }
  Auth: Required

DELETE /api/forms/[id]
  Purpose: Delete form
  Auth: Required

GET /api/forms/[id]/embed
  Purpose: Get embed code
  Response: { code: "<script>...", preview: "..." }
  Auth: Required

POST /api/embed/forms/[formId]
  Purpose: Submit form (PUBLIC, no auth)
  Body: { data: {}, captchaToken }
  Response: { success, message }
  Auth: None (but rate-limited)
```

#### Campaigns APIs

```
GET /api/campaigns
  Purpose: List campaigns
  Query: page, status
  Response: { campaigns: [], total }
  Auth: Required

POST /api/campaigns
  Purpose: Create campaign
  Body: { title, subject, content, templateId }
  Response: { campaign }
  Auth: Required

PATCH /api/campaigns/[id]
  Purpose: Update campaign (draft only)
  Body: { title, subject, content }
  Auth: Required

DELETE /api/campaigns/[id]
  Purpose: Delete campaign (draft only)
  Auth: Required

POST /api/campaigns/[id]/send
  Purpose: Send campaign immediately
  Body: { segmentIds, subscriberIds }
  Response: { sent, queued }
  Auth: Required

POST /api/campaigns/[id]/schedule
  Purpose: Schedule campaign
  Body: { sendAt, segmentIds }
  Auth: Required

GET /api/campaigns/[id]/analytics
  Purpose: Get campaign metrics
  Response: { sent, opened, clicked, bounced, rates: {} }
  Auth: Required

POST /api/campaigns/[id]/duplicate
  Purpose: Clone campaign
  Body: { newTitle }
  Response: { campaign }
  Auth: Required
```

#### Loops APIs

```
GET /api/loops
  Purpose: List automation loops
  Query: status
  Response: { loops: [] }
  Auth: Required

POST /api/loops
  Purpose: Create loop
  Body: { name, trigger: {}, actions: [] }
  Response: { loop }
  Auth: Required

PATCH /api/loops/[id]
  Purpose: Update loop (draft only)
  Body: { name, trigger, actions }
  Auth: Required

DELETE /api/loops/[id]
  Purpose: Delete loop
  Auth: Required

POST /api/loops/[id]/publish
  Purpose: Activate loop
  Auth: Required

POST /api/loops/[id]/pause
  Purpose: Pause loop
  Auth: Required

GET /api/loops/[id]/executions
  Purpose: View past executions
  Query: page, status
  Response: { executions: [] }
  Auth: Required

GET /api/loops/[id]/executions/[executionId]
  Purpose: View execution logs
  Response: { execution, events: [] }
  Auth: Required
```

#### AI APIs

```
POST /api/ai/generate-newsletter
  Purpose: Generate newsletter content
  Body: { topic, tone: "professional" | "casual" | "funny" }
  Response: { content, subject, tokens }
  Auth: Required

POST /api/ai/generate-subject
  Purpose: Generate subject lines
  Body: { topic }
  Response: { subjects: [] }
  Auth: Required

POST /api/ai/generate-template
  Purpose: Generate template
  Body: { topic, style }
  Response: { html }
  Auth: Required
```

#### Analytics APIs

```
GET /api/analytics/dashboard
  Purpose: Dashboard summary metrics
  Query: startDate, endDate
  Response: { metrics: {}, trends: {} }
  Auth: Required

GET /api/analytics/campaigns
  Purpose: Campaign performance breakdown
  Query: page, sortBy
  Response: { campaigns: [] }
  Auth: Required

GET /api/analytics/subscribers
  Purpose: Subscriber growth chart
  Query: startDate, endDate, interval
  Response: { data: [] }
  Auth: Required

GET /api/analytics/forms
  Purpose: Form conversion analytics
  Response: { forms: [] }
  Auth: Required
```

#### Billing APIs

```
GET /api/billing/plans
  Purpose: List subscription plans
  Response: { plans: [] }
  Auth: None (public)

POST /api/billing/checkout
  Purpose: Initiate checkout
  Body: { planId }
  Response: { checkoutUrl }
  Auth: Required

GET /api/billing/subscription
  Purpose: Get current subscription
  Response: { subscription, plan, renewalDate }
  Auth: Required

POST /api/billing/upgrade
  Purpose: Upgrade plan
  Body: { planId }
  Response: { subscription }
  Auth: Required

POST /api/billing/cancel
  Purpose: Cancel subscription
  Auth: Required

POST /api/webhooks/flutterwave
  Purpose: Handle payment webhooks (Flutterwave)
  Body: { event, data }
  Auth: Signature verification
```

---

## 5. UI IMPLEMENTATION PLAN

### 5.1 Marketing Site Screens

#### 1. Landing Page
**Route:** `/`  
**Components:**
- Hero section (headline, CTA, hero image)
- Features section (3-4 key differentiators with icons)
- Pricing teaser
- Social proof / testimonials
- CTAs (Sign Up, Docs)

**States:**
- Default
- Scrolled (nav bar sticky)

---

#### 2. Pricing Page
**Route:** `/pricing`  
**Components:**
- Plan comparison table (Free, Starter, Pro, Enterprise)
- Plan cards with CTAs
- FAQ section
- Feature matrix
- Billing cycle toggle (monthly/yearly)

**States:**
- Plan selected
- Billing toggle

---

#### 3. Features Page
**Route:** `/features`  
**Components:**
- Feature showcase (with screenshots/GIFs)
- Use case sections
- Integration badges

---

#### 4. Blog/Resources
**Route:** `/blog`  
**Components:**
- Blog post list (with search, pagination)
- Blog post detail
- Related posts sidebar

---

#### 5. Contact/Support
**Route:** `/contact`  
**Components:**
- Contact form
- Support links
- FAQs

---

### 5.2 Application Screens (Authenticated)

#### 1. Onboarding Wizard
**Route:** `/onboarding`  
**Steps:**
1. Workspace name
2. Use case selection
3. Import subscribers (optional)
4. Create first form (optional)
5. Confirmation

**Components:**
- Step indicator
- Form inputs
- Progress bar

---

#### 2. Dashboard / Home
**Route:** `/dashboard`  
**Components:**
- KPI cards (subscribers, open rate, click rate, revenue)
- Recent campaigns table
- Subscriber growth chart
- Quick action buttons (Send Newsletter, Create Loop, etc.)
- Upcoming scheduled sends

**States:**
- Loading
- No data (empty state)
- Data loaded

---

#### 3. Audience Overview
**Route:** `/dashboard/audience`  
**Components:**
- Audience size card
- Growth trend chart
- Segmentation breakdown chart
- Quick filters (status, tag)
- Import/Export buttons

---

#### 4. Subscriber List
**Route:** `/dashboard/audience/subscribers`  
**Components:**
- Data table (email, name, tags, last engaged, status)
- Sortable, filterable, searchable
- Row actions (view, edit, delete, tag)
- Bulk actions (delete, tag, segment)
- Pagination
- Column visibility toggle

**States:**
- Loading
- Empty state
- Rows selected (bulk actions visible)

---

#### 5. Subscriber Detail
**Route:** `/dashboard/audience/subscribers/[id]`  
**Components:**
- Subscriber info card (email, name, tags, custom fields)
- Edit form
- Engagement history timeline
- Tag manager
- Delete button

**States:**
- View mode
- Edit mode
- Deleting (confirmation modal)

---

#### 6. Segments
**Route:** `/dashboard/audience/segments`  
**Components:**
- Segment list cards
- Segment builder modal
- Member preview
- Actions (edit, delete, view members)

---

#### 7. Form Builder
**Route:** `/dashboard/forms`  
**Components:**
- Form list
- Create form button

**Route:** `/dashboard/forms/[id]`  
**Components:**
- Form editor (left: canvas, right: field inspector)
- Drag-drop fields
- Field config panel
- Preview button
- Embed code generator
- Form settings (auto-tag, redirect, confirmation)

**States:**
- Editing
- Previewing
- Publishing
- Generating embed

---

#### 8. Campaigns
**Route:** `/dashboard/campaigns`  
**Components:**
- Campaign list (status, subject, send date, metrics)
- Create campaign button
- Filters (status, date range)
- Bulk actions

---

#### 9. Campaign Editor
**Route:** `/dashboard/campaigns/[id]`  
**Components:**
- Campaign header (title, status)
- Email editor (WYSIWYG or code mode)
- Template selector
- Subject line input
- Preview pane
- Send settings (segment, schedule)
- Autosave indicator

**States:**
- Draft
- Scheduled
- Sent (read-only)

---

#### 10. Campaign Analytics
**Route:** `/dashboard/campaigns/[id]/analytics`  
**Components:**
- Campaign summary (sent, open rate, click rate, etc.)
- Metrics cards
- Opens timeline chart
- Top clicked links
- Subscriber engagement table
- Export button

---

#### 11. Loops / Automation Builder
**Route:** `/dashboard/loops`  
**Components:**
- Loop list (active, paused, drafts)
- Create loop button
- Loop card (trigger badge, action count, status)

**Route:** `/dashboard/loops/[id]`  
**Components:**
- Loop visual builder (canvas)
- Trigger configuration (form, tag, subscriber created, etc.)
- Actions (email, delay, tag, condition)
- Action inspector panel
- Publish/Pause buttons
- Execution logs view

**States:**
- Draft (editable)
- Active (published)
- Paused
- Testing (preview execution)

---

#### 12. Analytics Dashboard
**Route:** `/dashboard/analytics`  
**Components:**
- Date range picker
- KPI cards (subscribers, campaigns, open rate, click rate)
- Growth chart (subscribers over time)
- Campaign performance breakdown
- Form conversion table
- Export reports button

---

#### 13. Settings
**Route:** `/dashboard/settings`  
**Components:**

**Account Settings:**
- User profile form (name, email, password)
- Profile picture upload

**Workspace Settings:**
- Workspace name
- Logo upload
- Custom domain (if applicable)

**Team & Members:**
- Member list
- Invite member form
- Remove member button
- Role selector

**Billing:**
- Current plan card
- Upgrade button
- Usage stats (subscribers, forms)
- Invoices table
- Cancel subscription button

---

### 5.3 Component Specifications

#### Data Table Component
```tsx
// components/data-tables/SubscriberTable.tsx
interface SubscriberTableProps {
  subscribers: Subscriber[];
  isLoading: boolean;
  onRowClick: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  sortBy: "email" | "createdAt" | "lastEngaged";
  filterBy: "active" | "unsubscribed" | "bounced";
}

// States:
// - Loading skeleton
// - Empty state (no subscribers)
// - Data loaded
// - Row(s) selected (bulk actions visible)
// - Sorting by column
// - Filtering by status
```

#### Email Editor Component
```tsx
// components/campaigns/EmailEditor.tsx
interface EmailEditorProps {
  content: string;
  onChange: (content: string) => void;
  mode: "wysiwyg" | "code";
  onModeChange: (mode: string) => void;
}

// States:
// - WYSIWYG mode (drag-drop, rich formatting)
// - Code mode (HTML/Markdown)
// - Template preview
// - Mobile preview
```

#### Loop Canvas Component
```tsx
// components/loops/LoopCanvas.tsx
interface LoopCanvasProps {
  trigger: LoopTrigger;
  actions: LoopAction[];
  onAddAction: (type: string) => void;
  onRemoveAction: (actionId: string) => void;
  onEditAction: (actionId: string, config: object) => void;
}

// States:
// - Drag-drop enabled
// - Hovering over connector
// - Action selected
// - Condition evaluation preview
```

---

## 6. COMPONENT ARCHITECTURE

### 6.1 Reusable Component Inventory

**Layout Components:**
- `DashboardLayout` — sidebar + main content
- `AuthLayout` — centered card layout
- `MarketingLayout` — navbar + footer
- `ModalDialog` — reusable modal wrapper

**Form Components:**
- `FormBuilder` — drag-drop form builder
- `EmailEditor` — WYSIWYG/code email editor
- `SegmentBuilder` — UI to define segment criteria
- `FormField` — text, email, select, checkbox, textarea
- `TagInput` — multi-select tags

**Data Table Components:**
- `DataTable` — sortable, filterable, paginated table
- `ColumnVisibilityToggle` — column visibility control
- `BulkActionBar` — bulk operation controls

**Analytics Components:**
- `LineChart` — metric trends
- `BarChart` — comparison data
- `KPICard` — metric summary card
- `MetricTable` — metric breakdown table

**Navigation Components:**
- `Sidebar` — main navigation
- `TopNav` — header with user menu
- `BreadcrumbNav` — breadcrumb trails
- `TabNav` — section tabs

**Modals & Dialogs:**
- `ConfirmDialog` — confirmation modal (delete, etc.)
- `InviteModal` — invite team member
- `SegmentModal` — segment creation
- `ScheduleModal` — campaign scheduling

**Cards & Containers:**
- `FeatureCard` — feature showcase
- `PlanCard` — pricing plan card
- `StatCard` — stat display
- `CampaignCard` — campaign item

**Badges & Badges:**
- `StatusBadge` — (active, scheduled, paused, sent)
- `TagBadge` — tag display
- `PlanBadge` — plan indicator

**Loading & Empty States:**
- `SkeletonLoader` — content placeholders
- `EmptyState` — no data illustration + message
- `ErrorState` — error message + retry

---

## 7. AUTHENTICATION & AUTHORIZATION

### 7.1 Authentication Flow

```
┌─────────────────┐
│    Signup       │
├─────────────────┤
│ Email & Password│
│ First/Last Name │
│ Accept Terms    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create User     │
│ Hash Password   │
│ Send Email Verif│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Email Verif Link│
│ User clicks link│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Mark Verified   │
│ Create Workspace│
│ Create Session  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Redirect to     │
│ Onboarding      │
└─────────────────┘
```

**Login Flow:**
```
Email + Password
     │
     ▼
Verify credentials
     │
     ├─ Invalid? → Error message
     │
     └─ Valid? → Create session
                 │
                 ▼
                 Set session cookie
                 │
                 ▼
                 Redirect to dashboard
```

**Password Reset:**
```
Enter email
     │
     ▼
Generate reset token (expiry: 1 hour)
     │
     ▼
Send email with reset link
     │
     ▼
User clicks link
     │
     ├─ Token expired? → Error, request new reset
     │
     └─ Valid? → Show new password form
                 │
                 ▼
                 User submits new password
                 │
                 ▼
                 Invalidate all sessions
                 │
                 ▼
                 Redirect to login
```

### 7.2 Session Management

**Using NextAuth.js/Auth.js:**
```ts
// lib/auth.ts
export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });
        if (user && verify(credentials.password, user.password)) {
          return user;
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.workspaceId = user.workspaceId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, user }) {
      session.user.workspaceId = user.workspaceId;
      session.user.role = user.role;
      return session;
    },
  },
};
```

### 7.3 Authorization & Role-Based Access Control

**Roles:**
- **Owner** — full workspace access, billing, member management
- **Admin** — access to campaigns, audience, forms, loops, analytics
- **Member** — read-only or limited access (configurable per feature)

**Role Enforcement in API Routes:**
```ts
// app/api/campaigns/[id]/route.ts
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) return unauthorized();

  // Verify user is Admin or Owner
  const member = await db.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspaceId: session.user.workspaceId,
      role: { in: ["admin", "owner"] },
    },
  });
  if (!member) return forbidden();

  // Verify campaign belongs to workspace
  const campaign = await db.campaign.findUnique({
    where: { id: params.id },
  });
  if (campaign?.workspaceId !== session.user.workspaceId) {
    return forbidden();
  }

  // Proceed with update
  // ...
}
```

**Middleware Protection:**
```ts
// middleware.ts
export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};

export async function middleware(req: NextRequest) {
  const session = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
```

---

## 8. NEWSLETTER SYSTEM

### 8.1 Campaign Lifecycle

```
┌──────────────────┐
│      Draft       │◄──────────────┐
├──────────────────┤               │
│ Create campaign  │ ◄─ Edit/Save  │
│ Title, subject   │               │
│ Content          │               │
└────────┬─────────┘               │
         │                         │
         ▼                         │
┌──────────────────┐               │
│    Review        │── Cancel ─────┘
├──────────────────┤
│ Select recipients│
│ Review content   │
│ Preview          │
│ Confirm send     │
└────────┬─────────┘
         │
         ├─ Schedule → ┌──────────────────┐
         │             │    Scheduled     │
         │             ├──────────────────┤
         │             │ Pending send     │
         │             │ Scheduled time   │
         │             └────────┬─────────┘
         │                      │
         └─ Send Now ─┐         │
                      ▼         ▼
                  ┌──────────────────┐
                  │     Sending      │
                  ├──────────────────┤
                  │ Batch processing │
                  │ to Resend        │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │       Sent       │
                  ├──────────────────┤
                  │ All sent to      │
                  │ recipients       │
                  │ Tracking active  │
                  └──────────────────┘
```

### 8.2 Campaign Creation

**Step 1: New Campaign**
- Title (e.g., "Weekly Newsletter - Issue 42")
- Template selection (optional)
- Content mode (WYSIWYG or HTML)

**Step 2: Email Content**
- Subject line input
- Email body editor
- Preview pane (desktop + mobile)
- Personalization tokens ({{firstName}}, {{email}}, etc.)

**Step 3: Recipients**
- Select segments
- Or select specific subscribers
- Recipient count preview
- Filter preview (show sample emails)

**Step 4: Schedule**
- Send now
- Schedule for later (date + time picker)
- Timezone selection

**Step 5: Confirmation**
- Review all details
- Send button
- Cancel or back to edit

### 8.3 Email Tracking

**Open Tracking:**
- Pixel tag (1x1 transparent GIF) embedded in email
- Tracks first open only
- Records timestamp

**Click Tracking:**
- All links rewritten with tracking wrapper
- Format: `/r/[campaignId]/[linkHash]?u=[subscriberId]`
- Records each click with timestamp and link URL

**Bounce/Complaint Handling:**
- Resend webhooks notify on bounce
- Set `subscriberStatus` to `bounced`
- Remove from future sends

**Delivery Tracking:**
- Resend webhook on successful delivery
- Optional: hard bounce removes subscriber

### 8.4 Analytics & Reporting

**Campaign Metrics:**
- Total sent
- Delivered
- Opened (count + rate %)
- Clicked (count + rate %)
- Bounced (count + rate %)
- Complained / unsubscribed

**Reporting:**
- Campaign list with metrics
- Campaign detail analytics (charts + tables)
- Export reports (PDF, CSV)
- Time-based trends (opens/clicks over time)
- Link click breakdown
- Subscriber engagement summary

---

## 9. AUDIENCE & FORMS SYSTEM

### 9.1 Subscriber Management

**Subscriber Properties:**
- Email (unique per workspace)
- First name, last name
- Status (active, unsubscribed, bounced)
- Tags (multiple, e.g., "founder", "premium", "engaged")
- Custom fields (JSON, e.g., company, role, phone)
- Last engaged (timestamp)
- Created at (timestamp)

**Subscriber Actions:**
- Create (manual, CSV import, form submission, API)
- View (detail page with history)
- Edit (name, custom fields, tags)
- Tag (add/remove tags)
- Segment (assign to segments)
- Delete (soft delete)
- Export (CSV)

**Bulk Operations:**
- Select multiple subscribers
- Bulk tag
- Bulk delete
- Bulk export
- Bulk segment assignment

### 9.2 Form Builder

**Form Features:**
- Drag-drop field interface
- Field types: text, email, select, checkbox, textarea, date
- Field validation (required, regex, length, etc.)
- Conditional fields (show/hide based on answers)
- Multi-step forms
- Custom branding (colors, logo)
- Success message or redirect

**Embed Options:**
1. **Embedded Script:**
   ```html
   <script src="https://loopra.io/embed/forms/[formId].js"></script>
   <div id="loopra-form-[formId]"></div>
   ```

2. **Iframe:**
   ```html
   <iframe src="https://loopra.io/embed/forms/[formId]"></iframe>
   ```

3. **Popup:**
   ```html
   <script>
     window.loopraPopup = { formId: "[formId]", trigger: "scroll", delay: 5000 };
   </script>
   <script src="https://loopra.io/embed/popup.js"></script>
   ```

### 9.3 Form Analytics

**Metrics:**
- Views (how many times loaded)
- Submissions (total form fills)
- Conversion rate (submissions / views)
- Abandonment rate
- Average time to complete
- Field drop-off analysis

**Submission Data:**
- View individual submissions
- Export submission data
- Webhook notifications

### 9.4 Segmentation

**Segment Criteria:**
- Tags (has tag X, missing tag X)
- Engagement (opened campaign X, clicked link, etc.)
- Subscriber age (created within date range)
- Custom fields (company = "Acme", role = "founder")
- Engagement score (high, medium, low)
- Campaign history (subscribed via form X)

**Dynamic Segments:**
- Criteria evaluated periodically (hourly, daily)
- Membership updated automatically
- Can be used immediately for sends

**Static Segments:**
- Snapshot of subscribers at creation time
- Membership fixed
- Useful for A/B testing

---

## 10. AUTOMATION LOOP SYSTEM

### 10.1 Loop Triggers

**Available Triggers:**
1. **Form Submission** — When subscriber fills a specific form
2. **Tag Added** — When a tag is applied to subscriber
3. **Subscriber Created** — When a new subscriber joins
4. **Campaign Opened** — When subscriber opens a campaign
5. **Campaign Clicked** — When subscriber clicks a link
6. **Webhook** — External system triggers via API

**Trigger Configuration Example:**
```json
{
  "type": "form_submission",
  "formId": "form-123",
  "config": {
    "segments": ["all"], // or specific segments
    "excludeTags": ["active-loop-users"]
  }
}
```

### 10.2 Loop Actions

**Sequence of Actions:**
1. **Send Email** — Send template or custom email
2. **Delay** — Wait N days/hours/minutes before next action
3. **Apply Tag** — Tag subscriber (for segmentation)
4. **Remove Tag** — Remove tag
5. **Conditional Split** — Branch based on subscriber attributes
6. **Webhook Call** — POST to external API
7. **End Loop** — Stop execution

**Action Configuration:**
```json
{
  "sequence": 0,
  "type": "delay",
  "config": { "unit": "days", "value": 1 }
},
{
  "sequence": 1,
  "type": "send_email",
  "config": {
    "subject": "Follow up",
    "body": "Hi {{firstName}}..."
  }
},
{
  "sequence": 2,
  "type": "condition",
  "config": {
    "attribute": "engagement_score",
    "operator": ">",
    "value": 5,
    "truePath": 3,  // go to action 3 if true
    "falsePath": 4  // go to action 4 if false
  }
}
```

### 10.3 Loop Execution Engine

**Execution Process:**

1. **Trigger Evaluation** (runs periodically, e.g., every 5 minutes)
   - Check all active loop triggers
   - Find matching subscribers
   - Create `LoopExecution` record for each

2. **Execution Start**
   - Mark execution as `running`
   - Begin first action

3. **Action Processing**
   - Send email action: call Resend API
   - Delay action: schedule next action for future time
   - Tag action: update subscriber
   - Condition action: evaluate and jump to next action
   - Webhook: POST to external URL

4. **Error Handling**
   - Transient error (email API timeout): retry 3x with exponential backoff
   - Permanent error (invalid email): mark execution failed, log error
   - Webhook failure: retry 5x over 24 hours

5. **Completion**
   - Mark execution as `completed`
   - Log final state
   - Trigger webhooks (if configured)

**Data Model:**
```ts
interface LoopExecution {
  id: string;
  loopId: string;
  subscriberId: string;
  triggeredAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: "pending" | "running" | "completed" | "failed";
  lastError?: string;
  eventLogs: LoopEventLog[];
}

interface LoopEventLog {
  id: string;
  executionId: string;
  actionId: string;
  status: "pending" | "executing" | "completed" | "failed";
  result?: any;
  error?: string;
  timestamp: Date;
}
```

### 10.4 Example: Welcome Series Loop

```
Trigger: New Subscriber Created

Action 1: Send "Welcome" email (0 minutes delay)
  - Subject: "Welcome to our newsletter!"
  - Body: "Hi {{firstName}}, thanks for subscribing..."

Action 2: Delay 3 days

Action 3: Send "Getting Started" email
  - Subject: "Here's how to get the most out of..."

Action 4: Delay 7 days

Action 5: Condition: Check if subscriber opened previous emails
  - If YES: Send "Premium offer" email
  - If NO: Send "We miss you" email + Tag with "low-engagement"

Action 6: End
```

---

## 11. AI SYSTEM (Phase 5)

### 11.1 AI Capabilities

**Newsletter Generation:**
- Input: Topic, tone, length preference
- Output: Complete newsletter HTML + subject line
- Model: GPT-4 or Claude
- Cost: ~$0.05 per generation

**Subject Line Generation:**
- Input: Newsletter topic/content
- Output: 5 subject line suggestions
- Cost: ~$0.01 per generation

**Tone Adjustment:**
- Input: Draft content, desired tone
- Output: Rewritten content in target tone
- Tones: Professional, casual, funny, urgent

**Template Generation:**
- Input: Industry/use case, brand colors
- Output: Email template HTML
- Cost: ~$0.02 per generation

### 11.2 Implementation

**Cost Tracking:**
```ts
interface AiGeneration {
  id: string;
  workspaceId: string;
  type: "newsletter" | "subject" | "template" | "tone";
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  model: string;
  createdAt: Date;
}

// Track cost per workspace for billing/rate limiting
export async function trackAICost(workspaceId: string, tokens: number) {
  const costPerToken = 0.000002; // $0.002 per 1K tokens
  await db.aiGeneration.create({
    data: {
      workspaceId,
      costUSD: tokens * costPerToken,
      // ...
    },
  });
}
```

**Caching:**
```ts
// lib/ai.ts
const cache = new Map<string, { result: string; expiresAt: Date }>();

export async function generateNewsletter(topic: string, tone: string) {
  const cacheKey = `newsletter-${topic}-${tone}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > new Date()) {
    return cached.result;
  }

  const result = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: buildPrompt(topic, tone) }],
  });

  cache.set(cacheKey, {
    result: result.choices[0].message.content,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  return result.choices[0].message.content;
}
```

**Rate Limiting (Free Plan):**
- 5 AI generations per month
- Upgrade required for more

---

## 12. BILLING SYSTEM

### 12.1 Subscription Plans

**Free Plan**
- Price: $0
- Subscribers: 1,000
- Forms: 1
- Campaigns: Unlimited
- Loops: 1 active
- Features: Basic analytics, no AI

**Starter Plan**
- Price: $9/month
- Subscribers: 10,000
- Forms: 5
- Campaigns: Unlimited
- Loops: 5 active
- Features: Advanced analytics, 5 AI generations/month

**Pro Plan**
- Price: $49/month
- Subscribers: 100,000
- Forms: Unlimited
- Campaigns: Unlimited
- Loops: Unlimited
- Features: Full analytics, unlimited AI, priority support

**Enterprise**
- Custom pricing
- Unlimited everything
- Dedicated support, SLA

### 12.2 Checkout Flow

```
User selects plan
     │
     ▼
POST /api/billing/checkout
     │
     ├─ Check if already subscribed
     ├─ Create Payment intent
     ├─ Return Flutterwave checkout URL
     │
     ▼
Browser redirects to Flutterwave
     │
     ├─ User enters payment details
     │
     └─ Payment processing
          │
          ├─ Success → Redirect to callback URL with reference
          │
          └─ Failed → Show error, allow retry
               │
               ▼
          Backend receives payment webhook
               │
               ├─ Verify signature (HMAC-SHA256)
               ├─ Check payment status
               ├─ Create/Update subscription
               ├─ Send confirmation email
               │
               ▼
          User redirected to dashboard
               │
               ▼
          Show "Subscription active" message
```

### 12.3 Payment Webhook Verification

**Flutterwave Webhook:**
```ts
// app/api/webhooks/flutterwave/route.ts
export async function POST(req: Request) {
  const signature = req.headers.get("veriff-signature");
  const rawBody = await req.text();

  // Verify signature
  if (!verifyFlutterwaveSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);

  if (payload.event === "charge.completed") {
    // Payment successful
    await processPayment(payload.data.reference);
  } else if (payload.event === "charge.failed") {
    // Payment failed
    await handlePaymentFailure(payload.data.reference);
  }

  return NextResponse.json({ success: true });
}

function verifyFlutterwaveSignature(payload: string, signature: string): boolean {
  const hash = createHmac("sha256", process.env.FLUTTERWAVE_WEBHOOK_SECRET!)
    .update(payload)
    .digest("hex");
  return hash === signature;
}
```

### 12.4 Subscription Lifecycle

**Successful Payment:**
1. Create `subscription` record (status: active)
2. Update workspace plan limits
3. Send confirmation email
4. Trigger features unlock

**Renewal:**
- Flutterwave recurring charges monthly/yearly
- Webhook notifies us of renewal
- Subscription remains active

**Failed Payment:**
1. Retry 3x over 3 days
2. If all fail: mark subscription as `past_due`
3. Send "payment failed" email
4. Downgrade to Free plan after 7 days

**Cancellation:**
1. User clicks "Cancel Subscription"
2. Show confirmation modal (reason optional)
3. Set `cancelledAt` timestamp
4. Mark as `cancelled`
5. Downgrade to Free plan
6. Send cancellation email with feedback form

---

## 13. ANALYTICS SYSTEM

### 13.1 Event Tracking

**Event Types:**

| Event | Data | When |
|---|---|---|
| `subscriber.created` | workspaceId, subscriberId, source | New subscriber created |
| `subscriber.tagged` | workspaceId, subscriberId, tags | Tags applied |
| `form.submitted` | workspaceId, formId, subscriberId | Form filled |
| `campaign.sent` | workspaceId, campaignId, recipientCount | Campaign sent |
| `campaign.opened` | workspaceId, campaignId, subscriberId | Email opened |
| `campaign.clicked` | workspaceId, campaignId, subscriberId, link | Link clicked |
| `campaign.bounced` | workspaceId, campaignId, subscriberId | Email bounced |
| `loop.triggered` | workspaceId, loopId, subscriberId | Loop triggered |
| `loop.executed` | workspaceId, loopId, subscriberId, success | Loop completed |
| `subscription.created` | workspaceId, planId, amount | Subscription purchased |

### 13.2 Event Storage & Aggregation

**Raw Events Table:**
```sql
CREATE TABLE analyticsEvents (
  id UUID PRIMARY KEY,
  workspaceId UUID NOT NULL,
  eventType VARCHAR NOT NULL,
  resourceId UUID,
  resourceType VARCHAR,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX (workspaceId, eventType, timestamp)
);
```

**Aggregation Job (nightly):**
```ts
// Background job (cron or Bull queue)
export async function aggregateAnalytics() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Get all raw events from yesterday
  const events = await db.analyticsEvents.findMany({
    where: {
      timestamp: {
        gte: yesterday.setHours(0, 0, 0, 0),
        lte: yesterday.setHours(23, 59, 59, 999),
      },
    },
  });

  // Aggregate by metric
  const metrics = aggregateMetrics(events);

  // Store pre-aggregated data
  for (const [metric, value] of Object.entries(metrics)) {
    await db.analyticsSummaries.create({
      data: {
        workspaceId: events[0].workspaceId,
        date: yesterday,
        metric,
        value,
      },
    });
  }
}
```

### 13.3 Dashboard Metrics

**KPI Cards:**
- Total Subscribers (count)
- Monthly Recurring Revenue (sum of active subscriptions)
- Average Open Rate (% of campaigns)
- Average Click Rate (% of campaigns)

**Trends:**
- Subscriber growth (line chart, last 30 days)
- Campaign performance (bar chart, campaigns vs open/click rates)
- Revenue trend (line chart, monthly)

**Tables:**
- Recent campaigns (subject, sent, open rate, click rate)
- Top performing emails (by click rate)
- Subscriber acquisition sources (form name, import, API)

---

## 14. SECURITY REVIEW

### 14.1 Authentication Security

**Password Storage:**
```ts
import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12); // 12 salt rounds
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Session Security:**
- Sessions stored in PostgreSQL (database adapter)
- CSRF protection via NextAuth.js middleware
- Secure cookie flags: `httpOnly`, `secure`, `sameSite=Lax`
- Session expiry: 30 days

**Email Verification:**
- Token sent via email link
- Token expires in 1 hour
- One-time use (invalidate after verification)

### 14.2 Authorization Strategy

**Access Control Pattern:**
```ts
// 1. Always derive workspaceId from session
const workspaceId = session.user.workspaceId;

// 2. Verify user role in workspace
const member = await db.workspaceMember.findFirst({
  where: {
    userId: session.user.id,
    workspaceId,
    role: { in: ["owner", "admin"] },
  },
});
if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

// 3. Verify resource belongs to workspace
const resource = await db.campaign.findUnique({ where: { id } });
if (resource?.workspaceId !== workspaceId) {
  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

// 4. Proceed with operation
```

### 14.3 Input Validation

**All API inputs validated with Zod:**
```ts
const createCampaignSchema = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().min(1).max(100),
  content: z.string().min(10),
  templateId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const result = createCampaignSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }
  // Proceed with validated data
}
```

### 14.4 Rate Limiting

**Public Endpoints (form submissions):**
```ts
import Ratelimit from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 per minute
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  // Process form
}
```

### 14.5 Webhook Verification

**All incoming webhooks verified:**
```ts
// Flutterwave webhook
function verifyFlutterwaveSignature(
  payload: string,
  signature: string
): boolean {
  const hash = createHmac("sha256", process.env.FLUTTERWAVE_WEBHOOK_SECRET!)
    .update(payload)
    .digest("hex");
  return hash === signature;
}

// Resend webhook
function verifyResendSignature(
  payload: string,
  signature: string
): boolean {
  const hash = createHmac("sha256", process.env.RESEND_WEBHOOK_SECRET!)
    .update(payload)
    .digest("hex");
  return hash === signature;
}
```

### 14.6 Secrets Management

**Environment Variables (Vercel):**
```env
# Server-only
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_...
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_...
FLUTTERWAVE_WEBHOOK_SECRET=...
NEXTAUTH_SECRET=...

# Client-safe (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_APP_URL=https://app.loopra.io
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_...
```

**Never expose:**
- Database credentials
- API keys (Resend, OpenAI, etc.)
- Payment secrets
- Session signing secrets

### 14.7 Multi-Tenant Isolation

**Query-Level:**
```ts
// Every query filters by workspaceId
const subscribers = await db.subscriber.findMany({
  where: { workspaceId: session.user.workspaceId },
});
```

**Foreign Key Constraints:**
```sql
ALTER TABLE subscribers
  ADD CONSTRAINT fk_subscribers_workspace
  FOREIGN KEY (workspaceId)
  REFERENCES workspaces(id)
  ON DELETE CASCADE;
```

**Data Backup Considerations:**
- Backups encrypted at rest
- Access logs maintained
- Compliance with GDPR (data export, deletion)

---

## 15. DEVOPS PLAN

### 15.1 Environment Structure

```
Development
├── .env.local (local machine)
├── Database: PostgreSQL local
├── Email: Resend sandbox
├── Payments: Flutterwave test mode
└── Storage: Local file system

Staging
├── Branch: develop
├── .env.staging (Vercel secrets)
├── Database: PostgreSQL staging
├── Email: Resend sandbox
├── Payments: Flutterwave test mode
├── URL: staging.loopra.io
└── Deploys on every merge to develop

Production
├── Branch: main
├── .env.production (Vercel secrets)
├── Database: PostgreSQL production
├── Email: Resend live
├── Payments: Flutterwave live
├── URL: app.loopra.io
└── Deploys on version tags (v1.0.0)
```

### 15.2 CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_STAGING }}
          scope: ${{ secrets.VERCEL_ORG_ID }}
          environment-url: https://staging.loopra.io

  deploy-production:
    if: github.ref == 'refs/heads/main' && startsWith(github.ref, 'refs/tags/')
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_PROD }}
          environment-url: https://app.loopra.io
```

### 15.3 Database Migrations

**Using Prisma:**

```ts
// prisma/schema.prisma
model Subscriber {
  id        String   @id @default(cuid())
  email     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([workspaceId, email])
}
```

**Migration Commands:**
```bash
# Generate migration after schema change
npx prisma migrate dev --name add_subscriber_table

# Apply migrations in production
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

**Deployment Strategy:**
1. Run migrations before deploying new code
2. Rollback plan: maintain `down` migrations
3. Test migrations against production-like data

### 15.4 Monitoring & Logging

**Error Tracking (Sentry):**
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Automatic error capture in API routes and React components
```

**Structured Logging:**
```ts
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

// Usage
logger.info({ campaignId: "123", sentCount: 1000 }, "Campaign sent");
logger.error({ error: err, userId: "456" }, "Failed to send campaign");
```

**Metrics (DataDog or similar):**
```ts
import StatsD from "node-statsd";

const statsd = new StatsD({
  host: process.env.DATADOG_HOST,
  port: process.env.DATADOG_PORT,
});

// Track custom metrics
statsd.gauge("campaign.send_duration_ms", duration);
statsd.increment("campaign.sent", { plan: "pro" });
```

### 15.5 Performance Monitoring

**Page Speed Insights:**
- Set Core Web Vitals targets (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Monitor via Vercel Analytics

**Database Query Performance:**
- Enable slow query logging
- Monitor with Prisma Studio
- Index optimization (add indexes for slow queries)

### 15.6 Backup & Disaster Recovery

**Database Backups:**
- Automated daily backups (AWS RDS automated backups)
- Retain for 30 days
- Test restore process monthly

**Recovery Procedure:**
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour
- Failover process documented

---

## 16. DEVELOPMENT PHASES

### Phase 1: Foundation 
**Deliverables:**
- Project setup (Next.js, TypeScript, Prisma, PostgreSQL)
- Authentication (signup, login, password reset, email verification)
- Database schema (users, workspaces, workspace members)
- Onboarding flow
- Marketing site (landing, pricing, contact)
- User profile & workspace settings

**Dependencies:** None (start phase)

**Complexity:** Medium

**Risks:**
- Database design flaws (mitigate: peer review schema)
- Auth bugs (mitigate: extensive testing)



---

### Phase 2: Audience Management 
**Deliverables:**
- Subscriber CRUD (create, list, edit, delete)
- Bulk import (CSV uploader with mapping)
- Subscriber tagging system
- Segments (create, criteria builder, auto-evaluation)
- Audience analytics (growth chart, source breakdown)
- Forms (form builder, embed generation, submissions)

**Dependencies:** Phase 1 (auth, workspace)

**Complexity:** High (form builder, segment engine)

**Risks:**
- Performance with large subscriber bases (mitigate: database indexing, pagination)
- Form builder UX complexity (mitigate: iterative design feedback)

---

### Phase 3: Newsletter System 

**Deliverables:**
- Campaign creation (title, subject, content editor)
- Email templates library
- Send/schedule campaigns
- Email tracking (opens, clicks)
- Campaign analytics dashboard
- Segment-based recipient selection

**Dependencies:** Phase 2 (segments, subscribers)

**Complexity:** High (email tracking, scheduler)

**Risks:**
- Email deliverability issues (mitigate: Resend integration, bounce handling)
- Scaling batch sends (mitigate: queue-based sending)



---

### Phase 4: Automation Loops 
**Deliverables:**
- Loop builder (visual canvas, drag-drop actions)
- Triggers (form submission, tag added, subscriber created)
- Actions (send email, delay, apply tag, conditions)
- Execution engine (background job processor)
- Execution monitoring / logs
- Retry logic and error handling 

**Dependencies:** Phase 3 (campaigns), Phase 2 (tags, forms)

**Complexity:** Very High (async execution, state management)

**Risks:**
- Race conditions in execution (mitigate: database locks, transactions)
- Complex condition logic (mitigate: extensive testing of conditions)


---

### Phase 5: AI Features 

**Deliverables:**
- Newsletter generation from topic
- Subject line suggestions
- Tone adjustment
- Template generation
- Cost tracking (AI usage per workspace)
- Rate limiting (free plan limit)

**Dependencies:** Phase 3 (campaigns)

**Complexity:** Medium (API integration, caching)

**Risks:**
- OpenAI API failures (mitigate: retry logic, fallback)
- Cost control (mitigate: rate limiting, cost tracking)

**Estimated Effort:** 1 developer, 3 weeks

---

### Phase 6: Billing 

**Deliverables:**
- Subscription plans (free, starter, pro, enterprise)
- Flutterwave integration (checkout, webhooks)
- Payment verification and subscription updates
- Invoice generation and history
- Usage enforcement (subscriber limits, feature gating)
- Plan upgrade/downgrade flows

**Dependencies:** All previous phases (feature gating)

**Complexity:** High (payment processing, compliance)

**Risks:**
- Payment webhook race conditions (mitigate: idempotency keys)
- Regulatory compliance (mitigate: legal review)

**Estimated Effort:** 2 developers, 3 weeks

---

### Phase 7: Analytics 

**Deliverables:**
- Analytics dashboard (KPIs, trends)
- Event tracking system
- Nightly aggregation jobs
- Report generation
- Data export (CSV, PDF)

**Dependencies:** Phase 3, 4, 6

**Complexity:** Medium (data aggregation)

**Risks:**
- Query performance at scale (mitigate: materialized views, caching)

**Estimated Effort:** 1-2 developers, 2 weeks

---

### Phase 8: Production Readiness 
**Deliverables:**
- Performance optimization
- Security audit and fixes
- Load testing
- Documentation (API docs, user guide)
- Monitoring and alerting setup
- Team training

**Dependencies:** All phases

**Complexity:** High (cross-functional)

**Risks:**
- Last-minute bugs (mitigate: extensive QA)
- Deployment issues (mitigate: staging environment testing)

**Estimated Effort:** Full team, 3 weeks

---

## 17. FOLDER STRUCTURE

```
loopra/
├── .agent/
│   ├── rules/
│   │   ├── architecture.md
│   │   ├── code-styles.md
│   │   ├── design-styles.md
│   │   └── security.md
│   ├── skills/
│   ├── workflows/
│   └── AGENTS.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── signup/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── verify-email/
│   │   │   └── page.tsx
│   │   └── password-reset/
│   │       ├── page.tsx
│   │       └── [token]/
│   │           └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx (sidebar + main)
│   │   ├── page.tsx (dashboard home)
│   │   ├── audience/
│   │   │   ├── page.tsx (overview)
│   │   │   ├── subscribers/
│   │   │   │   ├── page.tsx (list)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx (detail)
│   │   │   ├── segments/
│   │   │   │   └── page.tsx
│   │   │   └── import/
│   │   │       └── page.tsx
│   │   │
│   │   ├── forms/
│   │   │   ├── page.tsx (list)
│   │   │   └── [id]/
│   │   │       ├── page.tsx (builder)
│   │   │       ├── analytics/
│   │   │       │   └── page.tsx
│   │   │       └── embed/
│   │   │           └── page.tsx
│   │   │
│   │   ├── campaigns/
│   │   │   ├── page.tsx (list)
│   │   │   ├── new/
│   │   │   │   └── page.tsx (create)
│   │   │   └── [id]/
│   │   │       ├── edit/
│   │   │       │   └── page.tsx
│   │   │       ├── send/
│   │   │       │   └── page.tsx
│   │   │       ├── schedule/
│   │   │       │   └── page.tsx
│   │   │       └── analytics/
│   │   │           └── page.tsx
│   │   │
│   │   ├── loops/
│   │   │   ├── page.tsx (list)
│   │   │   └── [id]/
│   │   │       ├── builder/
│   │   │       │   └── page.tsx
│   │   │       ├── logs/
│   │   │       │   └── page.tsx
│   │   │       └── settings/
│   │   │           └── page.tsx
│   │   │
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   │
│   │   └── settings/
│   │       ├── page.tsx (account)
│   │       ├── workspace/
│   │       │   └── page.tsx
│   │       ├── team/
│   │       │   └── page.tsx
│   │       └── billing/
│   │           └── page.tsx
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/
│   │   │   │   └── route.ts
│   │   │   ├── login/
│   │   │   │   └── route.ts
│   │   │   ├── logout/
│   │   │   │   └── route.ts
│   │   │   ├── verify-email/
│   │   │   │   └── route.ts
│   │   │   └── password-reset/
│   │   │       └── route.ts
│   │   │
│   │   ├── audience/
│   │   │   ├── route.ts (GET, POST)
│   │   │   ├── [id]/
│   │   │   │   └── route.ts (GET, PATCH, DELETE)
│   │   │   ├── bulk-import/
│   │   │   │   └── route.ts
│   │   │   └── export/
│   │   │       └── route.ts
│   │   │
│   │   ├── segments/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts
│   │   │   │   ├── members/
│   │   │   │   │   └── route.ts
│   │   │   │   └── recompute/
│   │   │   │       └── route.ts
│   │   │
│   │   ├── forms/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts
│   │   │   │   ├── embed/
│   │   │   │   │   └── route.ts
│   │   │   │   └── submissions/
│   │   │   │       └── route.ts
│   │   │
│   │   ├── embed/
│   │   │   └── forms/
│   │   │       ├── [formId]/
│   │   │       │   └── route.ts (POST - public)
│   │   │       └── [formId].js
│   │   │           └── route.ts (GET - embed script)
│   │   │
│   │   ├── campaigns/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts
│   │   │   │   ├── send/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── schedule/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── analytics/
│   │   │   │   │   └── route.ts
│   │   │   │   └── duplicate/
│   │   │   │       └── route.ts
│   │   │
│   │   ├── loops/
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts
│   │   │   │   ├── publish/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── pause/
│   │   │   │   │   └── route.ts
│   │   │   │   └── executions/
│   │   │   │       ├── route.ts
│   │   │   │       └── [executionId]/
│   │   │   │           └── route.ts
│   │   │
│   │   ├── ai/
│   │   │   ├── generate-newsletter/
│   │   │   │   └── route.ts
│   │   │   ├── generate-subject/
│   │   │   │   └── route.ts
│   │   │   └── generate-template/
│   │   │       └── route.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── dashboard/
│   │   │   │   └── route.ts
│   │   │   ├── campaigns/
│   │   │   │   └── route.ts
│   │   │   ├── subscribers/
│   │   │   │   └── route.ts
│   │   │   └── forms/
│   │   │       └── route.ts
│   │   │
│   │   ├── billing/
│   │   │   ├── plans/
│   │   │   │   └── route.ts
│   │   │   ├── checkout/
│   │   │   │   └── route.ts
│   │   │   ├── subscription/
│   │   │   │   └── route.ts
│   │   │   ├── upgrade/
│   │   │   │   └── route.ts
│   │   │   └── cancel/
│   │   │       └── route.ts
│   │   │
│   │   └── webhooks/
│   │       ├── flutterwave/
│   │       │   └── route.ts
│   │       └── resend/
│   │           └── route.ts
│   │
│   ├── (marketing)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── features/
│   │   │   └── page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   └── contact/
│   │       └── page.tsx
│   │
│   ├── middleware.ts
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx (shadcn/ui)
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Table.tsx
│   │   ├── Badge.tsx
│   │   ├── Alert.tsx
│   │   └── ... (shadcn/ui components)
│   │
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TopNav.tsx
│   │   ├── Footer.tsx
│   │   └── AuthLayout.tsx
│   │
│   ├── shared/
│   │   ├── ConfirmDialog.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── SkeletonLoader.tsx
│   │   └── Breadcrumbs.tsx
│   │
│   ├── forms/
│   │   ├── FormBuilder.tsx
│   │   ├── FormField.tsx
│   │   ├── TagInput.tsx
│   │   ├── SegmentBuilder.tsx
│   │   └── EmailEditor.tsx
│   │
│   ├── data-tables/
│   │   ├── SubscriberTable.tsx
│   │   ├── CampaignTable.tsx
│   │   ├── FormTable.tsx
│   │   └── DataTable.tsx (generic)
│   │
│   ├── analytics/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── KPICard.tsx
│   │   ├── MetricTable.tsx
│   │   └── DateRangePicker.tsx
│   │
│   ├── dashboard/
│   │   ├── DashboardKPIs.tsx
│   │   ├── RecentCampaigns.tsx
│   │   ├── SubscriberChart.tsx
│   │   └── QuickActions.tsx
│   │
│   ├── campaigns/
│   │   ├── CampaignEditor.tsx
│   │   ├── TemplateSelector.tsx
│   │   ├── SendPreview.tsx
│   │   └── ScheduleForm.tsx
│   │
│   ├── loops/
│   │   ├── LoopCanvas.tsx
│   │   ├── LoopTriggerConfig.tsx
│   │   ├── LoopActionNode.tsx
│   │   └── ExecutionLogs.tsx
│   │
│   └── marketing/
│       ├── Hero.tsx
│       ├── Features.tsx
│       ├── Pricing.tsx
│       └── CTA.tsx
│
├── lib/
│   ├── db.ts (Prisma singleton)
│   ├── auth.ts (NextAuth helpers, getServerSession)
│   ├── resend.ts (Resend client)
│   ├── flutterwave.ts (Payment helpers)
│   ├── ai.ts (OpenAI/Anthropic client)
│   ├── analytics.ts (Event tracking)
│   ├── loops-engine.ts (Loop execution)
│   ├── utils.ts (general utilities)
│   ├── validators.ts (Zod schemas)
│   └── constants.ts (app-wide constants)
│
├── hooks/
│   ├── useAuth.ts
│   ├── useWorkspace.ts
│   ├── useSubscribers.ts
│   ├── useCampaigns.ts
│   ├── useLoops.ts
│   ├── useAnalytics.ts
│   ├── usePagination.ts
│   └── useDebounce.ts
│
├── types/
│   ├── index.ts (shared types)
│   ├── auth.ts
│   ├── audience.ts
│   ├── campaigns.ts
│   ├── loops.ts
│   ├── forms.ts
│   ├── analytics.ts
│   ├── billing.ts
│   └── schemas/
│       ├── auth.ts (Zod schemas)
│       ├── audience.ts
│       ├── campaigns.ts
│       └── ... (schema files)
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── 001_init/
│       ├── 002_add_campaigns/
│       └── ...
│
├── tests/
│   ├── unit/
│   │   ├── auth.test.ts
│   │   ├── audience.test.ts
│   │   └── ...
│   ├── integration/
│   │   ├── api.test.ts
│   │   ├── loops-engine.test.ts
│   │   └── ...
│   └── e2e/
│       ├── signup-login.test.ts
│       ├── create-campaign.test.ts
│       └── ...
│
├── public/
│   ├── logo.svg
│   ├── favicon.ico
│   ├── robots.txt
│   ├── sitemap.xml
│   └── images/
│       ├── hero.png
│       ├── features/
│       └── ...
│
├── tokens/
│   ├── color-tokens.tokens.json
│   ├── design-tokens.tokens.json
│   ├── colors.css
│   ├── typography.css
│   ├── convert-tokens-to-css.js
│   └── README.md
│
├── .env.local (example)
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

---

## 18. IMPLEMENTATION ORDER

### Sequence (Critical Path)

1. **Project Initialization**
   - `npm create next-app@latest`
   - Configure TypeScript (strict mode)
   - Setup Tailwind CSS
   - Configure Prisma + PostgreSQL
   - Install dependencies (shadcn/ui, Zod, NextAuth.js)

2. **Core Infrastructure**
   - Database schema (Prisma schema.prisma)
   - Prisma migrations
   - Environment variables setup (.env.local)
   - Lib modules (db.ts, auth.ts, utils.ts)

3. **Authentication (Phase 1 Start)**
   - NextAuth.js setup
   - Signup page + route
   - Login page + route
   - Password reset flow
   - Email verification (with Resend)
   - Session management

4. **Workspace & Users**
   - Workspace CRUD
   - Workspace members / roles
   - Team invitations
   - Settings pages

5. **Audience System (Phase 2 Start)**
   - Subscriber CRUD APIs
   - Subscriber list UI + table
   - Subscriber detail page
   - Tags system
   - Bulk import (CSV uploader)
   - Segment creation + builder
   - Segment auto-evaluation

6. **Forms System**
   - Form builder UI
   - Form fields + validation
   - Embed code generation
   - Public form submission endpoint
   - Form analytics

7. **Campaign System (Phase 3 Start)**
   - Campaign CRUD APIs
   - Email editor component
   - Template library
   - Send campaign endpoint
   - Schedule campaign endpoint
   - Resend integration (send emails)
   - Email tracking (opens, clicks)
   - Campaign analytics

8. **Loops System (Phase 4 Start)**
   - Loop builder UI (canvas)
   - Trigger configuration
   - Action configuration
   - Execution engine (background job)
   - Retry logic
   - Execution logs

9. **AI Features (Phase 5 Start)**
   - OpenAI / Anthropic integration
   - Newsletter generation API
   - Subject line generation
   - Tone adjustment
   - Cost tracking

10. **Billing System (Phase 6 Start)**
    - Subscription plans table
    - Flutterwave integration
    - Checkout flow
    - Webhook verification
    - Subscription management
    - Usage enforcement

11. **Analytics (Phase 7 Start)**
    - Event tracking system
    - Analytics aggregation job
    - Dashboard metrics
    - Reports + export

12. **Testing & QA (Phase 8)**
    - Unit tests (lib functions, validators)
    - Integration tests (API routes)
    - E2E tests (user flows)
    - Performance testing
    - Security audit

13. **Deployment & Monitoring**
    - CI/CD pipeline (GitHub Actions)
    - Staging environment
    - Sentry error tracking
    - Monitoring & alerting
    - Production deployment

---

### Parallel Work Opportunities

**Concurrent Tasks (can work in parallel):**
- Phases 2 & 3: Audience + Campaigns (after Phase 1)
- Phases 4 & 5: Loops + AI (after Phase 3)
- Phase 8 (testing): Can start after Phase 4
- CI/CD setup: Can start after Phase 1

**Dependency Chain (must be sequential):**
```
Phase 1 (Foundation)
    ↓
Phase 2 (Audience) ← Phase 3 (Campaigns) can start here
    ↓
Phase 3 (Campaigns)
    ↓
Phase 4 (Loops) ← Phase 5 (AI) can run parallel
    ↓
Phase 6 (Billing)
    ↓
Phase 7 (Analytics)
    ↓
Phase 8 (Production)
```

---

## Summary: Estimated Timeline

| Phase | Duration | Team Size | Critical? | Blocker |
|---|---|---|---|---|
| 1: Foundation | 4 weeks | 2-3 devs | Yes | None |
| 2: Audience | 4 weeks | 3 devs | Yes | Phase 1 |
| 3: Campaigns | 4 weeks | 2 devs | Yes | Phase 2 |
| 4: Loops | 5 weeks | 2-3 devs | Yes | Phase 3 |
| 5: AI | 3 weeks | 1 dev | No | Phase 3 |
| 6: Billing | 3 weeks | 2 devs | Yes | Phase 5 |
| 7: Analytics | 2 weeks | 1-2 devs | No | Phase 6 |
| 8: Production | 3 weeks | Full team | Yes | Phases 1-7 |

**Total Estimated Duration: 28 weeks (~7 months) with 2-3 full-time developers**

---

## Design System Integration Notes

**Mandatory References:**
- `.agent/rules/architecture.md` — Routing, data access, state management
- `.agent/rules/code-styles.md` — TypeScript, naming, imports, functions
- `.agent/rules/design-styles.md` — Colors, typography, spacing
- `.agent/rules/security.md` — Auth, validation, secrets
- `tokens/colors.css` — All color values (never hardcode hex)
- `tokens/typography.css` — All font styling (use utility classes)

**Every component must:**
1. Use semantic color roles from `colors.css`
2. Use typography classes from `typography.css`
3. Follow code style conventions
4. Implement proper error handling
5. Enforce multi-tenant isolation
6. Validate all inputs with Zod

---

## Next Steps (Ready for Review)

This implementation plan is **complete and ready for team review**. 

**Before proceeding to development:**
1. ✅ Review architecture with tech leads
2. ✅ Validate database design with DBA
3. ✅ Security review of auth flows
4. ✅ Confirm timeline and resource allocation
5. ✅ Finalize design system tokens with design team
6. ✅ Get stakeholder sign-off on feature scope

**Once approved, development begins with Phase 1: Foundation**

---

**Document Status:** ✅ Complete - Planning Phase  
**Author:** Senior Engineer  
**Date:** June 8, 2026  
**Version:** 1.0
