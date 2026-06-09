import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type FlutterwaveEvent = {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    status: string;
    customer: { email: string };
    meta: { userId?: string; plan?: string };
    amount: number;
    currency: string;
    payment_plan?: string;
  };
};

/**
 * Verify the webhook signature using the verif-hash header.
 * Flutterwave sends your secret hash; compare it directly.
 */
function verifySignature(req: Request): boolean {
  const signature = req.headers.get("verif-hash");
  return signature === process.env.FLUTTERWAVE_WEBHOOK_SECRET;
}

export async function POST(req: Request) {
  // 1. Verify signature first — reject immediately if invalid
  if (!verifySignature(req)) {
    console.warn("[Flutterwave Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: FlutterwaveEvent;

  try {
    event = (await req.json()) as FlutterwaveEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log(`[Flutterwave Webhook] Event: ${event.event}`, {
    txRef: event.data.tx_ref,
    status: event.data.status,
  });

  try {
    switch (event.event) {
      case "charge.completed":
        await handleChargeCompleted(event);
        break;

      case "subscription.activated":
      case "subscription.renewed":
        await handleSubscriptionActive(event);
        break;

      case "subscription.cancelled":
        await handleSubscriptionCancelled(event);
        break;

      default:
        // Unknown event — log and ignore gracefully
        console.log(`[Flutterwave Webhook] Unhandled event: ${event.event}`);
    }
  } catch (err) {
    // Return 500 so Flutterwave retries the delivery
    console.error("[Flutterwave Webhook] Processing error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  // Always return 200 after successful processing
  return NextResponse.json({ received: true }, { status: 200 });
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleChargeCompleted(event: FlutterwaveEvent) {
  const { data } = event;

  if (data.status !== "successful") {
    console.log("[Flutterwave] Ignoring non-successful charge:", data.status);
    return;
  }

  const plan = data.meta?.plan as "starter" | "pro" | undefined;
  if (!plan) {
    console.warn("[Flutterwave] charge.completed missing plan in meta");
    return;
  }

  // Look up workspace by the user email on the payment
  const user = await db.user.findUnique({
    where: { email: data.customer.email },
    select: { workspaceId: true },
  });

  if (!user?.workspaceId) {
    console.warn("[Flutterwave] No workspace found for:", data.customer.email);
    return;
  }

  // Set plan — expiry is 30 days from now for one-time charges
  // (Subscription renewals are handled by subscription.renewed event)
  await db.workspace.update({
    where: { id: user.workspaceId },
    data: {
      plan,
      planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`[Flutterwave] Upgraded workspace ${user.workspaceId} to ${plan}`);
}

async function handleSubscriptionActive(event: FlutterwaveEvent) {
  const { data } = event;

  const plan = data.meta?.plan as "starter" | "pro" | undefined;
  if (!plan) return;

  const user = await db.user.findUnique({
    where: { email: data.customer.email },
    select: { workspaceId: true },
  });

  if (!user?.workspaceId) return;

  await db.workspace.update({
    where: { id: user.workspaceId },
    data: {
      plan,
      flwSubId: String(data.id),
      // Renew for another 30 days
      planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`[Flutterwave] Subscription active/renewed for workspace ${user.workspaceId}`);
}

async function handleSubscriptionCancelled(event: FlutterwaveEvent) {
  const { data } = event;

  const user = await db.user.findUnique({
    where: { email: data.customer.email },
    select: { workspaceId: true },
  });

  if (!user?.workspaceId) return;

  // Downgrade to free on cancellation
  await db.workspace.update({
    where: { id: user.workspaceId },
    data: {
      plan: "free",
      flwSubId: null,
      planExpiresAt: null,
    },
  });

  console.log(`[Flutterwave] Subscription cancelled — workspace ${user.workspaceId} downgraded to free`);
}