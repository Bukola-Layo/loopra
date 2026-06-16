# Architecture Rules

## Project Structure

```
loopra/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # Auth group: login, signup, verify
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── audience/            # Subscriber & segment management
│   │   ├── campaigns/           # Newsletter creation & sending
│   │   ├── forms/               # Form builder & embeds
│   │   ├── loops/               # Automation workflows
│   │   ├── analytics/           # Stats & reporting
│   │   └── settings/            # Account, billing, integrations
│   ├── api/                     # Route Handlers
│   │   ├── auth/
│   │   ├── audience/
│   │   ├── campaigns/
│   │   ├── forms/
│   │   ├── loops/
│   │   ├── webhooks/            # Flutterwave, Resend, etc.
│   │   └── ai/
│   └── embed/                   # Public-facing form embeds (no auth)
├── components/
│   ├── ui/                      # Primitive design system components
│   ├── shared/                  # Reusable cross-feature components
│   └── [feature]/               # Feature-scoped components
├── lib/
│   ├── db.ts                    # Prisma client singleton
│   ├── mail.ts                  # Nodemailer transporter
│   ├── flutterwave.ts           # Flutterwave helpers
│   ├── auth.ts                  # Session / auth helpers
│   └── utils.ts                 # General utilities
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── types/                       # Shared TypeScript types & Zod schemas
└── hooks/                       # Custom React hooks
```

---

## Routing Conventions

- Use **route groups** `(group)` to share layouts without adding URL segments.
- Dashboard routes live under `(dashboard)/` and share a sidebar layout.
- Auth routes live under `(auth)/` with a centered card layout.
- Public embed routes live under `embed/[formId]/` — no auth required.

## API Routes (Route Handlers)

- All API routes live under `app/api/`.
- Each resource gets its own folder: `app/api/audience/route.ts`, `app/api/audience/[id]/route.ts`.
- Route handlers export named HTTP method functions: `GET`, `POST`, `PATCH`, `DELETE`.
- Always return a typed `NextResponse.json(...)`.
- Validate all input with Zod before touching the database.

```ts
// app/api/audience/route.ts
export async function GET(req: Request) { ... }
export async function POST(req: Request) { ... }
```

## Data Access

- **Never** query the database directly in a Server Component or page — use a `lib/data/` function or an internal API route.
- All DB access goes through Prisma via the singleton in `lib/db.ts`.
- Use `prisma.$transaction([...])` for multi-step writes.
- Do not expose raw Prisma models to the client — map to a typed DTO.

## Server vs Client Components

- Default to **Server Components** for data fetching and layout.
- Mark a component `"use client"` only when it needs interactivity, browser APIs, or hooks.
- Never fetch data inside a Client Component — pass it as props from a Server Component or use SWR/React Query for client-side refresh.

## Environment Variables

All secrets must be in `.env.local` (local) or Vercel environment variables (production).

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Email delivery (Nodemailer) |
| `FLUTTERWAVE_SECRET_KEY` | Payment processing |
| `FLUTTERWAVE_PUBLIC_KEY` | Client-side payment init |
| `FLUTTERWAVE_WEBHOOK_SECRET` | Webhook signature verification |
| `NEXTAUTH_SECRET` | Session signing |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL |

Never prefix a secret with `NEXT_PUBLIC_` — that exposes it to the browser.

## State Management

- Prefer **URL state** (searchParams) for filters, pagination, and tabs.
- Use **React state** (`useState`) for local ephemeral UI state.
- Use **React Context** sparingly — only for auth session and theme.
- No global state library (Redux, Zustand) unless a clear need arises.

## Error Handling

- API routes return structured JSON errors: `{ error: string, code?: string }`.
- Use HTTP status codes correctly: 400 (bad input), 401 (unauthenticated), 403 (forbidden), 404 (not found), 422 (validation), 500 (server error).
- Never expose stack traces or internal errors to the client.
- Log server-side errors to console in development; use a structured logger in production.