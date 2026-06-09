# Code Style Rules

## Language

- **TypeScript strict mode** is required. `"strict": true` in `tsconfig.json`.
- No `any` types. Use `unknown` and narrow. If you must escape, add `// eslint-disable-next-line` with a comment explaining why.
- All functions and exported values must have explicit return types.

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `SubscriberTable.tsx` |
| Files (utils/lib) | kebab-case | `format-date.ts` |
| Files (API routes) | `route.ts` | `app/api/audience/route.ts` |
| React components | PascalCase | `function AudienceCard()` |
| Hooks | camelCase + `use` prefix | `useSubscriberCount` |
| Types / Interfaces | PascalCase | `type SubscriberRow` |
| Zod schemas | camelCase + `Schema` suffix | `const createCampaignSchema` |
| Constants | SCREAMING_SNAKE | `MAX_SUBSCRIBERS_FREE` |
| DB columns (Prisma) | camelCase | `createdAt`, `userId` |

## Imports

- Use absolute imports with `@/` alias (configured in `tsconfig.json`).
- Order: React → Next.js → third-party → internal `@/lib` → internal `@/components` → types → styles.
- No default exports except for Next.js pages/layouts and React components.

```ts
import { useState } from "react";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { SubscriberCard } from "@/components/audience/SubscriberCard";
import type { SubscriberRow } from "@/types/audience";
```

## Functions

- Prefer `async/await` over `.then()` chains.
- Use early returns to reduce nesting.
- Keep functions under 40 lines. Extract helpers freely.
- Arrow functions for callbacks; `function` declarations for named top-level functions.

```ts
// ✅ Good
export async function getSubscribers(workspaceId: string): Promise<SubscriberRow[]> {
  if (!workspaceId) return [];
  const rows = await db.subscriber.findMany({ where: { workspaceId } });
  return rows.map(toSubscriberRow);
}

// ❌ Avoid
export const getSubscribers = async (workspaceId) => {
  return db.subscriber.findMany({ where: { workspaceId } }).then(rows => rows.map(toSubscriberRow));
};
```

## React Components

- One component per file.
- Props type defined inline above the component using `type`, not `interface`.
- Destructure props at the function signature.
- No prop drilling beyond 2 levels — lift state or use context/composition.

```tsx
type SubscriberBadgeProps = {
  count: number;
  plan: "free" | "starter" | "pro";
};

export function SubscriberBadge({ count, plan }: SubscriberBadgeProps) {
  return <span>{count} subscribers</span>;
}
```

## Zod Validation

- Every API route that accepts a body must validate with Zod.
- Define schemas in `types/` and import them into both the API route and the client form.
- Use `.safeParse()` and return 422 on failure.

```ts
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

const result = schema.safeParse(await req.json());
if (!result.success) {
  return NextResponse.json({ error: result.error.flatten() }, { status: 422 });
}
```

## Formatting

- Prettier with default settings + `semi: true`, `singleQuote: false`, `trailingComma: "es5"`.
- 2-space indentation.
- Max line length: 100 characters.
- Run `prettier --write` before committing.

## Comments

- Write comments for **why**, not **what**.
- Prefer self-documenting variable/function names over inline comments.
- Use `// TODO:` and `// FIXME:` tags for known issues — include a ticket reference when possible.

## Domain Language in Code

Use Loopra's product vocabulary consistently in code:

| Product term | Use in code |
|---|---|
| Loop | `loop`, `loopId`, `LoopTrigger` |
| Subscriber | `subscriber`, `subscriberId` |
| Audience | `audience`, `audienceId` |
| Campaign | `campaign`, `campaignId` |
| Form | `form`, `formId` |

Never use generic alternatives like "workflow", "contact list", or "blast" in identifiers.