# Skill: DB Migration Runner

## Purpose

Safely make Prisma schema changes and run database migrations for Loopra's PostgreSQL database, following conventions that keep the schema clean and migrations reversible.

---

## When to Use This Skill

- Adding a new model to `prisma/schema.prisma`
- Adding, renaming, or removing fields on an existing model
- Adding indexes, unique constraints, or relations
- Seeding reference data after a migration

---

## Tech Stack

- **ORM:** Prisma
- **Database:** PostgreSQL (Vercel Postgres in production)
- **Migration tool:** `prisma migrate dev` (local), `prisma migrate deploy` (CI/CD)

---

## Step-by-Step: Adding a New Model

### 1. Edit `prisma/schema.prisma`

Follow this model template:

```prisma
model [ModelName] {
  id          String    @id @default(cuid())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Workspace relation (almost every model needs this)
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Your fields here
  name        String
  status      String    @default("active")

  // Indexes
  @@index([workspaceId])
}
```

Rules:
- Always use `cuid()` for IDs — not `autoincrement()` (exposes record count).
- Always include `createdAt` and `updatedAt`.
- Always add `@@index([workspaceId])` on workspace-scoped models.
- Use `onDelete: Cascade` for workspace-owned resources so cleanup is automatic.
- Use `String` for status/type fields with a `@default` — prefer an enum only if values are fixed and exhaustive.

### 2. Run the migration locally

```bash
npx prisma migrate dev --name add_[model_name]
```

This will:
- Generate a SQL migration file in `prisma/migrations/`
- Apply it to your local database
- Regenerate the Prisma client

### 3. Verify the generated SQL

Always open the generated migration file and review it before committing:

```bash
cat prisma/migrations/<timestamp>_add_[model_name]/migration.sql
```

Watch for:
- Accidental `DROP COLUMN` or `DROP TABLE` statements
- Missing `NOT NULL` vs nullable mismatches
- Missing indexes on foreign keys

### 4. Update the Prisma client type (if needed)

If you're adding computed or DTO types, add them to `types/[feature].ts`:

```ts
import type { Prisma } from "@prisma/client";

// Select type — useful for API responses
export type LoopRow = Prisma.LoopGetPayload<{
  select: { id: true; name: true; status: true; createdAt: true };
}>;
```

---

## Step-by-Step: Adding a Field to an Existing Model

1. Add the field in `schema.prisma`.
2. If the field is required (`NOT NULL`), **you must provide a default** or the migration will fail on existing rows:

```prisma
// ✅ Safe — has a default
emailsSent  Int @default(0)

// ❌ Dangerous — will fail if there are existing rows
emailsSent  Int
```

3. Run `npx prisma migrate dev --name add_[field]_to_[model]`.
4. Review the SQL.

---

## Renaming a Field

Prisma cannot detect renames automatically — it will drop the old column and add a new one, **losing data**.

To rename safely:

1. Add the new field alongside the old one.
2. Write a data migration script to copy values.
3. Remove the old field in a follow-up migration.

---

## Production Deployment

Migrations run automatically in CI via:

```bash
npx prisma migrate deploy
```

This command:
- Does **not** create new migrations — only applies pending ones.
- Is safe to run on every deployment.
- Never resets the database.

Add this to the Vercel build command or a GitHub Actions step before app startup.

---

## Seeding

For reference data or test data:

```ts
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  await db.plan.upsert({
    where: { slug: "free" },
    update: {},
    create: { slug: "free", name: "Free", subscriberLimit: 500 },
  });
}

main().catch(console.error).finally(() => db.$disconnect());
```

Run with:

```bash
npx prisma db seed
```

Configure in `package.json`:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

---

## Common Commands Reference

| Command | Purpose |
|---|---|
| `npx prisma migrate dev --name <name>` | Create + apply migration (local) |
| `npx prisma migrate deploy` | Apply pending migrations (prod/CI) |
| `npx prisma migrate reset` | Reset local DB + re-apply all migrations |
| `npx prisma generate` | Regenerate Prisma client after schema change |
| `npx prisma studio` | Open visual DB browser |
| `npx prisma db seed` | Run seed script |
| `npx prisma validate` | Validate schema without running migration |

---

## Checklist Before Committing a Migration

- [ ] Migration SQL reviewed — no accidental drops
- [ ] New required fields have a `@default`
- [ ] Foreign key fields have `@@index`
- [ ] `prisma generate` run and client is up to date
- [ ] Migration name is descriptive: `add_subscribers_table`, `add_status_to_campaigns`
- [ ] Migration file committed alongside `schema.prisma` changes