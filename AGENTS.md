# Loopra — Agent Context

## What is Loopra?

Loopra is a modern communication automation platform for creators, startups, and small businesses. It lets users collect subscribers, send newsletters, build automation workflows ("Loops"), segment audiences, and leverage AI-assisted content generation.

**Tagline:** _"The easiest way to grow and automate audience communication."_

Product Vision

Loopra simplifies audience communication through:

Newsletter campaigns
Audience segmentation
Forms and lead capture
Automation workflows ("Loops")
AI-assisted content creation
Analytics and reporting

Future phases include:

SMS campaigns
WhatsApp communication
Multi-channel automation
Core Principles
Simplicity First
Beginner Friendly
Automation Focused
Scalable Architecture
Multi-Tenant Design
Security by Default
---

## Tech Stack

| Layer        | Technology                     |
|--------------|-------------------------------|
| Frontend     | Next.js 14+ (App Router)      |
| Backend      | Next.js Route Handlers        |
| Database     | PostgreSQL                    |
| ORM          | Prisma                        |
| Email        | Resend                        |
| Hosting      | Vercel                        |
| Payments     | Flutterwave                   |
| Language     | TypeScript (strict)           |
| Styling      | Tailwind CSS                  |

---

## Key Domain Concepts

- **Loop** — an automation workflow (trigger → actions). This is the product's core differentiator. Always use "Loop/Loops", never "workflow".
- **Subscriber** — a contact in an audience list.
- **Audience** — a collection of subscribers with optional tags and segments.
- **Campaign** — a newsletter/bulk email send.
- **Form** — an audience capture embed or hosted page.

---

## Rules

All agent rules live in `.agents/rules/`:

- [`architecture.md`](rules/architecture.md) — project structure, routing, data access patterns
- [`code-styles.md`](rules/code-styles.md) — TypeScript, naming, formatting conventions
- [`design-system.md`](rules/design-system.md) — UI components, tokens, patterns
- [`security.md`](rules/security.md) — auth, validation, secrets, API security

## Skills

Reusable, executable knowledge modules in `.agents/skills/`:

- [`flutterwave-integration/`](skills/flutterwave-integration/SKILL.md) — payments, webhooks, plan gating
- [`component-builder/`](skills/component-builder/SKILL.md) — scaffolding UI components
- [`api-route-scaffolder/`](skills/api-route-scaffolder/SKILL.md) — scaffolding Next.js route handlers
- [`db-migration-runner/`](skills/db-migration-runner/SKILL.md) — Prisma schema changes and migrations

## Workflows

Step-by-step task playbooks in `.agents/workflows/`:

- [`new-component.md`](workflows/new-component.md) — create a new UI component end-to-end
- [`new-api-route.md`](workflows/new-api-route.md) — create a new API route end-to-end

---

## Product Phases

| Phase | Scope |
|-------|-------|
| 1 — MVP | Auth, newsletters, forms, segmentation, basic Loops, templates |
| 2 | AI generation, scheduling, analytics |
| 3 | SMS, WhatsApp OTP, multi-channel |
| 4 | Team collab, template marketplace, API ecosystem |

---

## Core Principles

1. **Simplicity first** — every feature should reduce friction, not add it.
2. **Guided over powerful** — prefer opinionated defaults over endless config.
3. **Creators and small biz** — not enterprise. Never gold-plate.
4. **Loops, not workflows** — language matters; use the product's vocabulary.