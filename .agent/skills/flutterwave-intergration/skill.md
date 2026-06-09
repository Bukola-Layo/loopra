# Skill: Flutterwave Integration

## Purpose

Handle all payment-related functionality in Loopra: plan upgrades, subscription management, and webhook-driven billing state updates using Flutterwave as the payment provider.

---

## When to Use This Skill

- User initiates a plan upgrade (Free → Starter, Free → Pro, Starter → Pro)
- Processing a Flutterwave webhook event (payment success, subscription renewal, cancellation)
- Gating features based on the user's current plan
- Displaying billing information or invoices

---

## Environment Variables Required

```env
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...
```

---

## Plan Structure

```ts
// types/billing.ts
export type Plan = "free" | "starter" | "pro";

export const PLAN_LIMITS: Record<Plan, { subscribers: number; campaigns: number; loops: number }> = {
  free:    { subscribers: 500,    campaigns: 3,   loops: 1  },
  starter: { subscribers: 5000,   campaigns: 50,  loops: 10 },
  pro:     { subscribers: 50000,  campaigns: -1,  loops: -1 }, // -1 = unlimited
};

export const FLUTTERWAVE_PLAN_IDS: Record<Exclude<Plan, "free">, string> = {
  starter: process.env.FLW_PLAN_ID_STARTER!,
  pro:     process.env.FLW_PLAN_ID_PRO!,
};
```

---

## Initiating a Payment (Client Side)

Use the Flutterwave inline JS to open the payment modal:

```tsx
// components/billing/UpgradeButton.tsx
"use client";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";

type UpgradeButtonProps = {
  plan: "starter" | "pro";
  userEmail: string;
  userId: string;
  amount: number; // in NGN (or relevant currency)
};

export function UpgradeButton({ plan, userEmail, userId, amount }: UpgradeButtonProps) {
  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
    tx_ref: `loopra-${userId}-${Date.now()}`,
    amount,
    currency: "NGN",
    payment_options: "card,banktransfer,ussd",
    customer: { email: userEmail },
    customizations: {
      title: "Loopra",
      description: `Upgrade to ${plan} plan`,
      logo: "https://loopra.app/logo.png",
    },
    payment_plan: FLUTTERWAVE_PLAN_IDS[plan],
    meta: { userId, plan },
  };

  const handleFlutterPayment = useFlutterwave(config);

  return (
    <button
      onClick={() =>
        handleFlutterPayment({
          callback: (response) => {
            closePaymentModal();
            // Optimistically refresh — webhook will confirm
            window.location.reload();
          },
          onClose: () => {},
        })
      }
    >
      Upgrade to {plan}
    </button>
  );
}
```

---

## Webhook Handler

See `webhook-handler.ts` in this skill folder for the full implementation.

Key rules:
1. Always verify the `verif-hash` header before processing.
2. Return `200` immediately after verification.
3. Update `workspace.plan` and `workspace.planExpiresAt` based on event type.

---

## Plan Gating (Server Side)

```ts
// lib/billing.ts
import { db } from "@/lib/db";
import { PLAN_LIMITS, type Plan } from "@/types/billing";

export async function checkPlanLimit(
  workspaceId: string,
  resource: keyof typeof PLAN_LIMITS.free
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const workspace = await db.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { plan: true, _count: { select: { subscribers: true } } },
  });

  const limit = PLAN_LIMITS[workspace.plan as Plan][resource];
  const current = workspace._count[resource as "subscribers"] ?? 0;

  return {
    allowed: limit === -1 || current < limit,
    limit,
    current,
  };
}
```

Use in API routes:
```ts
const check = await checkPlanLimit(session.workspaceId, "subscribers");
if (!check.allowed) {
  return NextResponse.json(
    { error: `Subscriber limit reached (${check.limit}). Upgrade your plan.`, code: "PLAN_LIMIT" },
    { status: 403 }
  );
}
```

---

## Prisma Schema (Billing Fields)

```prisma
model Workspace {
  id             String    @id @default(cuid())
  plan           String    @default("free")   // "free" | "starter" | "pro"
  flwCustomerId  String?
  flwSubId       String?   // Flutterwave subscription ID
  planExpiresAt  DateTime?
  // ...
}
```

---

## Error Handling

- On webhook signature failure → log and return `400` (do not retry).
- On DB update failure after webhook → return `500` so Flutterwave retries.
- Never expose Flutterwave error details to the end user — return a generic message.