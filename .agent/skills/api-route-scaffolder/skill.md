# Skill: API Route Scaffolder

## Purpose

Scaffold consistent, secure Next.js Route Handler files for Loopra following the architecture, code style, and security rules.

---

## When to Use This Skill

- Adding a new resource API (e.g., `audiences`, `loops`, `campaigns`)
- Adding a new action endpoint (e.g., `campaigns/[id]/send`)
- Adding a webhook receiver

---

## Pre-Checks Before Scaffolding

1. Read `rules/architecture.md` — confirm the route path and HTTP method conventions.
2. Read `rules/security.md` — every route needs auth + ownership checks.
3. Read `rules/code-styles.md` — Zod validation is mandatory.

---

## File Location

```
app/api/[resource]/route.ts          → collection: GET (list), POST (create)
app/api/[resource]/[id]/route.ts     → item: GET, PATCH, DELETE
app/api/[resource]/[id]/[action]/route.ts  → action: POST only
```

---

## Route Handler Template (Collection)

```ts
// app/api/[resource]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// --- Validation schema ---
const createSchema = z.object({
  name: z.string().min(1).max(100),
  // ...
});

// GET /api/[resource]
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db.[resource].findMany({
    where: { workspaceId: session.user.workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

// POST /api/[resource]
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
  }

  const item = await db.[resource].create({
    data: {
      ...result.data,
      workspaceId: session.user.workspaceId,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
```

---

## Route Handler Template (Item)

```ts
// app/api/[resource]/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  // ...
});

type Params = { params: { id: string } };

// GET /api/[resource]/[id]
export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await db.[resource].findFirst({
    where: { id: params.id, workspaceId: session.user.workspaceId },
  });

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(item);
}

// PATCH /api/[resource]/[id]
export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ownership check
  const existing = await db.[resource].findFirst({
    where: { id: params.id, workspaceId: session.user.workspaceId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const result = updateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 422 });

  const updated = await db.[resource].update({
    where: { id: params.id },
    data: result.data,
  });

  return NextResponse.json(updated);
}

// DELETE /api/[resource]/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db.[resource].findFirst({
    where: { id: params.id, workspaceId: session.user.workspaceId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.[resource].delete({ where: { id: params.id } });

  return new NextResponse(null, { status: 204 });
}
```

---

## Webhook Route Template

See `skills/flutterwave-integration/webhook-handler.ts` for a full example.

Key differences from standard routes:
- No session auth — use signature verification instead.
- Return `200` immediately on success.
- Return `500` (not 400) for processing failures so the sender retries.

---

## Response Conventions

| Situation | Status | Body |
|---|---|---|
| Success (read) | 200 | Resource or array |
| Success (created) | 201 | Created resource |
| Success (deleted) | 204 | Empty |
| Validation error | 422 | `{ error: ZodFlattenedError }` |
| Auth missing | 401 | `{ error: "Unauthorized" }` |
| Not owned | 404 | `{ error: "Not found" }` (don't leak existence) |
| Plan limit | 403 | `{ error: "...", code: "PLAN_LIMIT" }` |
| Server error | 500 | `{ error: "Internal server error" }` |

---

## Checklist Before Committing

- [ ] Session checked and returns 401 if missing
- [ ] Ownership verified with `workspaceId` from session (not request)
- [ ] All inputs validated with Zod `.safeParse()`
- [ ] Correct HTTP status codes used
- [ ] No raw Prisma model returned — map to DTO if needed
- [ ] No secrets or internal details in error responses
- [ ] File is in the correct `app/api/` path