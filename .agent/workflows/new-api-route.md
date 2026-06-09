# Workflow: New API Route

Use this workflow every time you need to create a new Next.js Route Handler for Loopra.

---

## 1. Plan the Route

Answer these questions before writing code:

| Question | Decision |
|---|---|
| What resource is this for? | Determines the path: `app/api/[resource]/` |
| Collection or item? | `route.ts` vs `[id]/route.ts` |
| What HTTP methods are needed? | Export only the methods you use |
| Does it need auth? | Yes, unless it's a public embed or webhook |
| Is it a webhook? | Use the webhook template + signature verification |

**Path conventions:**
```
app/api/audience/route.ts              → GET list, POST create
app/api/audience/[id]/route.ts         → GET one, PATCH update, DELETE
app/api/campaigns/[id]/send/route.ts   → POST action
app/api/webhooks/flutterwave/route.ts  → POST webhook (no session auth)
app/api/forms/[id]/submit/route.ts     → POST public (no session auth, rate-limited)
```

---

## 2. Read the Rules

Before writing code, read:

- `.agents/rules/architecture.md` — route conventions, data access
- `.agents/rules/security.md` — auth, ownership checks, validation
- `.agents/rules/code-styles.md` — naming, TypeScript, Zod
- `.agents/skills/api-route-scaffolder/SKILL.md` — templates and response conventions

---

## 3. Define the Zod Schema

Create or update `types/[feature].ts`:

```ts
// types/[feature].ts
import { z } from "zod";

export const create[Resource]Schema = z.object({
  name: z.string().min(1).max(100),
  // ...
});

export type Create[Resource]Input = z.infer<typeof create[Resource]Schema>;
```

The same schema should be used in:
- The API route (server validation)
- The client form (via `zodResolver`)

---

## 4. Scaffold the Route File

Use the templates from `api-route-scaffolder/SKILL.md`.

**Every protected route must:**

```ts
// 1. Check session
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// 2. Derive workspaceId from session — NEVER from the request body
const workspaceId = session.user.workspaceId;

// 3. Verify ownership before updates/deletes
const existing = await db.[resource].findFirst({
  where: { id: params.id, workspaceId },
});
if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

// 4. Validate input
const result = schema.safeParse(body);
if (!result.success) return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
```

---

## 5. Check Plan Limits (If Applicable)

For resources with plan-gated limits (subscribers, campaigns, loops):

```ts
import { checkPlanLimit } from "@/lib/billing";

const check = await checkPlanLimit(workspaceId, "subscribers");
if (!check.allowed) {
  return NextResponse.json(
    { error: `Limit reached (${check.current}/${check.limit}). Upgrade your plan.`, code: "PLAN_LIMIT" },
    { status: 403 }
  );
}
```

---

## 6. Response Format

Use correct HTTP status codes (full reference in `api-route-scaffolder/SKILL.md`):

```ts
// List
return NextResponse.json(items);                              // 200

// Created
return NextResponse.json(item, { status: 201 });

// Updated
return NextResponse.json(updated);                            // 200

// Deleted
return new NextResponse(null, { status: 204 });

// Error
return NextResponse.json({ error: "message" }, { status: 4xx });
```

Never return Prisma model objects directly — map them to a DTO if needed.

---

## 7. Test the Route

Before committing, test manually with a REST client (e.g., Thunder Client, Insomnia, or `curl`):

- [ ] Authenticated request works correctly
- [ ] Unauthenticated request returns 401
- [ ] Wrong `workspaceId` returns 404 (not 403)
- [ ] Invalid body returns 422 with field-level errors
- [ ] Missing required fields return 422
- [ ] Correct status code on each method

---

## 8. Review Checklist

- [ ] File is in correct `app/api/` path
- [ ] Session checked on every protected method
- [ ] `workspaceId` derived from session (not request)
- [ ] Ownership verified before update/delete
- [ ] All inputs validated with Zod `.safeParse()`
- [ ] Plan limits checked (if applicable)
- [ ] Correct HTTP status codes
- [ ] No secrets, stack traces, or internal details in responses
- [ ] Zod schema lives in `types/` (shared with the client form)