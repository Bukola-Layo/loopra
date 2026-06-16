# Security Rules

## Authentication & Sessions

- Use **NextAuth.js** (or Auth.js v5) for session management.
- Sessions are stored server-side (database adapter). Never store sensitive data in JWTs.
- All dashboard routes must be protected by a middleware check:

```ts
// middleware.ts
export const config = { matcher: ["/dashboard/:path*", "/api/:path*"] };
```

- Redirect unauthenticated users to `/login` with a `callbackUrl` parameter.
- Invalidate the session on password change or account deactivation.

---

## Authorization

- Every API route must verify the authenticated user owns (or has access to) the resource being accessed.
- Never trust a `workspaceId` or `userId` from the request body — always derive it from the session.

```ts
// ✅ Correct
const session = await getServerSession();
const campaigns = await db.campaign.findMany({
  where: { workspaceId: session.user.workspaceId },
});

// ❌ Never do this
const { workspaceId } = await req.json();
const campaigns = await db.campaign.findMany({ where: { workspaceId } });
```

- Use row-level checks: before updating or deleting any record, verify it belongs to the current workspace.

---

## Input Validation

- **All** API inputs are validated with Zod before touching the database or external services.
- Strip unknown fields: use `z.object({...}).strict()` or `.strip()` (default).
- Sanitize any HTML content before storage or rendering to prevent XSS.
- Never use `dangerouslySetInnerHTML` unless content is sanitized via DOMPurify or equivalent.

---

## Secrets & Environment Variables

- Secrets live in `.env.local` (dev) and Vercel environment variables (prod). Never in code.
- Never commit `.env.local`. Ensure `.gitignore` includes it.
- Never log secrets, API keys, or tokens — not even at debug level.
- Rotate secrets immediately if accidentally exposed.

| Secret | Scope |
|---|---|
| `DATABASE_URL` | Server only |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Server only |
| `FLUTTERWAVE_SECRET_KEY` | Server only |
| `NEXTAUTH_SECRET` | Server only |
| `FLUTTERWAVE_PUBLIC_KEY` | Client-safe (prefixed `NEXT_PUBLIC_`) |

---

## Webhook Security

All inbound webhooks (Flutterwave, Resend events) must be signature-verified before processing.

```ts
// Flutterwave webhook verification
import { createHmac } from "crypto";

export function verifyFlutterwaveWebhook(
  payload: string,
  signature: string
): boolean {
  const hash = createHmac("sha256", process.env.FLUTTERWAVE_WEBHOOK_SECRET!)
    .update(payload)
    .digest("hex");
  return hash === signature;
}
```

- Return `200` immediately after verifying. Process the event asynchronously (queue or background job).
- Return `400` for invalid signatures — never `401` or `403` (these reveal the route exists and is auth-protected).

---

## Email & Content Security

- Never send emails from a route handler that has not verified the caller is authenticated and authorized.
- Rate-limit bulk send triggers to prevent abuse.
- Unsubscribe links must be cryptographically signed (HMAC) and not guessable.
- Form embeds are public — implement CAPTCHA or honeypot fields to prevent spam subscriber injection.

---

## Database Security

- Use parameterized queries only (Prisma does this by default — never use `$queryRawUnsafe`).
- Do not expose internal database IDs in URLs where possible; use ULIDs or UUIDs.
- Soft-delete subscribers and sensitive records — never hard-delete immediately.

---

## API Rate Limiting

- Protect public endpoints (form submissions, auth) with rate limiting.
- Use Vercel's edge middleware or an `upstash/ratelimit` integration.
- Suggested limits:
  - Auth endpoints: 10 req/min per IP
  - Form submissions: 5 req/min per IP
  - Campaign send trigger: 1 req/min per user

---

## CORS

- The main app API routes are same-origin — CORS is not required.
- The `/embed/` public routes and `/api/forms/submit` must allow cross-origin requests (for website embeds):

```ts
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
```

---

## Dependency Security

- Run `npm audit` before each release.
- Pin critical dependencies (auth, crypto, DB driver) to exact versions.
- Never install packages with known high-severity CVEs without a documented mitigation.